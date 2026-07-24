import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { loginUserWebhook, registerUserWebhook } from '../services/webhookService';

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
        // Opcional: Podríamos validar la sesión con el backend aquí también,
        // pero para evitar demoras al abrir la app, confiamos en la sesión guardada.
        if (uuid && savedPasskey) {
          const email = await AsyncStorage.getItem('email') || '';
          const nickname = await AsyncStorage.getItem('nickname') || '';
          setUser({ uuid, email, nickname });
          setPasskey(savedPasskey);
        } else {
          throw new Error('Sesión inválida');
        }
    } catch {
      await AsyncStorage.multiRemove(['uuid', 'passkey', 'nickname', 'email']);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(identifier: string, pk: string) {
    const loggedUser = await loginUserWebhook(identifier, pk);

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
    const newUser = await registerUserWebhook(email, nickname, pk);

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
