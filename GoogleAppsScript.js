/**
 * IMPLEMENTACIÓN DE GOOGLE APPS SCRIPT
 * 
 * Instrucciones para el usuario:
 * 1. Ve a https://script.google.com/ y crea un nuevo proyecto.
 * 2. Pega este código reemplazando todo lo que haya.
 * 3. Haz clic en "Implementar" > "Nueva implementación".
 * 4. Tipo: "Aplicación web".
 * 5. Ejecutar como: "Yo".
 * 6. Quién tiene acceso: "Cualquier persona".
 * 7. Copia la "URL de la aplicación web" resultante y ponla en src/services/googleService.ts.
 */

const FOLDER_ID = '1RW1-zV913jCWn7iRR0Zbw_1J78ff5rVK';
const SPREADSHEET_ID = '1dIvgDFbUfhodtVkJ308VnbxqwAEjzqbYMUHP582Km_4';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const { studentId, scores, routeResult, audioBase64 } = data;

    let audioUrl = '';

    // 1. Guardar Audio en Google Drive
    if (audioBase64) {
      const folder = DriveApp.getFolderById(FOLDER_ID);
      const decodedAudio = Utilities.base64Decode(audioBase64);
      const blob = Utilities.newBlob(decodedAudio, 'audio/wav', `audio_${studentId}_${new Date().getTime()}.wav`);
      const file = folder.createFile(blob);
      audioUrl = file.getUrl();
    }

    // 2. Guardar en Google Sheets
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();

    // Columnas: Fecha, ID Estudiante, Puntaje KIDSCREEN, Puntaje GAD-7, Puntaje PHQ-9, Ítem Sensible, Ruta, Audio URL
    sheet.appendRow([
      new Date(),
      studentId,
      scores.k,
      scores.g,
      scores.p,
      scores.s,
      routeResult,
      audioUrl
    ]);

    return ContentService.createTextOutput(JSON.stringify({ success: true, message: 'Datos guardados correctamente' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
