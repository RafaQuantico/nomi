import { useRef, useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

const WS_URL = 'wss://nomi-dev.merlin-lab.com/ws';
const CHUNK_INTERVAL_MS = 250; // Intervalo de lectura de chunks del archivo temporal

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done';

interface UseAudioRecorderProps {
  uuid: string;
  passkey: string;
  eventPhase: string;
  onTranscript?: (text: string) => void;
  onPartialTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onStatus?: (text: string) => void;
}

export function useAudioRecorder({
  uuid,
  passkey,
  eventPhase,
  onTranscript,
  onPartialTranscript,
  onResponse,
  onStatus,
}: UseAudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [metering, setMetering] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastFileSizeRef = useRef(0);
  const [finalUri, setFinalUri] = useState<string | null>(null);

  // Web specific refs
  const webMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        webMediaRecorderRef.current = mediaRecorder;
        webChunksRef.current = [];

        const ws = new WebSocket(WS_URL);
        socketRef.current = ws;
        ws.binaryType = 'arraybuffer';

        ws.addEventListener('open', () => {
          ws.send(JSON.stringify({ type: 'auth', uuid, passkey, eventPhase }));
        });

        ws.addEventListener('message', (event) => {
          if (typeof event.data !== 'string') return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'status') onStatus?.(data.message);
            else if (data.type === 'partial_transcript') onPartialTranscript?.(data.text + '...');
            else if (data.type === 'transcript') onTranscript?.(data.text);
            else if (data.type === 'response') onResponse?.(data.text);
            else if (data.type === 'auth_error') {
              onStatus?.(data.message);
              stopRecording();
            }
          } catch { /* silenciar errores JSON */ }
        });

        mediaRecorder.ondataavailable = async (e) => {
          if (e.data.size > 0) {
            webChunksRef.current.push(e.data);
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              const buffer = await e.data.arrayBuffer();
              socketRef.current.send(buffer);
            }
          }
        };

        // Simular metering básico en web para animación
        chunkIntervalRef.current = setInterval(() => {
          setMetering(Math.random() * 0.5 + 0.5); 
        }, 100);

        mediaRecorder.start(CHUNK_INTERVAL_MS);
        setRecordingState('recording');
        onStatus?.('Escuchando... habla ahora.');
        return;
      }

      // Native implementation
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        onStatus?.('Permisos de micrófono denegados.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        {
          ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
          isMeteringEnabled: true,
        },
        (status) => {
          if (status.metering !== undefined) {
            const normalized = Math.max(0, (status.metering + 60) / 60);
            setMetering(normalized);
          }
        },
        100
      );
      recordingRef.current = recording;
      lastFileSizeRef.current = 0;
      setRecordingState('recording');
      onStatus?.('Escuchando... habla ahora.');

      const ws = new WebSocket(WS_URL);
      socketRef.current = ws;
      ws.binaryType = 'arraybuffer';

      ws.addEventListener('open', () => {
        ws.send(JSON.stringify({ type: 'auth', uuid, passkey, eventPhase }));
      });

      ws.addEventListener('message', (event) => {
        if (typeof event.data !== 'string') return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') onStatus?.(data.message);
          else if (data.type === 'partial_transcript') onPartialTranscript?.(data.text + '...');
          else if (data.type === 'transcript') onTranscript?.(data.text);
          else if (data.type === 'response') onResponse?.(data.text);
          else if (data.type === 'auth_error') {
            onStatus?.(data.message);
            stopRecording();
          }
        } catch { /* silenciar errores JSON */ }
      });

      chunkIntervalRef.current = setInterval(async () => {
        if (!recordingRef.current) return;
        const uri = recordingRef.current.getURI();
        if (!uri) return;

        try {
          const fileInfo = await FileSystem.getInfoAsync(uri);
          if (!fileInfo.exists) return;
          const currentSize = fileInfo.size ?? 0;
          if (currentSize <= lastFileSizeRef.current) return;

          const chunk = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
            position: lastFileSizeRef.current,
            length: currentSize - lastFileSizeRef.current,
          });

          lastFileSizeRef.current = currentSize;

          if (socketRef.current?.readyState === WebSocket.OPEN) {
            const binaryString = atob(chunk);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            socketRef.current.send(bytes.buffer);
          }
        } catch { /* Ignorar errores */ }
      }, CHUNK_INTERVAL_MS);

    } catch (error: any) {
      onStatus?.(`Error al iniciar grabación: ${error.message}`);
      setRecordingState('idle');
    }
  }, [uuid, passkey, eventPhase]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }

    setRecordingState('processing');
    setMetering(0);
    let uri: string | null = null;

    if (Platform.OS === 'web') {
      if (webMediaRecorderRef.current && webMediaRecorderRef.current.state !== 'inactive') {
        return new Promise<string | null>((resolve) => {
          webMediaRecorderRef.current!.onstop = () => {
            const finalBlob = new Blob(webChunksRef.current, { type: 'audio/webm' });
            uri = URL.createObjectURL(finalBlob);
            setFinalUri(uri);
            
            if (socketRef.current?.readyState === WebSocket.OPEN) {
              socketRef.current.send(JSON.stringify({ type: 'audio_end' }));
            }
            resolve(uri);
          };
          webMediaRecorderRef.current!.stop();
          // Detener pistas del micrófono para que no se quede encendido en el navegador
          webMediaRecorderRef.current!.stream.getTracks().forEach(track => track.stop());
        });
      }
    } else {
      if (recordingRef.current) {
        try {
          await recordingRef.current.stopAndUnloadAsync();
          uri = recordingRef.current.getURI() ?? null;
          setFinalUri(uri);
        } catch { /* ignorar si ya estaba detenido */ }
        recordingRef.current = null;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    }

    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'audio_end' }));
    }

    return uri;
  }, []);

  const reset = useCallback(() => {
    setRecordingState('idle');
    setMetering(0);
    setFinalUri(null);
    lastFileSizeRef.current = 0;
    webChunksRef.current = [];
  }, []);

  return { recordingState, metering, finalUri, startRecording, stopRecording, reset };
}
