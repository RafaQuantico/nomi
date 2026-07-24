import { useRef, useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done';

interface UseAudioRecorderProps {
  uuid: string;
  passkey: string;
  eventPhase: string;
  onTranscript?: (text: string) => void;
  onPartialTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onStatus?: (text: string) => void;
  disableWebsocket?: boolean;
}

export function useAudioRecorder({
  onStatus,
}: UseAudioRecorderProps) {
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [metering, setMetering] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [finalUri, setFinalUri] = useState<string | null>(null);

  // Web specific refs
  const webMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webChunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    try {
      if (Platform.OS === 'web') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Recorder para el archivo final
        const fileMediaRecorder = new MediaRecorder(stream);
        webMediaRecorderRef.current = fileMediaRecorder;
        webChunksRef.current = [];

        // Guardar el archivo final intacto
        fileMediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            webChunksRef.current.push(e.data);
          }
        };

        // Simular metering básico en web para animación
        chunkIntervalRef.current = setInterval(() => {
          setMetering(Math.random() * 0.5 + 0.5); 
        }, 100);

        fileMediaRecorder.start(); // sin timeslice!
        
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
        }
      );
      recordingRef.current = recording;
      setRecordingState('recording');
      onStatus?.('Escuchando... habla ahora.');

    } catch (error: any) {
      onStatus?.(`Error al iniciar grabación: ${error.message}`);
      setRecordingState('idle');
    }
  }, [onStatus]);

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
        const currentMime = webMediaRecorderRef.current.mimeType || 'audio/webm';

        return new Promise<string | null>((resolve) => {
          webMediaRecorderRef.current!.onstop = () => {
            const finalBlob = new Blob(webChunksRef.current, { type: currentMime });
            uri = URL.createObjectURL(finalBlob);
            setFinalUri(uri);
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

    return uri;
  }, []);

  const reset = useCallback(() => {
    setRecordingState('idle');
    setMetering(0);
    setFinalUri(null);
    webChunksRef.current = [];
  }, []);

  return { recordingState, metering, finalUri, startRecording, stopRecording, reset };
}
