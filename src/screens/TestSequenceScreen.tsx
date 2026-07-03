import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Modal,
  Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { sendTestCompletedWebhook } from '../services/webhookService';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TestSequence'>;
  route: RouteProp<RootStackParamList, 'TestSequence'>;
};

type TestStep = 0 | 1 | 2;

// duración en ms de grabación automática para el paso 0 (Vocal A = 5 segundos + margen)
const AUTO_STOP_DURATION_MS = 5500;

const TEST_STEPS = [
  {
    instruction: 'A la cuenta de 3,\ntoma aire profundamente\ny sostén la vocal',
    highlight: '"A"',
    detail: 'de forma constante durante 5 segundos.',
    // Texto que se muestra DURANTE la grabación (paso 1 auto-stop, no hace falta instrucción extra)
    recordingLabel: 'Sosteniendo vocal "A"...',
    showDuringRecording: false,
    label: 'Vocal A',
    thankYou: '¡Gracias!',
    autoStop: true,
  },
  {
    instruction: 'A la cuenta de 3, di la frase:',
    highlight: '"El rápido zorro marrón\nsalta sobre el perro perezoso."',
    detail: '',
    recordingLabel: '"El rápido zorro marrón\nsalta sobre el perro perezoso."',
    showDuringRecording: true,
    label: 'Frase',
    thankYou: '¡Gracias! Solo queda una prueba más.',
    autoStop: false,
  },
  {
    instruction: 'Describe brevemente\nen una frase:',
    highlight: '"¿Qué desayunaste hoy?"',
    detail: '',
    recordingLabel: '"¿Qué desayunaste hoy?"',
    showDuringRecording: true,
    label: 'Desayuno',
    thankYou: '¡Muchas gracias! Estas grabaciones serán analizadas por NOMI.',
    autoStop: false,
  },
];

