import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

const WS_URL = 'wss://nomi-dev.merlin-lab.com/ws';

export interface User {
  uuid: string;
  nickname: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  passkey: string;
  isLoading: boolean;
  login: (identifier: string, passkey: string) => Promise<void>;
  createUser: (nickname: string, email: string, passkey: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function sendAuthMessage(payload: object): Promise<User> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    let settled = false;
    const timeoutId = setTimeout(() => {
      finish(null, new Error('El servidor no respondió. Verifica la conexión.'));
    }, 8000);

    const finish = (result: User | null, error: Error | null = null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      ws.close();
      if (error) reject(error);
      else resolve(result!);
    };

    ws.addEventListener('open', () => ws.send(JSON.stringify(payload)));
    ws.addEventListener('message', (event) => {
      if (typeof event.data !== 'string') return;
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'user_authenticated') finish(data.user);
        else if (data.type === 'auth_error') finish(null, new Error(data.message));
        else finish(null, new Error('Respuesta inesperada del servidor.'));
      } catch {
        finish(null, new Error('Respuesta inválida del servidor.'));
      }
    });
    ws.addEventListener('error', () => finish(null, new Error('No se pudo conectar al servidor.')));
    ws.addEventListener('close', () => finish(null, new Error('Servidor cerró la conexión.')));
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [passkey, setPasskey] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function restoreSession() {
    try {
      const uuid = await AsyncStorage.getItem('uuid');
      const savedPasskey = await AsyncStorage.getItem('passkey');
      if (uuid && savedPasskey) {
        const savedUser = await sendAuthMessage({ type: 'user_login', identifier: uuid, passkey: savedPasskey });
        setUser(savedUser);
        setPasskey(savedPasskey);
      }
    } catch {
      await AsyncStorage.multiRemove(['uuid', 'passkey', 'nickname', 'email']);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(identifier: string, pk: string) {
    const loggedUser = await sendAuthMessage({ type: 'user_login', identifier, passkey: pk });
    await AsyncStorage.multiSet([
      ['uuid', loggedUser.uuid],
      ['passkey', pk],
      ['nickname', loggedUser.nickname],
      ['email', loggedUser.email],
    ]);
    setUser(loggedUser);
    setPasskey(pk);
  }

  async function createUser(nickname: string, email: string, pk: string) {
    const newUser = await sendAuthMessage({ type: 'user_create', nickname, email, passkey: pk });
    await AsyncStorage.multiSet([
      ['uuid', newUser.uuid],
      ['passkey', pk],
      ['nickname', newUser.nickname],
      ['email', newUser.email],
    ]);
    setUser(newUser);
    setPasskey(pk);
  }

  async function logout() {
    await AsyncStorage.multiRemove(['uuid', 'passkey', 'nickname', 'email']);
    setUser(null);
    setPasskey('');
    try {
      await Updates.reloadAsync();
    } catch (e) {
      console.warn('Could not reload app', e);
    }
  }

  return (
    <AuthContext.Provider value={{ user, passkey, isLoading, login, createUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
