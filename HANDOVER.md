# NOMI Project - Handover

Este documento contiene toda la información necesaria para retomar el desarrollo del proyecto NOMI en cualquier otro entorno o computadora. Léelo para entender la estructura, la arquitectura y las adaptaciones recientes.

## Descripción del Proyecto
NOMI es una aplicación construida con **React Native** y **Expo (SDK 54)**. Sirve como un asistente o herramienta de test interactivo que graba audio del usuario (test de fatiga o voz), se comunica con un backend por WebSockets para obtener transcripciones en tiempo real y envía los resultados a un Webhook (Google Apps Script).

## Estructura de Carpetas Principal
Existen actualmente dos versiones del código en tu entorno:

1. `nomi-app/` (La original - Nativa)
2. `nomi-app-web/` (La adaptación - PWA Web)

Ambas comparten la misma estructura base dentro de `src/`:

- **`components/`**: Componentes visuales reutilizables.
- **`context/`**: `AuthContext.tsx` maneja el estado de autenticación de la app.
- **`hooks/`**: `useAudioRecorder.ts` maneja la grabación de audio, la conexión WebSocket (`wss://nomi-dev.merlin-lab.com/ws`) y la recepción de las transcripciones.
- **`screens/`**:
  - `IntroScreen`: Pantalla de bienvenida.
  - `AuthScreen`: Maneja el login/registro.
  - `ServiceSelectionScreen`: Selección de opciones principales.
  - `TestSetupScreen`: Preparación para la prueba (Abre por deep link `nomi-app://test`).
  - `TestSequenceScreen`: Secuencia principal de la prueba (Fases: "activo" y "cansado").
  - `EmailConfirmationScreen`: Confirmación final.
- **`services/`**: `webhookService.ts` se encarga de enviar correos de bienvenida y los payloads del test completado a un Webhook en Google Apps Script.

## Diferencias Clave: Nativo vs Web

Debido a que `expo-file-system` y la grabación de `expo-av` no soportan el entorno de navegadores web, se creó la carpeta `nomi-app-web/` con soporte para **PWA**:

### En `nomi-app` (Móvil Nativo)
- Usa `Audio.Recording.createAsync` (de `expo-av`) para grabar.
- Usa `FileSystem.readAsStringAsync` para leer los chunks de audio en Base64 mientras graba.

### En `nomi-app-web` (Web / Vercel)
- Usa la API nativa de navegadores `MediaRecorder` (`navigator.mediaDevices.getUserMedia`).
- Pasa los audios al WebSocket usando `Blob.arrayBuffer()`.
- En el webhook final (`webhookService.ts`), obtiene el archivo usando `fetch()` y lo convierte a Base64 a través de `FileReader`.
- El archivo `app.json` incluye la configuración del PWA (Pestaña `web` con `shortName`, `themeColor`, etc.).

## Despliegue (Deployment)

### Versión Web
El proyecto web se debe desplegar a Vercel importando el repositorio de GitHub (`RafaQuantico/nomi`).
- **Build command:** `npx expo export -p web`
- **Output directory:** `dist`

### Versión Móvil
Se compila a través de EAS (Expo Application Services) usando los comandos estándar `eas build -p android` o `eas build -p ios`.

---

> **Nota para el Agente / Asistente de IA:** 
> Si acabas de leer este archivo, ya estás al tanto del estado actual del proyecto. Recuerda que la adaptación para Web está en `nomi-app-web` y utiliza `MediaRecorder` de HTML5 en lugar de `expo-file-system`.
