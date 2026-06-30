const actionButton = document.getElementById('actionButton');
const buttonLabel = document.getElementById('buttonLabel');
const statusEl = document.getElementById('status');
const transcriptOutput = document.getElementById('transcriptOutput');
const responseOutput = document.getElementById('responseOutput');
const serverUrlEl = document.getElementById('serverUrl');
const recordingsButton = document.getElementById('recordingsButton');
const logoutButton = document.getElementById('logoutButton');

const authPanel = document.getElementById('authPanel');
const sessionPanel = document.getElementById('sessionPanel');
const recorderPanel = document.getElementById('recorderPanel');
const createUserForm = document.getElementById('createUserForm');
const loginUserForm = document.getElementById('loginUserForm');
const showCreateButton = document.getElementById('showCreateButton');
const showLoginButton = document.getElementById('showLoginButton');
const authMessage = document.getElementById('authMessage');
const currentUserName = document.getElementById('currentUserName');
const currentUserId = document.getElementById('currentUserId');
const eventInputs = Array.from(document.querySelectorAll('input[name="eventPhase"]'));

let mediaRecorder = null;
let socket = null;
let audioStream = null;
let audioContext = null;
let analyser = null;
let silenceMonitorId = null;
let speechStarted = false;
let silenceStart = null;
let recordingStartTime = 0;
let amplitude = 0;
let isStreaming = false;
let isProcessing = false;
let currentUser = null;
let currentPasskey = '';

const cookieOptions = 'path=/; max-age=2592000; SameSite=Lax';

function getSupportedAudioMimeType() {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
  ];

  return candidates.find(type => MediaRecorder.isTypeSupported(type)) || '';
}

function waitForSocketOpen(ws) {
  if (ws.readyState === WebSocket.OPEN) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      ws.removeEventListener('open', handleOpen);
      ws.removeEventListener('error', handleError);
      ws.removeEventListener('close', handleClose);
    };
    const handleOpen = () => {
      cleanup();
      resolve();
    };
    const handleError = () => {
      cleanup();
      reject(new Error('WebSocket connection failed.'));
    };
    const handleClose = () => {
      cleanup();
      reject(new Error('WebSocket closed before the session started.'));
    };

    ws.addEventListener('open', handleOpen);
    ws.addEventListener('error', handleError);
    ws.addEventListener('close', handleClose);
  });
}

function readCookie(name) {
  const prefix = `${encodeURIComponent(name)}=`;
  return document.cookie
    .split(';')
    .map(value => value.trim())
    .find(value => value.startsWith(prefix))
    ?.slice(prefix.length) || '';
}

function writeCookie(name, value) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${cookieOptions}`;
}

function clearCookie(name) {
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`;
}

function setStatus(message) {
  statusEl.textContent = message;
}

function setAuthMessage(message, success = false) {
  authMessage.textContent = message;
  authMessage.style.color = success ? '#99f6e4' : '#fca5a5';
}

function setButtonState(active) {
  if (active) {
    actionButton.classList.add('recording');
    buttonLabel.textContent = 'Stop Speaking';
  } else {
    actionButton.classList.remove('recording');
    buttonLabel.textContent = 'Start Speaking';
    actionButton.style.setProperty('--amplitude', '0');
    actionButton.style.setProperty('--ring-progress', '0');
    actionButton.style.setProperty('--ring-alpha', '0.58');
  }
}

function setTranscript(text) {
  transcriptOutput.textContent = text;
  transcriptOutput.classList.toggle('empty', text.trim().length === 0);
}

function setResponse(text) {
  responseOutput.textContent = text;
  responseOutput.classList.toggle('empty', text.trim().length === 0);
}

function selectedEventPhase() {
  return eventInputs.find(input => input.checked)?.value || '';
}

function selectedEventLabel() {
  return selectedEventPhase() === '1' ? 'POST' : 'PRE';
}

function updateRecordingAvailability() {
  const ready = Boolean(currentUser && selectedEventPhase());
  recorderPanel.hidden = !ready;
  actionButton.disabled = !ready || isProcessing;
  if (currentUser && !selectedEventPhase()) {
    setStatus('Select PRE or POST before recording.');
  } else if (ready && !isStreaming && !isProcessing) {
    setStatus(`Ready to record a ${selectedEventLabel()} session.`);
  }
}