export default function TestSequenceScreen({ navigation, route }: Props) {
  const { user, passkey } = useAuth();
  const { eventPhase } = route.params;

  const [step, setStep] = useState<TestStep>(0);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showThankYou, setShowThankYou] = useState(false);
  const [status, setStatus] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const audioUrisRef = useRef<string[]>([]);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const { recordingState, metering, startRecording, stopRecording, reset } = useAudioRecorder({
    uuid: user?.uuid ?? '',
    passkey,
    eventPhase: eventPhase === 'activo' ? '0' : '1',
    onStatus: setStatus,
    onPartialTranscript: (t) => setTranscript(t),
    onTranscript: (t) => setTranscript(t),
    onResponse: () => {},
  });

  // Animación de pulso
  useEffect(() => {
    if (recordingState === 'recording') {
      pulseLoopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      pulseLoopRef.current.start();
    } else {
      pulseLoopRef.current?.stop();
      pulseAnim.setValue(1);
    }
  }, [recordingState]);

  // Auto-stop para el paso 0 (Vocal A - 5 segundos)
  useEffect(() => {
    if (recordingState === 'recording' && step === 0 && TEST_STEPS[0].autoStop) {
      autoStopTimerRef.current = setTimeout(() => {
        handleStopRecording();
      }, AUTO_STOP_DURATION_MS);
    }
    return () => {
      if (autoStopTimerRef.current) {
        clearTimeout(autoStopTimerRef.current);
        autoStopTimerRef.current = null;
      }
    };
  }, [recordingState, step]);

  // Conteo regresivo
  useEffect(() => {
    if (!showCountdown) return;
    if (countdown === 0) {
      setShowCountdown(false);
      startRecording();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showCountdown, countdown]);

  function startCountdown() {
    setCountdown(3);
    setShowCountdown(true);
  }

  const handleStopRecording = useCallback(async () => {
    if (autoStopTimerRef.current) {
      clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    const uri = await stopRecording();
    if (uri) audioUrisRef.current.push(uri);

    setShowThankYou(true);
    const delay = step === 2 ? 5000 : 2500;
    setTimeout(async () => {
      setShowThankYou(false);
      reset();
      setTranscript('');
      setStatus('');

      if (step < 2) {
        setStep((s) => (s + 1) as TestStep);
      } else {
        setIsComplete(true);
        if (user) {
          sendTestCompletedWebhook({
            email: user.email,
            nickname: user.nickname,
            uuid: user.uuid,
            eventPhase,
            completedAt: new Date().toISOString(),
            audioUris: [
              { label: 'Vocal-A',  uri: audioUrisRef.current[0] ?? '', mimeType: 'audio/m4a' },
              { label: 'Frase',    uri: audioUrisRef.current[1] ?? '', mimeType: 'audio/m4a' },
              { label: 'Desayuno', uri: audioUrisRef.current[2] ?? '', mimeType: 'audio/m4a' },
            ],
          });
        }
      }
    }, delay);
  }, [step, stopRecording, reset, user, eventPhase]);

  if (isComplete) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completedContainer}>
          <View style={styles.completedIconCircle}>
            <Feather name="check" size={48} color="#fff" />
          </View>
          <Text style={styles.completedTitle}>¡Test completado!</Text>
          <Text style={styles.completedBody}>
            Muchas gracias. Tus grabaciones serán analizadas por NOMI.{'\n\n'}Recibirás un correo de confirmación.
          </Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.navigate('ServiceSelection')}
          >
            <Text style={styles.doneButtonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentStep = TEST_STEPS[step];
  const isRecording = recordingState === 'recording';
  const isProcessing = recordingState === 'processing';

  return (
    <SafeAreaView style={styles.container}>
      {/* Countdown Modal */}
      <Modal visible={showCountdown} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalInstruction}>{currentStep.instruction}</Text>
            <Text style={styles.modalHighlight}>{currentStep.highlight}</Text>
            {currentStep.detail ? <Text style={styles.modalDetail}>{currentStep.detail}</Text> : null}
            <View style={styles.countdownCircle}>
              <Text style={styles.countdownNumber}>{countdown === 0 ? '¡Ya!' : countdown}</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Thank You Modal */}
      <Modal visible={showThankYou} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.thankYouIcon}>
              <Feather name="check-circle" size={48} color="#000" />
            </View>
            <Text style={styles.thankYouText}>{currentStep.thankYou}</Text>
          </View>
        </View>
      </Modal>

      <View style={styles.content}>
        {/* Progress */}
        <View style={styles.progressRow}>
          {TEST_STEPS.map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= step && styles.progressDotActive]} />
          ))}
        </View>
        <Text style={styles.stepLabel}>Prueba {step + 1} de 3 — {currentStep.label}</Text>

        {/* Instrucciones antes de grabar */}
        {!isRecording && !isProcessing && (
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionMain}>{currentStep.instruction}</Text>
            <Text style={styles.instructionHighlight}>{currentStep.highlight}</Text>
            {currentStep.detail ? <Text style={styles.instructionDetail}>{currentStep.detail}</Text> : null}
          </View>
        )}

        {/* Contenido visible DURANTE la grabación */}
        {isRecording && (
          <View style={styles.recordingInfoBox}>
            {currentStep.showDuringRecording ? (
              // Pasos 2 y 3: mostrar la frase/pregunta
              <Text style={styles.recordingHighlight}>{currentStep.recordingLabel}</Text>
            ) : (
              // Paso 1: indicador de tiempo auto-stop
              <>
                <Text style={styles.recordingLabel}>{currentStep.recordingLabel}</Text>
                <View style={styles.autoStopBar}>
                  <AutoStopProgress duration={AUTO_STOP_DURATION_MS} />
                </View>
                <Text style={styles.autoStopHint}>La grabación se detiene automáticamente</Text>
              </>
            )}
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingBox}>
            <Feather name="loader" size={24} color="#000" />
            <Text style={styles.processingText}>Procesando...</Text>
          </View>
        )}

        {/* Transcript en tiempo real (solo para paso 2 y 3) */}
        {isRecording && transcript && currentStep.showDuringRecording && (
          <Text style={styles.transcriptText}>{transcript}</Text>
        )}

        {/* Botón de grabación */}
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && styles.recordButtonActive,
              isProcessing && styles.recordButtonProcessing,
            ]}
            onPress={isRecording ? handleStopRecording : startCountdown}
            disabled={isProcessing}
            activeOpacity={0.85}
          >
            {isProcessing ? (
              <Feather name="loader" size={32} color="#fff" />
            ) : isRecording ? (
              <>
                <Feather name="square" size={28} color="#fff" />
                <Text style={styles.recordButtonLabel}>Detener</Text>
              </>
            ) : (
              <>
                <Feather name="mic" size={32} color="#fff" />
                <Text style={styles.recordButtonLabel}>Comenzar</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Visualizador de amplitud */}
        {isRecording && (
          <View style={styles.waveform}>
            {[0.5, 0.75, 1, 0.75, 0.5].map((base, i) => (
              <View
                key={i}
                style={[styles.waveBar, { height: 6 + metering * 48 * base }]}
              />
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

// Componente de barra de progreso para auto-stop
function AutoStopProgress({ duration }: { duration: number }) {
  const progressAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, []);
  const width = progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
  return (
    <View style={autoStyles.track}>
      <Animated.View style={[autoStyles.fill, { width }]} />
    </View>
  );
}

const autoStyles = StyleSheet.create({
  track: {
    width: '100%',
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    backgroundColor: '#000',
    borderRadius: 2,
  },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: {
    flex: 1,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  progressDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#e0e0e0',
  },
  progressDotActive: { backgroundColor: '#000' },
  stepLabel: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 28 },

  instructionsBox: { alignItems: 'center', marginBottom: 36, paddingHorizontal: 8 },
  instructionMain: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 10 },
  instructionHighlight: { fontSize: 20, fontWeight: '900', color: '#000', textAlign: 'center', lineHeight: 28 },
  instructionDetail: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 6 },

  recordingInfoBox: {
    alignItems: 'center',
    marginBottom: 28,
    paddingHorizontal: 16,
    width: '100%',
  },
  recordingHighlight: {
    fontSize: 22,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 16,
  },
  recordingLabel: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    marginBottom: 14,
    fontStyle: 'italic',
  },
  autoStopBar: { width: '80%', marginBottom: 8 },
  autoStopHint: { fontSize: 11, color: '#aaa' },

  processingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
  },
  processingText: { fontSize: 15, color: '#555' },

  transcriptText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
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
  },
  recordButtonActive: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#555',
  },
  recordButtonProcessing: { backgroundColor: '#555' },
  recordButtonLabel: { color: '#fff', fontSize: 12, fontWeight: '700' },

  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    marginTop: 24,
    height: 56,
  },
  waveBar: {
    width: 7,
    backgroundColor: '#000',
    borderRadius: 3.5,
    minHeight: 6,
  },

  // Modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
  },
  modalInstruction: { fontSize: 15, color: '#666', textAlign: 'center', lineHeight: 22, marginBottom: 10 },
  modalHighlight: { fontSize: 20, fontWeight: '900', color: '#000', textAlign: 'center', lineHeight: 28, marginBottom: 8 },
  modalDetail: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 16 },
  countdownCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  countdownNumber: { color: '#fff', fontSize: 36, fontWeight: '900' },
  thankYouIcon: { marginBottom: 16 },
  thankYouText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    lineHeight: 26,
  },

  // Completado
  completedContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32,
  },
  completedIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  completedTitle: { fontSize: 26, fontWeight: '900', color: '#000', marginBottom: 16, textAlign: 'center' },
  completedBody: { fontSize: 15, color: '#555', textAlign: 'center', lineHeight: 22, marginBottom: 40 },
  doneButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 14,
  },
  doneButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
