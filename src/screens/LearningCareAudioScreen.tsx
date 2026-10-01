import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Modal,
  Alert,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useWavRecorder } from "../hooks/useWavRecorder";
import HelpButton from '../components/HelpButton';
import HelpOverlay from '../components/HelpOverlay';
import { uploadLearningCareData } from '../services/googleService';

type Props = NativeStackScreenProps<RootStackParamList, "LearningCareAudio">;

const OPEN_QUESTION = "Cuenta con tus palabras: Un espacio abierto para decir lo que ninguna pregunta preguntó. ¿Hay algo más que quieras compartirnos?";

export default function LearningCareAudioScreen({ route, navigation }: Props) {
  const { studentId, routeResult, scores } = route.params;
  
  const { isRecording, isPaused, startRecording, pauseRecording, resumeRecording, stopRecording, requestPermission } = useWavRecorder();
  
  const [pendingRecording, setPendingRecording] = useState<{ base64: string; duration: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showThankYou, setShowThankYou] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRecording) {
      if (!isPaused) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          ])
        ).start();
        
        timerRef.current = setInterval(() => {
          setRecordingSeconds(prev => prev + 1);
        }, 1000);
      } else {
        pulseAnim.stopAnimation();
        pulseAnim.setValue(1);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  const minSeconds = 5;
  const isStopDisabled = isRecording && recordingSeconds < minSeconds;

  const startCountdown = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) {
      Alert.alert("Error", "No se pudo acceder al micrófono.");
      return;
    }
    setCountdown(3);
    setShowCountdown(true);
    let counter = 3;
    const interval = setInterval(() => {
      counter -= 1;
      if (counter > 0) {
        setCountdown(counter);
      } else {
        clearInterval(interval);
        setShowCountdown(false);
        handleStartRecording();
      }
    }, 1000);
  };

  const handleStartRecording = async () => {
    setRecordingSeconds(0);
    try {
      await startRecording();
    } catch (e) {
      Alert.alert("Error", "No se pudo acceder al micrófono.");
    }
  };

  const handleStopRecording = async () => {
    if (isStopDisabled) return;
    setIsProcessing(true);
    try {
      const result = await stopRecording();
      if (result) {
        setIsProcessing(false);
        setPendingRecording(result);
      } else {
        throw new Error("No audio generated");
      }
    } catch (e) {
      setIsProcessing(false);
      Alert.alert("Error", "Falló la grabación.");
    }
  };

  const handleConfirmRecording = async () => {
    if (!pendingRecording) return;
    setIsUploading(true);
    try {
      await uploadLearningCareData(studentId, scores, routeResult, pendingRecording.base64);
    } catch (e) {
      console.warn("Upload failed:", e);
      Alert.alert("Aviso", "Hubo un problema guardando los datos (CORS/Apps Script). Revisa la consola.");
    }
    setIsUploading(false);
    setPendingRecording(null);
    setShowThankYou(true);
    setTimeout(() => {
      setShowThankYou(false);
      navigation.replace("LearningCareResult", { studentId, routeResult, scores });
    }, 1500);
  };

  const handleSkip = async () => {
    setIsUploading(true);
    try {
      await uploadLearningCareData(studentId, scores, routeResult);
    } catch (e) {
      console.warn("Upload failed:", e);
      Alert.alert("Aviso", "Hubo un problema guardando los datos (CORS/Apps Script). Revisa la consola.");
    }
    setIsUploading(false);
    navigation.replace("LearningCareResult", { studentId, routeResult, scores });
  };

  const handleDiscardRecording = () => {
    setPendingRecording(null);
    setRecordingSeconds(0);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <Modal visible={showCountdown} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalInstruction}>Prepárate para hablar</Text>
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
              </View>
            </View>
          </View>
        </Modal>

        <Modal visible={showThankYou} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Feather name="check-circle" size={54} color="#4338CA" style={styles.thankYouIcon} />
              <Text style={styles.thankYouText}>¡Gracias por tus respuestas!</Text>
            </View>
          </View>
        </Modal>

        <View style={[styles.content, isRecording && { opacity: 0.1 }]}>
          <View style={styles.topRow}>
            <TouchableOpacity style={styles.backButtonTop} onPress={handleSkip}>
              <Feather name="arrow-left" size={24} color="#111827" />
            </TouchableOpacity>
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>

          <View style={styles.progressHeader}>
            <Text style={styles.stationLabel}>ESTACIÓN 4 · CON TUS PALABRAS</Text>
            <Text style={styles.progressCount}>7 / 7</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '100%' }]} />
          </View>

          <View style={styles.tabsContainer}>
            <View style={styles.tab}>
              <Text style={styles.tabText}>Tocar</Text>
            </View>
            <View style={[styles.tab, styles.tabActive]}>
              <Text style={[styles.tabText, styles.tabTextActive]}>Hablar</Text>
            </View>
            <View style={styles.tab}>
              <Text style={styles.tabText}>Escribir</Text>
            </View>
          </View>

          {!isProcessing && (
            <View style={styles.instructionsBox}>
              <Text style={styles.questionText}>{OPEN_QUESTION}</Text>
            </View>
          )}

          {isProcessing && (
            <View style={styles.processingBox}>
              <Feather name="loader" size={24} color="#4338CA" />
              <Text style={styles.processingText}>Procesando audio...</Text>
            </View>
          )}

          {!isRecording && (
            <Animated.View style={{ transform: [{ scale: pulseAnim }], alignItems: 'center' }}>
              <View style={styles.micRingOuter}>
                <View style={styles.micRingInner}>
                  <TouchableOpacity
                    style={[styles.recordButton, isProcessing && styles.recordButtonDisabled]}
                    onPress={startCountdown}
                    disabled={isProcessing}
                    activeOpacity={0.85}
                  >
                    <Feather name={isProcessing ? "loader" : "mic"} size={40} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={{marginTop: 16, fontFamily: "Inter_600SemiBold", color: "#6B7280", fontSize: 16}}>Toca para grabar</Text>
            </Animated.View>
          )}
          
          <View style={{ flex: 1 }} />
          {!isRecording && (
            <View style={styles.bottomNav}>
              <TouchableOpacity style={styles.bottomNavBack} onPress={handleSkip}>
                <Text style={styles.bottomNavBackText}>Omitir paso</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Overlay Oscuro Durante Grabación */}
      {isRecording && (
        <View style={styles.recordingOverlay} pointerEvents="box-none">
          <View style={styles.recordingOverlayContent}>
            
            <View style={{ height: 60 }} />
            
            <View style={styles.instructionsBoxDark}>
              <Text style={styles.instructionHighlightDark}>{OPEN_QUESTION}</Text>
            </View>

            <View style={{ height: 20 }} />

            <Text style={styles.recordingTopLabel}>GRABANDO</Text>
            <Text style={styles.recordingTimer}>
              00:{String(recordingSeconds).padStart(2, '0')}
            </Text>

            {isStopDisabled && minSeconds > 0 && (
               <Text style={styles.recordingWarningLabel}>
                 (Mínimo {minSeconds}s)
               </Text>
            )}

            <View style={{ flex: 1 }} />

            <View style={styles.waveformDynamic}>
              {Array.from({ length: 30 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.waveBarDynamic, { height: 10 + (isPaused ? 10 : Math.random() * 60) }]}
                />
              ))}
            </View>

            <View style={styles.recordingControlsArea}>
              <View style={styles.micRingOuterDark}>
                <View style={[styles.recordButtonDark, isPaused && { backgroundColor: "#374151" }]}>
                  <Feather name={isPaused ? "pause" : "mic"} size={40} color="#fff" />
                </View>
              </View>

              <View style={styles.fabContainer}>
                <TouchableOpacity
                  style={[styles.fabButton, { backgroundColor: isPaused ? "#4338CA" : "#4B5563" }]}
                  onPress={isPaused ? resumeRecording : pauseRecording}
                  activeOpacity={0.8}
                >
                  <Feather name={isPaused ? "play" : "pause"} size={32} color="#fff" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.fabButton, isStopDisabled && { opacity: 0.5 }]}
                  onPress={handleStopRecording}
                  disabled={isStopDisabled}
                  activeOpacity={0.8}
                >
                  <Feather name="check" size={32} color="#4338CA" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={{ height: 100 }} />
          </View>
        </View>
      )}

      {/* Overlay Confirmación Post-Grabación */}
      {pendingRecording && (
        <View style={styles.recordingOverlay} pointerEvents="box-none">
          <View style={styles.recordingOverlayContent}>
            <View style={{ height: 120 }} />
            
            <Feather name="check-circle" size={64} color="#10B981" style={{ marginBottom: 24 }} />
            <Text style={styles.recordingTopLabel}>GRABACIÓN FINALIZADA</Text>
            <Text style={styles.recordingTimer}>
              00:{String(Math.floor(pendingRecording.duration / 1000)).padStart(2, '0')}
            </Text>

            <View style={{ flex: 1 }} />

            <View style={{ width: "100%", gap: 16, marginBottom: 60, paddingHorizontal: 20 }}>
              <TouchableOpacity style={styles.confirmButtonWrapper} onPress={handleConfirmRecording} activeOpacity={0.8}>
                <View style={styles.confirmButtonGradient}>
                  <Feather name="send" size={20} color="#fff" />
                  <Text style={styles.confirmButtonText}>Enviar y Terminar</Text>
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.discardButton} onPress={handleDiscardRecording} activeOpacity={0.8}>
                <Feather name="trash-2" size={20} color="#FCA5A5" />
                <Text style={styles.discardButtonText}>Grabar de nuevo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <HelpOverlay visible={showHelp} onClose={() => setShowHelp(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6" },
  content: { flex: 1, padding: 24, paddingTop: 12 },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  backButtonTop: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  stationLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#4338CA",
    letterSpacing: 1,
  },
  progressCount: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#6B7280",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#E0E7FF',
    borderRadius: 2,
    marginBottom: 24,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4338CA',
    borderRadius: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 100,
    padding: 4,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 100,
  },
  tabActive: {
    backgroundColor: '#4338CA',
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#4B5563",
  },
  tabTextActive: {
    color: '#fff',
  },
  instructionsBox: { alignItems: "center", marginBottom: 36, paddingHorizontal: 16 },
  questionText: { fontSize: 24, fontFamily: "Inter_500Medium", color: "#111827", textAlign: "center", lineHeight: 32 },
  
  instructionsBoxDark: { alignItems: "center", marginBottom: 16, paddingHorizontal: 16 },
  instructionHighlightDark: { fontFamily: "Inter_500Medium", fontSize: 24, color: "#F9FAFB", textAlign: "center", lineHeight: 32 },
  
  processingBox: { flexDirection: "row", alignItems: "center", justifyContent: 'center', gap: 10, marginBottom: 28 },
  processingText: { fontFamily: "Inter_500Medium", fontSize: 15, color: "#4B5563" },
  
  micRingOuter: { padding: 4, borderRadius: 100, borderWidth: 1, borderColor: "#C7D2FE" },
  micRingInner: { padding: 8, borderRadius: 100, backgroundColor: "#EEF2FF" },
  recordButton: {
    width: 110, height: 110, borderRadius: 55, backgroundColor: '#4338CA',
    alignItems: "center", justifyContent: "center",
  },
  recordButtonDisabled: { opacity: 0.5 },
  
  bottomNav: { width: "100%", alignItems: "center", paddingBottom: 20 },
  bottomNavBack: { backgroundColor: "#fff", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 100, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  bottomNavBackText: { fontFamily: "Inter_700Bold", color: "#111827", fontSize: 16 },
  
  recordingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#111827", opacity: 0.96 },
  recordingOverlayContent: { ...StyleSheet.absoluteFillObject, alignItems: "center", padding: 24 },
  recordingTopLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#D1D5DB", letterSpacing: 1, marginBottom: 8 },
  recordingTimer: { fontFamily: "Inter_400Regular", fontSize: 44, color: "#fff" },
  recordingWarningLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#9CA3AF", marginTop: 8 },
  
  waveformDynamic: { flexDirection: "row", alignItems: "center", gap: 4, height: 100, marginBottom: 40 },
  waveBarDynamic: { width: 4, backgroundColor: "#6366F1", borderRadius: 2 },
  
  recordingControlsArea: { alignItems: "center", justifyContent: "center" },
  micRingOuterDark: { padding: 4, borderRadius: 100, borderWidth: 1, borderColor: "#374151" },
  recordButtonDark: { width: 110, height: 110, borderRadius: 55, backgroundColor: "#4338CA", alignItems: "center", justifyContent: "center" },
  
  fabContainer: { position: "absolute", flexDirection: "row", gap: 40 },
  fabButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  
  discardButton: { backgroundColor: "rgba(239, 68, 68, 0.15)", paddingVertical: 16, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.3)" },
  discardButtonText: { fontFamily: "Inter_600SemiBold", color: "#FCA5A5", fontSize: 16 },
  confirmButtonWrapper: { borderRadius: 12, overflow: "hidden" },
  confirmButtonGradient: { backgroundColor: '#4338CA', paddingVertical: 16, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  confirmButtonText: { fontFamily: "Inter_800ExtraBold", color: "#fff", fontSize: 16 },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 28 },
  modalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 32, alignItems: "center", width: "100%", maxWidth: 340 },
  modalInstruction: { fontFamily: "Inter_500Medium", fontSize: 15, color: "#4B5563", textAlign: "center", marginBottom: 10 },
  countdownCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#111827", alignItems: "center", justifyContent: "center", marginTop: 20 },
  countdownNumber: { fontFamily: "Inter_900Black", color: "#fff", fontSize: 36 },
  thankYouIcon: { marginBottom: 16 },
  thankYouText: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: "#111827", textAlign: "center" },
});