function showAuthMode(mode) {
  const creating = mode === 'create';
  createUserForm.hidden = !creating;
  loginUserForm.hidden = creating;
  showCreateButton.classList.toggle('active', creating);
  showLoginButton.classList.toggle('active', !creating);
  setAuthMessage('');
}

function setLoggedIn(user, passkey) {
  currentUser = user;
  currentPasskey = passkey;
  writeCookie('audioUserUuid', user.uuid);
  writeCookie('audioUserPasskey', passkey);
  writeCookie('audioUserNickname', user.nickname);
  writeCookie('audioUserEmail', user.email);

  authPanel.hidden = true;
  sessionPanel.hidden = false;
  logoutButton.hidden = false;
  currentUserName.textContent = user.nickname;
  currentUserId.textContent = user.uuid;
  setAuthMessage('');
  updateRecordingAvailability();
}

function clearLogin() {
  stopStreaming();
  currentUser = null;
  currentPasskey = '';
  clearCookie('audioUserUuid');
  clearCookie('audioUserPasskey');
  clearCookie('audioUserNickname');
  clearCookie('audioUserEmail');
  eventInputs.forEach(input => {
    input.checked = false;
  });
  authPanel.hidden = false;
  sessionPanel.hidden = true;
  recorderPanel.hidden = true;
  logoutButton.hidden = true;
  setButtonState(false);
  setStatus('Logged out. Login again to record more audios.');
}

function authRequest(payload) {
  const url = serverUrlEl.value.trim();
  if (!url) {
    return Promise.reject(new Error('Invalid server URL.'));
  }

  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let settled = false;
    const timeoutId = window.setTimeout(() => {
      finish(null, new Error('User server did not answer. Confirm server.py was updated and restarted.'));
    }, 8000);

    const finish = (result, error = null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      ws.close();
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    };

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify(payload));
    });

    ws.addEventListener('message', event => {
      if (typeof event.data !== 'string') return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'user_authenticated') {
          finish(data.user);
        } else if (data.type === 'auth_error') {
          finish(null, new Error(data.message));
        } else if (data.type === 'status') {
          finish(null, new Error(`Unexpected server reply: ${data.message}`));
        } else {
          finish(null, new Error(`Unexpected server reply type: ${data.type || 'unknown'}`));
        }
      } catch (error) {
        finish(null, new Error('Invalid response from server.'));
      }
    });

    ws.addEventListener('error', () => finish(null, new Error('Unable to reach the user server.')));
    ws.addEventListener('close', () => finish(null, new Error('User server closed before responding.')));
  });
}

function sendSessionEvent(payload) {
  const url = serverUrlEl.value.trim();
  if (!url) {
    return Promise.resolve();
  }

  return new Promise(resolve => {
    const ws = new WebSocket(url);
    let settled = false;
    const timeoutId = window.setTimeout(() => finish(), 3000);

    const finish = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      ws.close();
      resolve();
    };

    ws.addEventListener('open', () => {
      ws.send(JSON.stringify(payload));
    });
    ws.addEventListener('message', finish);
    ws.addEventListener('error', finish);
    ws.addEventListener('close', finish);
  });
}

function logClientError(context, message) {
  return sendSessionEvent({
    type: 'client_error',
    context,
    message,
    uuid: currentUser?.uuid || decodeURIComponent(readCookie('audioUserUuid')),
  });
}

