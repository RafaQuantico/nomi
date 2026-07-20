import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { Feather } from '@expo/vector-icons';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { useAuth } from '../context/AuthContext';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MentalHealthData'>;
  route: RouteProp<RootStackParamList, 'MentalHealthData'>;
};

export default function MentalHealthDataScreen({ navigation, route }: Props) {
  const { target } = route.params;
  const { user } = useAuth();

  // Usa el hook de audio de la misma manera que en la pantalla final
  const {
    recordingState,
    metering,
    startRecording,
    stopRecording,
    reset,
    finalUri,
  } = useAudioRecorder({
    uuid: user?.uuid || 'dummy-uuid',
    passkey: 'dummy-passkey',
    eventPhase: 'mental_health_data',
    disableWebsocket: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleContinue() {
    setIsSubmitting(true);
    let currentAudioUri = finalUri;
    
    if (recordingState === 'recording') {
      currentAudioUri = await stopRecording();
    }
    
    setIsSubmitting(false);

    // Si no grabó nada y detuvo, pasamos de largo o requerimos grabar?
    // Asumiremos que el audio es opcional si el usuario presiona Continuar, 
    // pero idealmente se graba algo.
    navigation.navigate('MentalHealthQuestion', {
      target,
      initialAudioUri: currentAudioUri || undefined
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Datos Básicos</Text>
          <Text style={styles.subtitle}>
            Antes de comenzar, confirmaremos algunos datos básicos de esta sesión.
          </Text>
          <Text style={styles.instruction}>
            Puedes confirmar o corregir la información hablando.{'\n\n'}
            Para comenzar, dinos tu nombre, edad, {target === 'escolar' ? 'curso y colegio' : 'carrera y universidad'}.
          </Text>
        </View>

        <View style={styles.recorderWrapper}>
          {recordingState === 'idle' && !finalUri && (
            <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
              <Feather name="mic" size={32} color="#fff" />
              <Text style={styles.recordButtonText}>Grabar</Text>
            </TouchableOpacity>
          )}
          
          {recordingState === 'recording' && (
            <View style={{ alignItems: 'center' }}>
              <TouchableOpacity style={[styles.recordButton, styles.recordButtonActive]} onPress={stopRecording}>
                <Feather name="square" size={28} color="#fff" />
                <Text style={styles.recordButtonText}>Detener</Text>
              </TouchableOpacity>
              
              <View style={styles.waveform}>
                {[0.5, 0.75, 1, 0.75, 0.5].map((base, i) => (
                  <View
                    key={i}
                    style={[styles.waveBar, { height: 6 + metering * 48 * base }]}
                  />
                ))}
              </View>
            </View>
          )}

          {(recordingState === 'done' || finalUri) && (
            <View style={styles.audioDoneContainer}>
              <View style={styles.audioDoneBadge}>
                <Feather name="check-circle" size={20} color="#16a34a" />
                <Text style={styles.audioDoneText}>Audio grabado correctamente</Text>
              </View>
              <TouchableOpacity style={styles.retakeButton} onPress={reset}>
                <Feather name="refresh-cw" size={16} color="#555" style={{marginRight: 6}} />
                <Text style={styles.retakeButtonText}>Grabar de nuevo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.disclaimerBox}>
          <Text style={styles.disclaimerText}>
            Estos datos se utilizan para orientar la experiencia y agrupar resultados de forma segura. En una implementación real, su uso depende del consentimiento informado y de los protocolos definidos por la institución.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, isSubmitting && styles.buttonDisabled]} 
          onPress={handleContinue}
          disabled={isSubmitting || (recordingState === 'idle' && !finalUri)}
        >
          <Text style={styles.buttonText}>
            {isSubmitting ? 'Procesando...' : 'Continuar'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scroll: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  header: {
    width: '100%',
    maxWidth: 600,
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#444',
    lineHeight: 26,
    marginBottom: 12,
  },
  instruction: {
    fontSize: 18,
    color: '#000',
    fontWeight: '600',
    lineHeight: 26,
  },
  recorderWrapper: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
    marginBottom: 40,
  },
  recordButton: {
    backgroundColor: '#000',
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 16,
  },
  recordButtonActive: {
    backgroundColor: '#dc2626',
    shadowColor: '#dc2626',
  },
  recordButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    gap: 4,
  },
  waveBar: {
    width: 6,
    backgroundColor: '#dc2626',
    borderRadius: 3,
  },
  audioDoneContainer: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    width: '100%',
  },
  audioDoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  audioDoneText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
    marginLeft: 8,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  retakeButtonText: {
    color: '#555',
    fontWeight: '600',
  },
  disclaimerBox: {
    backgroundColor: '#f3f4f6',
    padding: 20,
    borderRadius: 12,
    width: '100%',
    maxWidth: 600,
  },
  disclaimerText: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'justify',
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
