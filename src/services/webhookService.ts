import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Proxy en Vercel — evita CORS al llamar a Google Apps Script
// En desarrollo local, usamos la URL directa de Apps Script con 'no-cors'
const isDev = process.env.NODE_ENV === 'development';
const APPS_SCRIPT_URL = isDev
  ? 'https://script.google.com/macros/s/AKfycbzuckGDrAO4FXJvhTS08XbYDQyGmiVS-masTb7Ov3lHu8sDZpOV8_vpudET0b7NXkZe/exec'
  : '/api/webhook';

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

export interface MentalHealthCompletedPayload {
  email: string;
  nickname: string;
  uuid: string;
  target: 'escolar' | 'universitario';
  answers: string[];
  textResponse: string;
  audioUri?: AudioPayload;
  completedAt: string;
}

export async function sendWelcomeEmail(payload: WelcomeEmailPayload): Promise<void> {
  try {
    await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: isDev ? 'no-cors' : 'cors',
      headers: { 'Content-Type': isDev ? 'text/plain' : 'application/json' },
      body: JSON.stringify({ action: 'welcome_email', ...payload }),
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
              encoding: 'base64',
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
      mode: isDev ? 'no-cors' : 'cors',
      headers: { 'Content-Type': isDev ? 'text/plain' : 'application/json' },
      body: JSON.stringify({
        action: 'test_completed',
        email: payload.email,
        nickname: payload.nickname,
        uuid: payload.uuid,
        eventPhase: payload.eventPhase,
        completedAt: payload.completedAt,
        audios,
      }),
    });
  } catch (error) {
    console.warn('Error sending test completed:', error);
  }
}

export async function sendMentalHealthCompletedWebhook(payload: MentalHealthCompletedPayload): Promise<void> {
  try {
    let base64 = '';
    
    if (payload.audioUri) {
      if (Platform.OS === 'web') {
        const response = await fetch(payload.audioUri.uri);
        const blob = await response.blob();
        base64 = await blobToBase64(blob);
      } else {
        base64 = await FileSystem.readAsStringAsync(payload.audioUri.uri, {
          encoding: 'base64',
        });
      }
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      mode: isDev ? 'no-cors' : 'cors',
      headers: { 'Content-Type': isDev ? 'text/plain' : 'application/json' },
      body: JSON.stringify({
        action: 'mental_health_completed',
        email: payload.email,
        nickname: payload.nickname,
        uuid: payload.uuid,
        target: payload.target,
        answers: payload.answers,
        textResponse: payload.textResponse,
        audio: base64 ? {
          base64,
          mimeType: payload.audioUri?.mimeType,
          label: payload.audioUri?.label
        } : null,
        completedAt: payload.completedAt,
      }),
    });

    if (isDev && response.type === 'opaque') {
      // En modo local no-cors, la respuesta es opaca. Asumimos éxito si no lanzó excepción el fetch.
      return;
    }

    const responseText = await response.text();
    if (!response.ok) {
      console.error('Webhook error response:', responseText);
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
    // Opcional: verificar si Google Apps script devolvió error en JSON
    try {
      const json = JSON.parse(responseText);
      if (json.status === 'error' || json.ok === false) {
        console.error('Google Apps Script devolvió error:', json.error || 'Acción desconocida');
        throw new Error(`Error de Apps Script: ${json.error || 'Acción desconocida'}`);
      }
    } catch (e) {
      if (e instanceof Error && e.message.includes('Error de Apps Script')) {
        throw e;
      }
      // no es JSON o no hay error, está bien
    }
    
  } catch (error) {
    console.error('Error sending mental health completed:', error);
    throw error;
  }
}