function createWebSocket(url) {
  const ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';

  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({
      type: 'auth',
      uuid: currentUser.uuid,
      passkey: currentPasskey,
      eventPhase: selectedEventPhase(),
    }));
    setStatus('Connected. Authenticating recording session...');
  });

  ws.addEventListener('message', event => {
    if (typeof event.data === 'string') {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'status') {
          setStatus(data.message);
        } else if (data.type === 'auth_error') {
          setStatus(data.message);
          stopStreaming();
        } else if (data.type === 'partial_transcript') {
          setTranscript(data.text + '...');
          setStatus('Listening... partial transcript received.');
        } else if (data.type === 'transcript') {
          setTranscript(data.text);
          setStatus('Transcript received. Awaiting response...');
        } else if (data.type === 'response') {
          setResponse(data.text);
          setStatus('Response received. Ready for another question.');
        }
      } catch (error) {
        console.error('Invalid JSON from server:', error);
      }
    }
  });

  ws.addEventListener('close', () => {
    if (isProcessing) {
      setStatus('Ready for another question.');
    } else if (isStreaming) {
      setStatus('Connection closed while streaming.');
    } else if (currentUser) {
      setStatus(`Ready to record a ${selectedEventLabel()} session.`);
    } else {
      setStatus('Audio session ended.');
    }
    setButtonState(false);
    isStreaming = false;
    isProcessing = false;
    updateRecordingAvailability();
  });

  ws.addEventListener('error', () => {
    setStatus('WebSocket error. Check server status.');
    setButtonState(false);
    isStreaming = false;
    updateRecordingAvailability();
  });

  return ws;
}

async function startStreaming() {
  if (!currentUser || !currentPasskey) {
    setStatus('Login before recording.');
    return;
  }

  if (!selectedEventPhase()) {
    setStatus('Select PRE or POST before recording.');
    return;
  }

  const url = serverUrlEl.value.trim();
  if (!url) {
    setStatus('Invalid server URL.');
    return;
  }

  if (!window.MediaRecorder) {
    setStatus('MediaRecorder is not supported in this browser.');
    return;
  }

  const mimeType = getSupportedAudioMimeType();
  if (!mimeType) {
    setStatus('This browser cannot record WebM/Opus audio.');
    return;
  }

  actionButton.disabled = true;
  setStatus('Requesting microphone access...');

  try {
    audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (err) {
    setStatus('Microphone access denied or unavailable.');
    logClientError('microphone', err.message || 'Microphone access denied or unavailable.');
    updateRecordingAvailability();
    return;
  }

  socket = createWebSocket(url);

  try {
    await waitForSocketOpen(socket);
  } catch (err) {
    setStatus(err.message);
    logClientError('websocket', err.message);
    audioStream.getTracks().forEach(track => track.stop());
    audioStream = null;
    updateRecordingAvailability();
    return;
  }

  mediaRecorder = new MediaRecorder(audioStream, { mimeType });

  mediaRecorder.addEventListener('dataavailable', event => {
    if (!event.data || event.data.size === 0 || !socket || socket.readyState !== WebSocket.OPEN) {
      return;
    }
    event.data.arrayBuffer().then(buffer => {
      socket.send(buffer);
    });
  });

  mediaRecorder.addEventListener('stop', () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'audio_end' }));
    }
  });

  mediaRecorder.start(250);
  isStreaming = true;
  isProcessing = false;
  actionButton.disabled = false;
  setButtonState(true);
  setStatus('Listening... speak now.');
  startSilenceDetection(audioStream);
}

function stopStreaming() {
  stopSilenceDetection();

  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }

  if (audioStream) {
    audioStream.getTracks().forEach(track => track.stop());
    audioStream = null;
  }

  if (isStreaming) {
    isProcessing = true;
    actionButton.disabled = true;
    setStatus('End of speech detected. Processing results...');
  }

  amplitude = 0;
  actionButton.style.setProperty('--amplitude', '0');
  actionButton.style.setProperty('--ring-progress', '0');
  actionButton.style.setProperty('--ring-alpha', '0.58');
}

showCreateButton.addEventListener('click', () => showAuthMode('create'));
showLoginButton.addEventListener('click', () => showAuthMode('login'));

createUserForm.addEventListener('submit', async event => {
  event.preventDefault();
  const formData = new FormData(createUserForm);
  const passkey = String(formData.get('passkey') || '').trim();
  setAuthMessage('Creating user...', true);

  try {
    const user = await authRequest({
      type: 'user_create',
      nickname: formData.get('nickname'),
      email: formData.get('email'),
      passkey,
    });
    setLoggedIn(user, passkey);
  } catch (error) {
    setAuthMessage(error.message);
  }
});

