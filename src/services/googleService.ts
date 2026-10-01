// URL obtenida al desplegar el Google Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzXG97kmUbEm0A8MIEKNGEF_whVlcrQT8mQ0AIIR4ZxTLZ73ffqKNruoVb-gNd4jZ36/exec';

export async function uploadLearningCareData(
  studentId: string, 
  scores: any, 
  routeResult: string, 
  audioBase64?: string
) {
  try {
    // Limpiar el base64 si trae prefijo 'data:audio/wav;base64,'
    let cleanAudio = audioBase64;
    if (cleanAudio && cleanAudio.includes(',')) {
      cleanAudio = cleanAudio.split(',')[1];
    }

    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        // text/plain evita el preflight (OPTIONS) que bloquea CORS en Apps Script
        'Content-Type': 'text/plain;charset=utf-8',
      },
      redirect: 'follow', // Importante para las redirecciones de Google
      body: JSON.stringify({
        studentId,
        scores,
        routeResult,
        audioBase64: cleanAudio,
      }),
    });

    const result = await response.text();
    console.log("Google Apps Script Response:", result);
    return result;
  } catch (error) {
    console.error('Error uploading data to Google:', error);
    throw error;
  }
}
