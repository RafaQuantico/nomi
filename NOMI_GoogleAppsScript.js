/**
 * NOMI - Google Apps Script Backend (CENTRALIZADO)
 * ====================================
 * INSTRUCCIONES DE INSTALACIÓN:
 * 1. Ve a https://script.google.com y abre tu proyecto actual.
 * 2. REEMPLAZA todo el código con este nuevo.
 * 3. En el menú: Implementar → Administrar implementaciones (o Nueva implementación si prefieres crear otra).
 *    - Tipo: App web
 *    - Ejecutar como: Tú (tu cuenta Google)
 *    - Quién tiene acceso: Cualquier usuario
 * 4. ¡Listo! Ya todo quedará apuntando a tu nueva planilla y en las nuevas pestañas.
 */

// ============================================================
// 🔧 CONFIGURACIÓN — PLANILLA CENTRALIZADA
// ============================================================
const MASTER_SHEET_ID = '1-1MFVZrSPuh5tk0wqxmMc4YI3YrCJ0ONAu6j9q7qSk8';

const TAB_REGISTRO = 'REGISTRO NOMI';
const TAB_FATIGA = 'RESPUESTAS FATIGA';
const TAB_SM_ESCOLARES = 'RESPUESTAS SM ESCOLARES';
const TAB_SM_UNIVERSITARIOS = 'RESPUESTAS SM UNIVERSITARIOS';

// ============================================================
// 🔧 CONFIGURACIÓN — CARPETAS GOOGLE DRIVE (AUDIOS)
// ============================================================
const DRIVE_FOLDER_ID = '1ql9TfQSDNRoCffcujsIgnK3ygFJ8wmc9'; // Fatiga
const MENTAL_HEALTH_ESCOLAR_DRIVE_FOLDER_ID = "1ZvVDMhi03PmkOAQjjaf2fr3Y3aBjHUBD"; // SM Escolar
const MENTAL_HEALTH_UNI_DRIVE_FOLDER_ID = "1l-QWOXTk9ql7uvdm9SOoAS5rQoUCELzE"; // SM Universitario

// ============================================================
// 🔧 CONFIGURACIÓN — CORREOS ADMIN
// ============================================================
const ADMIN_NOTIFICATION_EMAIL = "rafael@quantico.cl";
const FROM_NAME = 'NOMI';
const APP_NAME = 'NOMI Voice Test';

// ============================================================
// MANEJO DE PETICIONES HTTP
// ============================================================

