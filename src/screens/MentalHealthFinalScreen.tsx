import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { sendMentalHealthCompletedWebhook } from '../services/webhookService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MentalHealthFinal'>;
  route: RouteProp<RootStackParamList, 'MentalHealthFinal'>;
};

type ResponseMode = 'audio' | 'text' | 'none' | null;

export default function MentalHealthFinalScreen({ navigation, route }: Props) {
  const { answers } = route.params;
  const { user } = useAuth();
  
  const [responseMode, setResponseMode] = useState<ResponseMode>(null);
  const [textResponse, setTextResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    recordingState,
    metering,
    finalUri,
    startRecording,
    stopRecording,
    reset,
  } = useAudioRecorder({
    uuid: user?.uuid || 'anonymous',
    passkey: '', // No necesario para esta fase en el websocket
    eventPhase: 'mental_health_open',
    disableWebsocket: true,
  });

  async function handleFinish() {
    setIsSubmitting(true);
    
    // Si estaba grabando, detener la grabación
    let currentAudioUri = finalUri;
    if (recordingState === 'recording') {
      currentAudioUri = await stopRecording();
    }

    try {
      await sendMentalHealthCompletedWebhook({
        email: user?.email || '',
        nickname: user?.nickname || '',
        uuid: user?.uuid || '',
        answers,
        textResponse: responseMode === 'text' ? textResponse : '',
        audioUri: responseMode === 'audio' && currentAudioUri ? {
          label: 'respuesta_final',
          uri: currentAudioUri,
          mimeType: Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a'
        } : undefined,
        completedAt: new Date().toISOString(),
      });
      // Mostrar pantalla de éxito
      navigation.reset({
        index: 0,
        routes: [{ name: 'MentalHealthSuccess' }],
      });
    } catch (e: any) {
      alert(`Hubo un error al enviar tus respuestas.\n\nDetalle técnico: ${e.message}`);
      setIsSubmitting(false);
    }
  }

  function renderAudioRecorder() {
    return (
      <View style={styles.recorderContainer}>
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
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.questionNumber}>Pregunta Final</Text>
          <Text style={styles.title}>
            Antes de terminar, y solo si quieres, cuéntame con tus propias palabras qué situación ha influido más en cómo te has sentido durante estas últimas dos semanas y qué crees que podría ayudarte.
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionCard, responseMode === 'audio' && styles.optionCardSelected]}
            onPress={() => setResponseMode('audio')}
          >
            <Feather name="mic" size={20} color={responseMode === 'audio' ? '#f59e0b' : '#333'} />
            <Text style={[styles.optionText, responseMode === 'audio' && styles.optionTextSelected]}>
              Responder por voz
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, responseMode === 'text' && styles.optionCardSelected]}
            onPress={() => setResponseMode('text')}
          >
            <Feather name="edit-2" size={20} color={responseMode === 'text' ? '#f59e0b' : '#333'} />
            <Text style={[styles.optionText, responseMode === 'text' && styles.optionTextSelected]}>
              Escribir mi respuesta
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, responseMode === 'none' && styles.optionCardSelected]}
            onPress={() => setResponseMode('none')}
          >
            <Feather name="skip-forward" size={20} color={responseMode === 'none' ? '#f59e0b' : '#333'} />
            <Text style={[styles.optionText, responseMode === 'none' && styles.optionTextSelected]}>
              Prefiero no responder
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputSection}>
          {responseMode === 'audio' && renderAudioRecorder()}
          
          {responseMode === 'text' && (
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={6}
              placeholder="Escribe tu respuesta aquí..."
              value={textResponse}
              onChangeText={setTextResponse}
              textAlignVertical="top"
            />
          )}
        </View>

        {responseMode && (
          <TouchableOpacity 
            style={[styles.continueButton, isSubmitting && styles.continueButtonDisabled]} 
            onPress={handleFinish} 
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.continueButtonText}>Finalizar</Text>
            )}
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: {
    padding: 24, paddingTop: 12, paddingBottom: 40,
    maxWidth: 600, width: '100%', alignSelf: 'center', flexGrow: 1,
  },
  header: { marginBottom: 32 },
  questionNumber: {
    fontSize: 14, fontWeight: '700', color: '#888',
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '900', color: '#000', lineHeight: 30 },
  optionsContainer: { gap: 12, marginBottom: 24 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8',
    padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#eee', gap: 12
  },
  optionCardSelected: { backgroundColor: '#fff8e1', borderColor: '#f59e0b' },
  optionText: { fontSize: 16, fontWeight: '600', color: '#333' },
  optionTextSelected: { color: '#78350f', fontWeight: '800' },
  inputSection: { marginBottom: 40, minHeight: 150 },
  textInput: {
    backgroundColor: '#f8f8f8', borderRadius: 12, padding: 16,
    fontSize: 16, color: '#333', borderWidth: 2, borderColor: '#eee',
    minHeight: 150,
  },
  recorderContainer: {
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f8f8f8', borderRadius: 12, borderWidth: 2, borderColor: '#eee', padding: 24,
    minHeight: 180,
  },
  recordButton: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 12,
  },
  recordButtonActive: {
    backgroundColor: '#ef4444', // Rojo al estar grabando
  },
  recordButtonText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  audioDoneContainer: { alignItems: 'center', gap: 16 },
  audioDoneBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, gap: 8
  },
  audioDoneText: { color: '#16a34a', fontWeight: '700' },
  retakeButton: { flexDirection: 'row', alignItems: 'center', padding: 8 },
  retakeButtonText: { color: '#555', fontWeight: '600' },
  continueButton: {
    backgroundColor: '#000', borderRadius: 14, paddingVertical: 18, alignItems: 'center',
    marginTop: 'auto', shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  continueButtonDisabled: { backgroundColor: '#555' },
  continueButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    marginTop: 12,
    height: 56,
  },
  waveBar: {
    width: 7,
    backgroundColor: '#000',
    borderRadius: 3.5,
    minHeight: 6,
  },
});
