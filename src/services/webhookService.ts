import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';

// Proxy en Vercel — evita CORS al llamar a Google Apps Script
// En desarrollo local, usamos la URL productiva de Vercel para evitar fallos por CORS
const isDev = process.env.NODE_ENV === 'development';
const APPS_SCRIPT_URL = isDev
  ? 'https://nomi-app-web.vercel.app/api/webhook'
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
  initialAudioUri?: AudioPayload;
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
    
    let base64Initial = '';
    
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
    
    if (payload.initialAudioUri) {
      if (Platform.OS === 'web') {
        const response = await fetch(payload.initialAudioUri.uri);
        const blob = await response.blob();
        base64Initial = await blobToBase64(blob);
      } else {
        base64Initial = await FileSystem.readAsStringAsync(payload.initialAudioUri.uri, {
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
        initialAudio: base64Initial ? {
          base64: base64Initial,
          mimeType: payload.initialAudioUri?.mimeType,
          label: payload.initialAudioUri?.label
        } : null,
        completedAt: payload.completedAt,
        appUrl: Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : 'nomi-app://'
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

export interface DashboardData {
  target: string;
  route: string;
  textResponse: string;
}

export async function fetchDashboardData(): Promise<DashboardData[]> {
  try {
    // Para el dashboard usamos la URL directa de Google Apps Script. 
    // Las peticiones GET de Apps Script (doGet) ya devuelven los headers CORS automáticamente si se devuelve ContentService.MimeType.JSON
    // Esto evita pasar por el proxy de Vercel y tener problemas de "Empty body received" por reescritura de peticiones.
    const directUrl = 'https://script.google.com/macros/s/AKfycbzuckGDrAO4FXJvhTS08XbYDQyGmiVS-masTb7Ov3lHu8sDZpOV8_vpudET0b7NXkZe/exec?action=get_dashboard_data';
    const response = await fetch(directUrl, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const json = await response.json();
    if (json.status === 'success') {
      return json.data || [];
    } else {
      throw new Error(json.error || 'Unknown error');
    }
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
}

export async function registerUserWebhook(email: string, nickname: string, passkey: string): Promise<{uuid: string, email: string, nickname: string}> {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'register_user', email, nickname, passkey }),
  });
  
  const json = await response.json();
  if (json.success) {
    return json.user;
  } else {
    throw new Error(json.error || 'Error al registrar usuario en el servidor.');
  }
}

export async function loginUserWebhook(identifier: string, passkey: string): Promise<{uuid: string, email: string, nickname: string}> {
  const response = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'login_user', identifier, passkey }),
  });
  
  const json = await response.json();
  if (json.success) {
    return json.user;
  } else {
    throw new Error(json.error || 'Credenciales incorrectas o usuario no encontrado.');
  }
}

