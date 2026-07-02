import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { sendWelcomeEmail } from '../services/webhookService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'>;
};

export default function AuthScreen({ navigation }: Props) {
  const { login, createUser } = useAuth();
  const [mode, setMode] = useState<'login' | 'create'>('create');
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [passkey, setPasskey] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit() {
    setErrorMsg('');
    if (mode === 'create') {
      if (!nickname.trim() || !email.trim() || passkey.length !== 8) {
        setErrorMsg('Completa todos los campos. La clave debe tener 8 dígitos.');
        return;
      }
    } else {
      if (!identifier.trim() || passkey.length !== 8) {
        setErrorMsg('Ingresa tu identificador y los 8 dígitos de tu clave.');
        return;
      }
    }
    setLoading(true);
    try {
      if (mode === 'create') {
        await createUser(nickname.trim(), email.trim(), passkey.trim());
        // Enviar el correo de bienvenida en segundo plano sin bloquear
        sendWelcomeEmail({
          email: email.trim(),
          nickname: nickname.trim(),
          deepLinkUrl: Platform.OS === 'web' ? window.location.origin : 'nomiapp://',
        }).catch(() => {});
      } else {
        await login(identifier.trim(), passkey.trim());
      }
      navigation.replace('ServiceSelection');
    } catch (error: any) {
      setErrorMsg(error.message || 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Image source={require('../../assets/Nomi_Negro.png')} style={styles.logo} resizeMode="contain" />

        <Text style={styles.title}>Bienvenido</Text>
        <Text style={styles.subtitle}>Inicia sesión o crea tu cuenta</Text>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mode === 'create' && styles.tabActive]}
            onPress={() => { setMode('create'); setErrorMsg(''); }}
          >
            <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>Crear cuenta</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mode === 'login' && styles.tabActive]}
            onPress={() => { setMode('login'); setErrorMsg(''); }}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Iniciar sesión</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {mode === 'create' ? (
            <>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Nickname</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre de usuario"
                  placeholderTextColor="#999"
                  value={nickname}
                  onChangeText={setNickname}
                  autoCapitalize="none"
                />
              </View>
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Correo electrónico</Text>
                <TextInput
                  style={styles.input}
                  placeholder="tu@email.com"
                  placeholderTextColor="#999"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </>
          ) : (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email, Nickname o UUID</Text>
              <TextInput
                style={styles.input}
                placeholder="Ingresa tu identificador"
                placeholderTextColor="#999"
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Clave de 8 dígitos</Text>
            <TextInput
              style={styles.input}
              placeholder="12345678"
              placeholderTextColor="#999"
              value={passkey}
              onChangeText={(t) => setPasskey(t.replace(/\D/g, '').slice(0, 8))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
            />
          </View>

          {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>
                {mode === 'create' ? 'Crear cuenta' : 'Iniciar sesión'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 28, justifyContent: 'center' },
  logo: { width: 180, height: 60, alignSelf: 'center', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '900', color: '#000', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#555', textAlign: 'center', marginTop: 6, marginBottom: 28 },
  tabs: { flexDirection: 'row', backgroundColor: '#f0f0f0', borderRadius: 12, padding: 4, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#000' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#666' },
  tabTextActive: { color: '#fff' },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: '700', color: '#333' },
  input: {
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 13,
    fontSize: 15,
    color: '#000',
    backgroundColor: '#fafafa',
  },
  error: { color: '#e53e3e', fontSize: 13, textAlign: 'center' },
  button: {
    backgroundColor: '#000',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
