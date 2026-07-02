import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// 🔧 Reemplaza esta URL con la que te genera Google Apps Script al publicar
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzuckGDrAO4FXJvhTS08XbYDQyGmiVS-masTb7Ov3lHu8sDZpOV8_vpudET0b7NXkZe/exec';

export interface WelcomeEmailPayload {
  email: string;
  nickname: string;
  deepLinkUrl: string;
}

export interface AudioPayload {
  label: string;
  uri: string;
  mimeType: string;
}

export interface TestCompletedPayload {
  email: string;
  nickname: string;
  uuid: string;
  eventPhase: 'activo' | 'cansado';
  completedAt: string;
  audioUris: AudioPayload[];
}

export async function sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<void> {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'welcome_email', ...payload }),
      mode: 'no-cors',
    });
  } catch (error) {
    console.warn('Error sending welcome email:', error);
  }
}

// Función auxiliar para leer blob a base64 en web
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export async function sendTestCompletedWebhook(payload: TestCompletedPayload): Promise<void> {
  try {
    // Convertir cada archivo de audio a base64
    const audios = await Promise.all(
      payload.audioUris.map(async (audio) => {
        try {
          let base64 = '';
          if (Platform.OS === 'web') {
            const response = await fetch(audio.uri);
            const blob = await response.blob();
            base64 = await blobToBase64(blob);
          } else {
            base64 = await FileSystem.readAsStringAsync(audio.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
          }
          return { label: audio.label, base64, mimeType: audio.mimeType };
        } catch {
          return { label: audio.label, base64: '', mimeType: audio.mimeType };
        }
      })
    );

    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: 'test_completed',
        email: payload.email,
        nickname: payload.nickname,
        uuid: payload.uuid,
        eventPhase: payload.eventPhase,
        completedAt: payload.completedAt,
        audios,
      }),
      mode: 'no-cors',
    });
  } catch (error) {
    console.warn('Error sending test completed:', error);
  }
}
