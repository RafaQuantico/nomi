// URL obtenida al desplegar el Google Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxYPHoVyq85WLhFiGwJ8yN1cLDQRV-khn1jOWyKC0lP_6sBlnPnb6XxX2gfxxAaM7iv/exec';

export async function uploadLearningCareData(
  studentId: string, 
  scores: any, 
  routeResult: string, 
  audioBase64?: string
) {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId,
        scores,
        routeResult,
        audioBase64,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error uploading data to Google:', error);
    throw error;
  }
}