// Manejar CORS preflight (OPTIONS)
function doOptions(e) {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doGet(e) {
  try {
    const action = e.parameter.action;
    
    if (action !== 'get_dashboard_data') {
       return ContentService.createTextOutput("Servicio NOMI Centralizado Activo").setMimeType(ContentService.MimeType.TEXT);
    }
    
    // Abrir la planilla maestra
    const doc = SpreadsheetApp.openById(MASTER_SHEET_ID);
    
    // Leer datos Escolar
    const sheetEscolar = doc.getSheetByName(TAB_SM_ESCOLARES);
    const dataEscolar = sheetEscolar ? sheetEscolar.getDataRange().getValues() : [];
    
    // Leer datos Universitario
    const sheetUni = doc.getSheetByName(TAB_SM_UNIVERSITARIOS);
    const dataUni = sheetUni ? sheetUni.getDataRange().getValues() : [];
    
    // Función para mapear
    function mapSheetData(data, defaultTarget) {
      if (!data || data.length <= 1) return [];
      
      const headers = data[0];
      const targetCol = headers.findIndex(h => h && h.toString().toLowerCase().includes('público'));
      const responseCol = headers.findIndex(h => h && h.toString().toLowerCase().includes('escrita'));
      const routeCol = headers.findIndex(h => h && h.toString().toLowerCase().includes('ruta'));
      
      // Buscar columnas de preguntas P1 a P6
      const p1Col = headers.findIndex(h => h && h.toString().toLowerCase().includes('p1:'));
      const p2Col = headers.findIndex(h => h && h.toString().toLowerCase().includes('p2:'));
      const p3Col = headers.findIndex(h => h && h.toString().toLowerCase().includes('p3:'));
      const p4Col = headers.findIndex(h => h && h.toString().toLowerCase().includes('p4:'));
      const p5Col = headers.findIndex(h => h && h.toString().toLowerCase().includes('p5:'));
      const p6Col = headers.findIndex(h => h && h.toString().toLowerCase().includes('p6:'));
      
      const rows = data.slice(1);
      return rows.map(row => {
        return {
          target: targetCol >= 0 ? (row[targetCol] || defaultTarget) : defaultTarget,
          textResponse: responseCol >= 0 ? (row[responseCol] || '') : '',
          route: routeCol >= 0 ? (row[routeCol] || 'Sin clasificar') : 'Sin clasificar',
          q1: p1Col >= 0 ? (row[p1Col] || '') : '',
          q2: p2Col >= 0 ? (row[p2Col] || '') : '',
          q3: p3Col >= 0 ? (row[p3Col] || '') : '',
          q4: p4Col >= 0 ? (row[p4Col] || '') : '',
          q5: p5Col >= 0 ? (row[p5Col] || '') : '',
          q6: p6Col >= 0 ? (row[p6Col] || '') : ''
        };
      });
    }
    
    const escolarMapped = mapSheetData(dataEscolar, 'escolar');
    const uniMapped = mapSheetData(dataUni, 'universitario');
    const allData = escolarMapped.concat(uniMapped);
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      data: allData 
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      error: err.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    let rawBody = '';
    if (e.postData && e.postData.contents) {
      rawBody = e.postData.contents;
    } else if (e.parameter && e.parameter.data) {
      rawBody = e.parameter.data;
    }

    if (!rawBody) {
      return ContentService.createTextOutput(
        JSON.stringify({ ok: false, error: 'Empty body received' })
      ).setMimeType(ContentService.MimeType.JSON);
    }

    const data = JSON.parse(rawBody);

    // Ruteo de acciones
    if (data.action === 'welcome_email') return handleWelcomeEmail(data);
    if (data.action === 'test_completed') return handleTestCompleted(data);
    if (data.action === 'mental_health_completed') return handleMentalHealthCompleted(data);
    if (data.action === 'register_user') return handleRegisterUser(data);
    if (data.action === 'login_user') return handleLoginUser(data);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: 'Unknown action: ' + data.action })
    ).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: err.message, stack: err.stack })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// -------------------------------------------------------
// ACCIÓN: REGISTRO DE USUARIO NOMI
// -------------------------------------------------------
function handleRegisterUser(data) {
  var doc = SpreadsheetApp.openById(MASTER_SHEET_ID);
  var usersSheet = doc.getSheetByName(TAB_REGISTRO);
  
  if (!usersSheet) {
    usersSheet = doc.insertSheet(TAB_REGISTRO);
    usersSheet.appendRow(["Timestamp", "UUID", "Nickname", "Email", "Passkey"]);
  }
  
  var email = data.email || "";
  var passkey = data.passkey || "";
  var nickname = data.nickname || "";
  var uuid = data.uuid || Utilities.getUuid();
  
  // Revisar si el email ya existe
  var dataRange = usersSheet.getDataRange().getValues();
  for (var i = 1; i < dataRange.length; i++) {
    if (dataRange[i][3] === email) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: false, 
        error: "El correo ya está registrado." 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  // Guardar nuevo usuario
  usersSheet.appendRow([new Date(), uuid, nickname, email, passkey]);
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true, 
    user: { uuid: uuid, nickname: nickname, email: email } 
  })).setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------
