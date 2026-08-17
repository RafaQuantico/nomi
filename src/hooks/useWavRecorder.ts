import { useState, useRef, useCallback } from "react";

export function useWavRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const audioDataRef = useRef<Float32Array[]>([]);
  const recordingStartTime = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Force 48000 Hz sample rate
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext({ sampleRate: 48000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;

      // Create a ScriptProcessorNode with a bufferSize of 4096 and a single input and output channel (Mono)
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      audioDataRef.current = [];

      processor.onaudioprocess = (e) => {
        if (!isRecording) return;
        const inputData = e.inputBuffer.getChannelData(0);
        // We must clone the data because the browser reuses the buffer
        audioDataRef.current.push(new Float32Array(inputData));
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
      recordingStartTime.current = Date.now();
    } catch (error) {
      console.error("Error starting recording:", error);
      throw error;
    }
  }, [isRecording]);

  const stopRecording = useCallback(async (): Promise<{ base64: string; duration: number } | null> => {
    setIsRecording(false);
    
    if (processorRef.current && sourceRef.current) {
      sourceRef.current.disconnect();
      processorRef.current.disconnect();
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      await audioContextRef.current.close();
    }

    const duration = Date.now() - recordingStartTime.current;

    // Flatten all the Float32Arrays into one
    let totalLength = 0;
    for (const buf of audioDataRef.current) {
      totalLength += buf.length;
    }
    
    const flattenedData = new Float32Array(totalLength);
    let offset = 0;
    for (const buf of audioDataRef.current) {
      flattenedData.set(buf, offset);
      offset += buf.length;
    }

    // Convert Float32 (from -1 to 1) to Int16 (-32768 to 32767)
    const int16Data = new Int16Array(totalLength);
    for (let i = 0; i < totalLength; i++) {
      let s = Math.max(-1, Math.min(1, flattenedData[i]));
      int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }

    // Create WAV header
    const sampleRate = 48000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    
    const dataSize = int16Data.length * 2;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);
    
    // RIFF chunk descriptor
    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + dataSize, true); // Chunk size
    writeString(view, 8, "WAVE");
    
    // fmt sub-chunk
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, byteRate, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true); // BitsPerSample
    
    // data sub-chunk
    writeString(view, 36, "data");
    view.setUint32(40, dataSize, true); // Subchunk2Size
    
    // Write PCM data
    let offsetData = 44;
    for (let i = 0; i < int16Data.length; i++, offsetData += 2) {
      view.setInt16(offsetData, int16Data[i], true);
    }
    
    // Convert ArrayBuffer to Base64
    const base64String = arrayBufferToBase64(buffer);
    
    return { base64: base64String, duration };
  }, []);

  return { isRecording, startRecording, stopRecording };
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
