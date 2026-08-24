with open("NOMI_GoogleAppsScript.js", "r") as f:
    content = f.read()

target = """function handleTestCompleted(data) {
  const { email, nickname, uuid, eventPhase, completedAt, audios, samnPerelli } = data;
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const userFolder = getOrCreateSubfolder(folder, `${nickname} (${uuid.slice(0, 8)})`);
  
  const d = new Date(completedAt);
  const dateStr = d.toLocaleDateString('es-CL');
  const timeStr = d.toLocaleTimeString('es-CL');
  const driveLinks = [];

  if (audios && audios.length > 0) {
    audios.forEach((audio) => {
      try {
        let extension = '.wav';
        const decoded = Utilities.newBlob(Utilities.base64Decode(audio.base64), audio.mimeType || 'audio/wav', `${audio.label}${extension}`);
        const file = userFolder.createFile(decoded);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        driveLinks.push({ label: audio.label, url: file.getUrl() });
      } catch (err) {
        driveLinks.push({ label: audio.label, url: 'Error al subir: ' + err.message });
      }
    });
  }

  const doc = SpreadsheetApp.openById(MASTER_SHEET_ID);
  const sheetName = `Fatiga_${nickname}_${uuid.slice(0, 8)}`;
  let sheet = doc.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
    sheet.getRange(5, 1, 1, 6).setValues([['Fecha', 'Hora', 'Fase', 'Escala Samn-Perelli', 'Audio Frase', 'Audio Abierta']]);
    sheet.getRange(5, 1, 1, 6).setFontWeight('bold').setBackground('#000').setFontColor('#fff');
    sheet.setFrozenRows(5);
  }
  
  let lastRow = sheet.getLastRow();
  if (lastRow < 5) lastRow = 5;
  
  sheet.getRange(lastRow + 1, 1, 1, 6).setValues([[
    dateStr, 
    timeStr, 
    eventPhase === 'activo' ? 'Activo (AM)' : 'Cansado (PM)', 
    samnPerelli || 'No registrada',
    driveLinks[0]?.url || 'No subido', 
    driveLinks[1]?.url || 'No subido'
  ]]);"""

replacement = """function handleTestCompleted(data) {
  const { email, nickname, uuid, eventPhase, completedAt, audios, samnPerelli } = data;
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const userFolder = getOrCreateSubfolder(folder, `${nickname} (${uuid.slice(0, 8)})`);
  
  const d = new Date(completedAt);
  const dateStr = d.toLocaleDateString('es-CL');
  const timeStr = d.toLocaleTimeString('es-CL');
  const yyyymmdd = d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');

  const doc = SpreadsheetApp.openById(MASTER_SHEET_ID);
  const sheetName = `Fatiga_${nickname}_${uuid.slice(0, 8)}`;
  let sheet = doc.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = doc.insertSheet(sheetName);
    sheet.getRange(5, 1, 1, 6).setValues([['Fecha', 'Hora', 'Fase', 'Escala Samn-Perelli', 'Audio Frase', 'Audio Abierta']]);
    sheet.getRange(5, 1, 1, 6).setFontWeight('bold').setBackground('#000').setFontColor('#fff');
    sheet.setFrozenRows(5);
  }
  
  let lastRow = sheet.getLastRow();
  if (lastRow < 5) lastRow = 5;
  const sampleNumber = lastRow - 4; // Si lastRow es 5, no hay datos todavia, muestra 1
  
  const driveLinks = [];

  if (audios && audios.length > 0) {
    audios.forEach((audio) => {
      try {
        let extension = '.wav';
        let safeNickname = nickname.replace(/\\s+/g, '_').toLowerCase();
        let safePhase = eventPhase === 'activo' ? 'am' : 'pm';
        let safeLabel = audio.label.replace(/\\s+/g, '_').toLowerCase(); // "Paso 1" -> "paso_1"
        
        // Formato: fecha_usuario_numero_fase_paso.wav
        const fileName = `${yyyymmdd}_${safeNickname}_${sampleNumber}_${safePhase}_${safeLabel}${extension}`;
        const decoded = Utilities.newBlob(Utilities.base64Decode(audio.base64), audio.mimeType || 'audio/wav', fileName);
        const file = userFolder.createFile(decoded);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        driveLinks.push({ label: audio.label, url: file.getUrl() });
      } catch (err) {
        driveLinks.push({ label: audio.label, url: 'Error al subir: ' + err.message });
      }
    });
  }

  sheet.getRange(lastRow + 1, 1, 1, 6).setValues([[
    dateStr, 
    timeStr, 
    eventPhase === 'activo' ? 'Activo (AM)' : 'Cansado (PM)', 
    samnPerelli || 'No registrada',
    driveLinks[0]?.url || 'No subido', 
    driveLinks[1]?.url || 'No subido'
  ]]);"""

if target in content:
    content = content.replace(target, replacement)
    with open("NOMI_GoogleAppsScript.js", "w") as f:
        f.write(content)
    print("Patched successfully")
else:
    print("Target not found in file")