loginUserForm.addEventListener('submit', async event => {
  event.preventDefault();
  const formData = new FormData(loginUserForm);
  const passkey = String(formData.get('passkey') || '').trim();
  setAuthMessage('Logging in...', true);

  try {
    const user = await authRequest({
      type: 'user_login',
      identifier: formData.get('identifier'),
      passkey,
    });
    setLoggedIn(user, passkey);
  } catch (error) {
    setAuthMessage(error.message);
  }
});

eventInputs.forEach(input => input.addEventListener('change', updateRecordingAvailability));

actionButton.addEventListener('click', () => {
  if (!isStreaming) {
    setTranscript('');
    setResponse('');
    startStreaming();
  } else {
    stopStreaming();
  }
});

recordingsButton.addEventListener('click', () => {
  window.open(
    'recordings.html',
    'recordingsWindow',
    'popup=yes,width=820,height=760,noopener'
  );
});

logoutButton.addEventListener('click', async () => {
  const user = currentUser;
  const passkey = currentPasskey;
  if (user && passkey) {
    await sendSessionEvent({
      type: 'user_logout',
      uuid: user.uuid,
      passkey,
    });
  }
  clearLogin();
});

function startSilenceDetection(stream) {
  if (audioContext) {
    stopSilenceDetection();
  }

  audioContext = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;
  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const dataArray = new Uint8Array(analyser.fftSize);
  speechStarted = false;
  silenceStart = null;
  recordingStartTime = performance.now();

  const maxSilenceTime = 1400;
  const maxRecordTime = 180000;
  const voiceThreshold = 0.02;
  const ringRoundTime = 60000;

  function monitor() {
    analyser.getByteTimeDomainData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i += 1) {
      const x = (dataArray[i] - 128) / 128;
      sum += x * x;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const now = performance.now();

    amplitude = Math.min(1, rms * 6);
    actionButton.style.setProperty('--amplitude', amplitude.toFixed(3));
    const elapsed = Math.max(0, now - recordingStartTime);
    const ringProgress = ((elapsed % ringRoundTime) / ringRoundTime) * 100;
    const ringRounds = Math.floor(elapsed / ringRoundTime);
    const ringAlpha = Math.min(1, 0.58 + ringRounds * 0.14);
    actionButton.style.setProperty('--ring-progress', ringProgress.toFixed(2));
    actionButton.style.setProperty('--ring-alpha', ringAlpha.toFixed(2));
    if (rms > voiceThreshold) {
      speechStarted = true;
      silenceStart = null;
      setStatus('Speaking...');
    } else if (speechStarted) {
      if (!silenceStart) {
        silenceStart = now;
      } else if (now - silenceStart > maxSilenceTime) {
        stopStreaming();
        return;
      }
    }

    if (now - recordingStartTime > maxRecordTime) {
      stopStreaming();
      return;
    }

    silenceMonitorId = requestAnimationFrame(monitor);
  }

  silenceMonitorId = requestAnimationFrame(monitor);
}

function stopSilenceDetection() {
  if (silenceMonitorId) {
    cancelAnimationFrame(silenceMonitorId);
    silenceMonitorId = null;
  }

  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
    analyser = null;
  }
  amplitude = 0;
  actionButton.style.setProperty('--amplitude', '0');
  actionButton.style.setProperty('--ring-progress', '0');
  actionButton.style.setProperty('--ring-alpha', '0.58');
}

async function restoreLoginFromCookies() {
  const uuid = decodeURIComponent(readCookie('audioUserUuid'));
  const passkey = decodeURIComponent(readCookie('audioUserPasskey'));
  if (!uuid || !passkey) {
    setStatus('Create or login as a user to begin.');
    return;
  }

  setAuthMessage('Restoring previous login...', true);
  try {
    const user = await authRequest({
      type: 'user_login',
      identifier: uuid,
      passkey,
    });
    setLoggedIn(user, passkey);
  } catch (error) {
    clearCookie('audioUserUuid');
    clearCookie('audioUserPasskey');
    clearCookie('audioUserNickname');
    clearCookie('audioUserEmail');
    setAuthMessage('Previous login expired. Login again.');
    setStatus('Create or login as a user to begin.');
  }
}

window.addEventListener('beforeunload', () => {
  if (isStreaming) {
    stopStreaming();
  }
});

showAuthMode('create');
restoreLoginFromCookies();