// ACCIÓN: LOGIN DE USUARIO NOMI
// -------------------------------------------------------
function handleLoginUser(data) {
  var doc = SpreadsheetApp.openById(MASTER_SHEET_ID);
  var usersSheet = doc.getSheetByName(TAB_REGISTRO);
  
  if (!usersSheet) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      error: "No hay usuarios registrados." 
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  var identifier = data.identifier || ""; // puede ser email, nickname o uuid
  var passkey = data.passkey || "";
  
  var dataRange = usersSheet.getDataRange().getValues();
  for (var i = 1; i < dataRange.length; i++) {
    var rowUuid = dataRange[i][1];
    var rowNickname = dataRange[i][2];
    var rowEmail = dataRange[i][3];
    var rowPasskey = dataRange[i][4];
    
    if ((identifier === rowEmail || identifier === rowNickname || identifier === rowUuid) && passkey === String(rowPasskey)) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true, 
        user: { uuid: rowUuid, nickname: rowNickname, email: rowEmail } 
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    success: false, 
    error: "Credenciales incorrectas o usuario no encontrado." 
  })).setMimeType(ContentService.MimeType.JSON);
}


// -------------------------------------------------------
// ACCIÓN: Enviar correo de bienvenida con instrucciones
// -------------------------------------------------------
function handleWelcomeEmail(data) {
  const { email, nickname, deepLinkUrl } = data;
  const subject = `${APP_NAME} — Tus instrucciones de uso`;
  const htmlBody = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #fff; padding: 40px 32px;">
      <h1 style="font-size: 24px; font-weight: 900; color: #000; margin: 0 0 8px;">Hola, ${nickname}</h1>
      <p style="font-size: 15px; color: #555; margin: 0 0 32px;">Estás a punto de realizar el test de Fatiga Vocal de NOMI. A continuación encontrarás las instrucciones.</p>
      <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="font-size: 16px; font-weight: 800; color: #000; margin: 0 0 16px;">Instrucciones</h2>
        <ol style="margin: 0; padding-left: 20px; color: #333; font-size: 14px; line-height: 1.8;">
          <li>Selecciona si estás <strong>Activo</strong> (inicio de jornada) o <strong>Cansado</strong> (fin de jornada).</li>
          <li>El test consta de <strong>3 grabaciones cortas</strong>:</li>
          <ul>
            <li><strong>Vocal A:</strong> Sostén la vocal "A" durante 5 segundos.</li>
            <li><strong>Frase:</strong> Di "El rápido zorro marrón salta sobre el perro perezoso."</li>
            <li><strong>Desayuno:</strong> Describe brevemente qué desayunaste hoy.</li>
          </ul>
          <li>Busca un lugar <strong>tranquilo y silencioso</strong> para hacer el test.</li>
          <li>Habla en un tono de <strong>voz normal</strong>, sin gritar ni susurrar.</li>
        </ol>
      </div>
      <div style="background: #fff8e1; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 16px; margin-bottom: 32px;">
        <p style="margin: 0; font-size: 13px; color: #78350f; line-height: 1.7;">
          <strong>Aviso de privacidad:</strong> Esta es una prueba interna de desarrollo de NOMI. Tus datos básicos y grabaciones breves de voz serán utilizados exclusivamente por el equipo científico y técnico para investigación, calibración, validación de experiencia de usuario y desarrollo de maquetas. La información será tratada como privada y confidencial.
        </p>
      </div>
      <div style="text-align: center; margin-bottom: 32px;">
        <a href="${deepLinkUrl}" style="display: inline-block; background: #000; color: #fff; text-decoration: none; font-size: 16px; font-weight: 800; padding: 16px 40px; border-radius: 12px;">Entendido — Comenzar test</a>
      </div>
      <p style="font-size: 12px; color: #aaa; text-align: center; margin: 0;">Este correo fue enviado por ${APP_NAME}. Si no solicitaste este test, ignora este mensaje.</p>
    </div>
  `;
  GmailApp.sendEmail(email, subject, '', { htmlBody, name: FROM_NAME });
  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: 'Welcome email sent' })).setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------
// ACCIÓN: Guardar audios en Drive + fila en Sheets + email confirmación
// -------------------------------------------------------
function handleTestCompleted(data) {
  const { email, nickname, uuid, eventPhase, completedAt, audios } = data;
  const folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  const userFolder = getOrCreateSubfolder(folder, `${nickname} (${uuid.slice(0, 8)})`);
  const dateStr = new Date(completedAt).toLocaleString('es-CL');
  const driveLinks = [];

  if (audios && audios.length > 0) {
    audios.forEach((audio) => {
      try {
        let extension = '.m4a';
        if (audio.mimeType === 'audio/webm') extension = '.webm';
        else if (audio.mimeType === 'audio/mp4') extension = '.mp4';
        const decoded = Utilities.newBlob(Utilities.base64Decode(audio.base64), audio.mimeType || 'audio/m4a', `${audio.label}${extension}`);
        const file = userFolder.createFile(decoded);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        driveLinks.push({ label: audio.label, url: file.getUrl() });
      } catch (err) {
        driveLinks.push({ label: audio.label, url: 'Error al subir: ' + err.message });
      }
    });
  }

  const doc = SpreadsheetApp.openById(MASTER_SHEET_ID);
  const sheet = doc.getSheetByName(TAB_FATIGA);
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Fecha', 'Nombre', 'Email', 'UUID', 'Fase', 'Audio 1 - Vocal A', 'Audio 2 - Frase', 'Audio 3 - Desayuno']);
    sheet.getRange(1, 1, 1, 8).setFontWeight('bold').setBackground('#000').setFontColor('#fff');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow([dateStr, nickname, email, uuid, eventPhase === 'activo' ? 'Activo (PRE)' : 'Cansado (POST)', driveLinks[0]?.url || 'No subido', driveLinks[1]?.url || 'No subido', driveLinks[2]?.url || 'No subido']);

  const confirmSubject = `${APP_NAME} — ¡Tu test fue recibido!`;
  const confirmHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; background: #fff; padding: 40px 32px;">
      <h1 style="font-size: 24px; font-weight: 900; color: #000; margin: 0 0 16px;">Test completado, ${nickname}</h1>
      <p style="font-size: 15px; color: #555; margin: 0 0 20px;">Recibimos tus 3 grabaciones de voz correctamente.</p>
      <div style="background: #f5f5f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <p style="margin: 0 0 8px; font-size: 13px; color: #666;"><strong>Resumen del test:</strong></p>
        <p style="margin: 0; font-size: 14px; color: #333;">Fecha: ${dateStr}</p>
        <p style="margin: 4px 0 0; font-size: 14px; color: #333;">Etapa: ${eventPhase === 'activo' ? 'Activo (inicio de jornada)' : 'Cansado (fin de jornada)'}</p>
      </div>
      <p style="font-size: 12px; color: #aaa; text-align: center; margin: 0;">Gracias por participar en el programa NOMI.</p>
    </div>
  `;
  GmailApp.sendEmail(email, confirmSubject, '', { htmlBody: confirmHtml, name: FROM_NAME, bcc: ADMIN_NOTIFICATION_EMAIL });
  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: 'Test saved and confirmation sent', links: driveLinks })).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSubfolder(parentFolder, name) {
  const existing = parentFolder.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parentFolder.createFolder(name);
}

