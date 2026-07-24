import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';

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
      if (uuid && savedPasskey) {
        const usersJson = await AsyncStorage.getItem('mock_users_db');
        const users = usersJson ? JSON.parse(usersJson) : [];
        const loggedUser = users.find((u: any) => u.uuid === uuid && u.passkey === savedPasskey);
        
        if (loggedUser) {
          setUser(loggedUser);
          setPasskey(savedPasskey);
        } else {
          throw new Error('Sesión inválida');
        }
      }
    } catch {
      await AsyncStorage.multiRemove(['uuid', 'passkey', 'nickname', 'email']);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(identifier: string, pk: string) {
    const usersJson = await AsyncStorage.getItem('mock_users_db');
    const users = usersJson ? JSON.parse(usersJson) : [];
    
    const loggedUser = users.find((u: any) => 
      (u.email === identifier || u.nickname === identifier || u.uuid === identifier) && u.passkey === pk
    );

    if (!loggedUser) {
      throw new Error('Credenciales incorrectas o usuario no encontrado.');
    }

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
    const usersJson = await AsyncStorage.getItem('mock_users_db');
    const users = usersJson ? JSON.parse(usersJson) : [];

    if (users.some((u: any) => u.email === email)) {
      throw new Error('El correo ya está registrado.');
    }

    const newUser = {
      uuid: Math.random().toString(36).substring(2, 10),
      nickname,
      email,
      passkey: pk,
    };
    
    users.push(newUser);
    await AsyncStorage.setItem('mock_users_db', JSON.stringify(users));

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