// -------------------------------------------------------
// ACCIÓN: Guardar Test de Salud Mental y Enviar Email
// -------------------------------------------------------
function handleMentalHealthCompleted(data) {
  try {
    const isUniversitario = data.target === 'universitario';
    const targetTab = isUniversitario ? TAB_SM_UNIVERSITARIOS : TAB_SM_ESCOLARES;
    const targetFolderId = isUniversitario ? MENTAL_HEALTH_UNI_DRIVE_FOLDER_ID : MENTAL_HEALTH_ESCOLAR_DRIVE_FOLDER_ID;

    var doc = SpreadsheetApp.openById(MASTER_SHEET_ID);
    var sheet = doc.getSheetByName(targetTab);
    
    // Fallback: si la pestaña no existe, se crea
    if (!sheet) {
        sheet = doc.insertSheet(targetTab);
    }
    
    var folder = DriveApp.getFolderById(targetFolderId);
    
    var audioUrl = "Sin audio";
    if (data.audio && data.audio.base64) {
      var byteCharacters = Utilities.base64Decode(data.audio.base64);
      var fileName = "SaludMental_" + (data.target || 'general') + "_" + data.nickname + "_" + new Date().getTime() + (data.audio.mimeType === "audio/webm" ? ".webm" : ".m4a");
      var blob = Utilities.newBlob(byteCharacters, data.audio.mimeType, fileName);
      var file = folder.createFile(blob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      audioUrl = file.getUrl();
    }
    
    var initialAudioUrl = "Sin audio";
    if (data.initialAudio && data.initialAudio.base64) {
      var byteCharactersInit = Utilities.base64Decode(data.initialAudio.base64);
      var fileNameInit = "DatosBasicos_" + (data.target || 'general') + "_" + data.nickname + "_" + new Date().getTime() + (data.initialAudio.mimeType === "audio/webm" ? ".webm" : ".m4a");
      var blobInit = Utilities.newBlob(byteCharactersInit, data.initialAudio.mimeType, fileNameInit);
      var fileInit = folder.createFile(blobInit);
      fileInit.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      initialAudioUrl = fileInit.getUrl();
    }
    
    // --- LÓGICA DE CLASIFICACIÓN ---
    function getScore(answer) {
      if (!answer) return 0;
      var ans = answer.toLowerCase().replace(/\./g, '').trim();
      if (ans.indexOf('casi todos los días') !== -1) return 3;
      if (ans.indexOf('más de la mitad') !== -1) return 2;
      if (ans.indexOf('algunos días') !== -1) return 1;
      return 0; // "Nunca" o vacío
    }

    function getLabel(score) {
      if (score <= 1) return "<strong>Baja frecuencia reportada:</strong> La persona reportó pocas señales en esta dimensión.";
      if (score <= 3) return "<strong>Frecuencia intermedia:</strong> Aparecen algunas señales que conviene observar.";
      return "<strong>Alta frecuencia reportada:</strong> Las señales aparecen con frecuencia y justifican una evaluación más completa.";
    }

    var animoScore = getScore(data.answers[0]) + getScore(data.answers[1]);
    var ansiedadScore = getScore(data.answers[2]) + getScore(data.answers[3]);
    var sobrecargaScore = getScore(data.answers[4]) + getScore(data.answers[5]);
    
    var totalScore = animoScore + ansiedadScore + sobrecargaScore;
    var maxDim = Math.max(animoScore, Math.max(ansiedadScore, sobrecargaScore));

    // Identificar palabras de riesgo en la respuesta abierta
    var riskKeywords = /(suicidi|matar|morir|daño|golpe|abus|peligro|cortar|violencia|pegar|muert)/i;
    var hasRisk = data.textResponse && riskKeywords.test(data.textResponse);

    var rutaSugerida = "Promoción";
    if (hasRisk) {
      rutaSugerida = "Riesgo";
    } else if (totalScore >= 9 || maxDim >= 4) {
      rutaSugerida = "Intervención";
    } else if (totalScore >= 4 || maxDim >= 2) {
      rutaSugerida = "Prevención";
    }

    // Adaptamos las secciones exactamente a lo que enviaste
    var routeConfig = {
      "Promoción": {
        color: "#10b981", // verde
        significado: "",
        contexto: "En esta medición no aparecen señales relevantes de malestar emocional o sobrecarga. Esto no significa ausencia permanente de dificultades, sino que durante el período evaluado las respuestas se ubican en un rango compatible con acciones generales de bienestar.",
        paso: "La recomendación es mantener hábitos protectores, fortalecer redes de apoyo y participar en acciones universales de promoción de salud mental y convivencia."
      },
      "Prevención": {
        color: "#f59e0b", // amarillo/naranja
        significado: "Aparecen algunas señales emocionales o de sobrecarga que conviene observar. No indican por sí solas una condición clínica, pero sí sugieren que podría ser útil revisar qué situaciones están generando y considerar apoyo temprano.",
        contexto: "En la respuesta abierta aparecieron temas asociados a carga académica y dificultad para descansar.",
        paso: "En una implementación real, esta ruta podría activar orientación preventiva, material de apoyo, seguimiento posterior o una conversación breve con el equipo definido por la institución."
      },
      "Intervención": {
        color: "#ef4444", // rojo
        significado: "",
        contexto: "Las respuestas muestran señales frecuentes o relevantes en una o más dimensiones. Esto no confirma una condición clínica, pero sugiere que sería recomendable una conversación con un profesional o con el equipo de apoyo definido por la institución.",
        paso: "Esta ruta permite priorizar evaluación, acompañamiento y eventual derivación programada."
      },
      "Riesgo": {
        color: "#991b1b", // rojo oscuro
        significado: "",
        contexto: "Las respuestas incluyen señales que podrían requerir apoyo inmediato. Esta maqueta no es un servicio de emergencia ni está siendo monitoreada en tiempo real.",
        paso: "Si esto estuviera ocurriendo en una situación real, la recomendación sería buscar apoyo presencial de inmediato a través de una persona de confianza, el equipo de apoyo de la institución o un servicio de urgencia."
      }
    };

    var cfg = routeConfig[rutaSugerida];

    // Guardar fila en el excel (agregué el puntaje total, la ruta y el audio inicial a la tabla)
    var row = [
      data.email, data.nickname, data.target || 'escolar',
      data.answers[0] || "", data.answers[1] || "", data.answers[2] || "",
      data.answers[3] || "", data.answers[4] || "", data.answers[5] || "",
      data.textResponse || "", initialAudioUrl, audioUrl, data.completedAt,
      totalScore, rutaSugerida
    ];
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Email", "Nickname", "Tipo Público",
        "P1: Ganas/Interés", "P2: Tristeza", "P3: Nervios", "P4: Preocupación", "P5: Exigencias", "P6: Relajación", 
        "Respuesta Escrita", "Enlace Audio Datos", "Enlace Audio Final", "Fecha", "Puntaje Total", "Ruta Asignada"
      ]);
      sheet.getRange(1, 1, 1, 15).setFontWeight('bold').setBackground('#000').setFontColor('#fff');
      sheet.setFrozenRows(1);
    }
    sheet.appendRow(row);
    
    // Preparar el HTML
    var subject = "Resultado Test de Salud Mental - NOMI";
    var dateStr = data.completedAt ? new Date(data.completedAt).toLocaleString('es-CL') : new Date().toLocaleString('es-CL');
    var baseUrl = data.appUrl || "nomi-app://";
    var dashboardUrl = baseUrl + (baseUrl.endsWith('/') ? '' : '/') + "dashboard/welcome?auth=admin_token";
    
    var emailHtml = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reporte NOMI - Salud Mental</title>
  <style>
    body { background-color: #f9fafb; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; padding: 40px 32px; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { text-align: center; margin-bottom: 24px; }
    .warning-banner { background: #fee2e2; border-left: 4px solid #ef4444; padding: 12px 16px; border-radius: 4px; margin-bottom: 24px; }
    .warning-text { margin: 0; font-size: 13px; color: #991b1b; font-weight: 700; }
    .header-info { background: #f8f8f8; border-radius: 12px; padding: 20px; margin-bottom: 32px; border: 1px solid #eee; }
    .header-info p { margin: 4px 0; font-size: 14px; color: #333; }
    h2 { font-size: 18px; font-weight: 800; color: #000; margin: 0 0 12px; border-bottom: 2px solid #000; padding-bottom: 8px; }
    h3 { font-size: 15px; font-weight: 700; color: #000; margin: 24px 0 8px; }
    p { font-size: 14px; color: #444; line-height: 1.6; margin: 0 0 16px; }
    .route-badge { display: inline-block; background: ${cfg.color}; color: #fff; padding: 6px 12px; border-radius: 6px; font-weight: 800; font-size: 14px; }
    .table-container { background: #000; border-radius: 12px; overflow: hidden; margin-bottom: 24px; }
    table { width: 100%; border-collapse: collapse; color: #fff; font-size: 14px; }
    th { text-align: left; padding: 16px; font-weight: 700; border-bottom: 1px solid #333; }
    td { padding: 16px; border-bottom: 1px solid #333; }
    tr:last-child td { border-bottom: none; }
    .other-routes { background: #f5f5f5; padding: 20px; border-radius: 12px; margin-top: 32px; }
    .other-routes h3 { margin-top: 0; }
    .other-routes p { font-size: 13px; margin-bottom: 12px; }
    .other-routes strong { color: #000; }
    .button-container { text-align: center; margin: 40px 0; }
    .button { display: inline-block; background: #000; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 800; padding: 16px 40px; border-radius: 12px; }
    .footer { text-align: center; border-top: 1px solid #eaeaea; padding-top: 24px; margin-top: 32px; }
    .footer p { font-size: 13px; color: #666; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAA8CAYAAAAjW/WRAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAylpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDkuMS1jMDAzIDc5Ljk2OTBhODdmYywgMjAyNS8wMy8wNi0yMDo1MDoxNiAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIDI2LjExIChNYWNpbnRvc2gpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkFFNjdERjAzQUI1ODExRjA4RDE5QUY3M0FFOEIxQ0FDIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkFFNjdERjA0QUI1ODExRjA4RDE5QUY3M0FFOEIxQ0FDIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QUU2N0RGMDFBQjU4MTFGMDhEMTlBRjczQUU4QjFDQUMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QUU2N0RGMDJBQjU4MTFGMDhEMTlBRjczQUU4QjFDQUMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5PSOSTAAASx0lEQVR4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" alt="NOMI" style="max-height: 40px;" />
    </div>
    <div class="warning-banner">
      <p class="warning-text">Aviso: Este correo será recibido por el equipo administrador del servicio, no por el usuario.</p>
    </div>

    <div class="header-info">
      <p><strong>Nombre:</strong> ${data.nickname}</p>
      <p><strong>Correo:</strong> ${data.email}</p>
      <p><strong>Público:</strong> ${isUniversitario ? 'Universitario' : 'Escolar'}</p>
      <p><strong>Fecha y hora del Test:</strong> ${dateStr}</p>
      <p><strong>Puntaje Total:</strong> ${totalScore} / 18</p>
    </div>

    <h2>Resultado principal</h2>
    <p><strong>Ruta sugerida:</strong> <span class="route-badge">${rutaSugerida}</span></p>

    ${cfg.significado ? `<h3>Qué significa</h3><p>${cfg.significado}</p>` : ""}

    <h3>Qué señales influyeron</h3>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Dimensión</th>
            <th>Lectura</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Ánimo</td>
            <td>${getLabel(animoScore)}</td>
          </tr>
          <tr>
            <td>Ansiedad</td>
            <td>${getLabel(ansiedadScore)}</td>
          </tr>
          <tr>
            <td>Sobrecarga</td>
            <td>${getLabel(sobrecargaScore)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <h3>Contexto reportado</h3>
    <p>${cfg.contexto}</p>

    <h3>Próximo paso sugerido</h3>
    <p>${cfg.paso}</p>

    <div class="other-routes">
      <h3>Otras Resultados (Rutas) posibles</h3>
      <p><strong>Promoción:</strong> No aparecen señales relevantes de malestar. El foco está en mantener el bienestar, promover hábitos saludables y fortalecer factores protectores.</p>
      <p><strong>Intervención:</strong> Se observan señales más intensas o sostenidas en el tiempo que podrían estar afectando el día a día. Sugiere la necesidad de evaluación profesional para definir apoyos específicos.</p>
      <p><strong>Riesgo:</strong> Se identifican señales que sugieren riesgo inminente o vulneración grave. Requiere activación inmediata de protocolos de seguridad y contacto directo con la red de apoyo.</p>
    </div>

    <div class="button-container">
      <a href="${dashboardUrl}" class="button" style="color: #ffffff;">Continuar al Dashboard</a>
    </div>

    <div class="footer">
      <p>Muchas gracias por hacer este recorrido. El equipo de Nomi estará atento a la información que necesites.</p>
      <p style="margin-top: 12px; font-weight: 700;">Plataforma de Administración NOMI</p>
    </div>
  </div>
</body>
</html>`;
      
    GmailApp.sendEmail(data.email, subject, '', {
      htmlBody: emailHtml,
      name: FROM_NAME,
      bcc: ADMIN_NOTIFICATION_EMAIL
    });
    
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "success", 
      message: "Datos de salud mental guardados y correo de administrador enviado" 
    })).setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      status: "error", 
      error: err.message 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
