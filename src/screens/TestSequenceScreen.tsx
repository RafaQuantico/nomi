import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Easing,
  Modal,
  Alert,
  Image
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useAuth } from "../context/AuthContext";
import { useWavRecorder } from "../hooks/useWavRecorder";

type Props = NativeStackScreenProps<RootStackParamList, "TestSequence">;

const OPEN_QUESTION = "Dígame las dos últimas cosas que hizo antes de esta interacción, y aproximadamente cuánto tiempo le tomaron. Luego, describa las dos siguientes cosas que planea hacer a continuación.";

export default function TestSequenceScreen({ route, navigation }: Props) {
  const { eventPhase, samnPerelli } = route.params;
  const { user } = useAuth();
  
  const { isRecording, startRecording, stopRecording, requestPermission } = useWavRecorder();
  
  const [stepIndex, setStepIndex] = useState(0);
  const [recordings, setRecordings] = useState<{ label: string; base64: string; mimeType: string; duration?: number }[]>([]);
  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [showThankYou, setShowThankYou] = useState(false);
  
  const [dynamicQuestion, setDynamicQuestion] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setDynamicQuestion(OPEN_QUESTION);
    setTestStartTime(Date.now());
  }, []);

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
      
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const steps = [
    {
      label: "Audio 1 de 2",
      instruction: "Por favor lee en voz alta la siguiente frase:",
      highlight: "“El cangrejo viejo quedó perplejo al ver el reflejo de aquel espejo.”",
      recordingLabel: "Lee la frase...",
      minSeconds: 0
    },
    {
      label: "Audio 2 de 2",
      instruction: "Pulsa el micrófono y tómate al menos 20 segundos para responder:",
      highlight: dynamicQuestion,
      recordingLabel: "Hablando libremente...",
      minSeconds: 20
    }
  ];

  const currentStep = steps[stepIndex];
  
  const isStopDisabled = isRecording && recordingSeconds < currentStep.minSeconds;

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
        const newRecordings = [...recordings, { label: "Paso " + (stepIndex + 1), base64: result.base64, mimeType: "audio/wav", duration: result.duration }];
        setRecordings(newRecordings);
        
        setIsProcessing(false);
        setShowThankYou(true);
        setTimeout(() => {
          setShowThankYou(false);
          if (stepIndex < steps.length - 1) {
            setStepIndex(stepIndex + 1);
          } else {
            navigation.replace("FatigueSubstance", { recordings: newRecordings, eventPhase, samnPerelli, testStartTime: testStartTime || Date.now() });
          }
        }, 1500);
      } else {
        throw new Error("No audio generated");
      }
    } catch (e) {
      setIsProcessing(false);
      Alert.alert("Error", "Falló la grabación.");
    }
  };


  return (
    <SafeAreaView style={styles.container}>
      {/* Modal Cuenta Regresiva */}
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

      {/* Modal Gracias */}
      <Modal visible={showThankYou} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Feather name="check-circle" size={54} color="#000" style={styles.thankYouIcon} />
            <Text style={styles.thankYouText}>¡Grabación capturada!</Text>
          </View>
        </View>
      </Modal>

      {/* Contenido Principal (Opacado si graba) */}
      <View style={[styles.content, isRecording && { opacity: 0.1 }]}>
        <Image source={require('../../assets/Nomi_Negro.png')} style={styles.logo} resizeMode="contain" />
        
        <Text style={styles.stepLabel}>{currentStep.label}</Text>
        <View style={styles.progressRow}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
          ))}
        </View>

        {!isProcessing && (
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionMain}>{currentStep.instruction}</Text>
            <Text style={styles.instructionHighlight}>{currentStep.highlight}</Text>
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingBox}>
            <Feather name="loader" size={24} color="#000" />
            <Text style={styles.processingText}>Procesando y convirtiendo a WAV...</Text>
          </View>
        )}

        {/* Micrófono Estático / Placeholder */}
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
                  <LinearGradient colors={['#3B82F6', '#14B8A6']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={StyleSheet.absoluteFillObject} />
                  {isProcessing ? (
                    <Feather name="loader" size={32} color="#fff" />
                  ) : (
                    <Feather name="mic" size={40} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Onda Estática Placeholder */}
            <View style={styles.waveformStatic}>
              {[0.3, 0.5, 0.8, 1, 0.8, 0.5, 0.3].map((base, i) => (
                <View key={i} style={[styles.waveBarStatic, { height: 10 + Math.random() * 20 * base }]} />
              ))}
            </View>
          </Animated.View>
        )}
        
        {/* Botón Atrás falso */}
        <View style={{ flex: 1 }} />
        {!isRecording && (
          <View style={styles.bottomNav}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>&lt;    Atrás</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Overlay Oscuro Durante Grabación */}
      {isRecording && (
        <View style={styles.recordingOverlay} pointerEvents="box-none">
          <View style={styles.recordingOverlayContent}>
            
            <View style={{ height: 60 }} /> {/* Espaciador */}
            
            <View style={styles.instructionsBoxDark}>
              <Text style={styles.instructionMainDark}>{currentStep.instruction}</Text>
              <Text style={styles.instructionHighlightDark}>{currentStep.highlight}</Text>
            </View>

            <View style={{ height: 20 }} />

            <Text style={styles.recordingTopLabel}>REGISTRANDO TEST</Text>
            <Text style={styles.recordingTimer}>
              00:{String(recordingSeconds).padStart(2, '0')}
            </Text>

            {isStopDisabled && currentStep.minSeconds > 0 && (
               <Text style={styles.recordingWarningLabel}>
                 (Mínimo {currentStep.minSeconds}s)
               </Text>
            )}

            <View style={{ flex: 1 }} />

            {/* Onda dinámica cian */}
            <View style={styles.waveformDynamic}>
              {Array.from({ length: 30 }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.waveBarDynamic, { height: 10 + Math.random() * 60 }]}
                />
              ))}
            </View>

            {/* Micrófono Apagado y Controles */}
            <View style={styles.recordingControlsArea}>
              <View style={styles.micRingOuterDark}>
                <View style={styles.recordButtonDark}>
                  <Feather name="mic" size={40} color="#333" />
                </View>
              </View>

              {/* Botones de acción flotantes */}
              <View style={styles.fabContainer}>
                {/* Botón Stop / Check */}
                <TouchableOpacity
                  style={[styles.fabButton, isStopDisabled && { opacity: 0.5 }]}
                  onPress={handleStopRecording}
                  disabled={isStopDisabled}
                  activeOpacity={0.8}
                >
                  <Feather name="check" size={32} color="#4F46E5" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={{ height: 100 }} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, padding: 24, alignItems: "center", paddingTop: 40 },
  logo: { width: 120, height: 40, marginBottom: 16 },
  progressRow: { flexDirection: "row", gap: 8, marginBottom: 40 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E0E7FF" },
  progressDotActive: { backgroundColor: "#3B82F6" },
  stepLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#6B7280", marginBottom: 8 },
  instructionsBox: { alignItems: "center", marginBottom: 36, paddingHorizontal: 16 },
  instructionMain: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#374151", textAlign: "center", lineHeight: 20, marginBottom: 16 },
  instructionHighlight: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#1F2937", textAlign: "center", lineHeight: 34 },
  
  instructionsBoxDark: { alignItems: "center", marginBottom: 16, paddingHorizontal: 16 },
  instructionMainDark: { fontFamily: "Inter_500Medium", fontSize: 13, color: "#9CA3AF", textAlign: "center", lineHeight: 20, marginBottom: 16 },
  instructionHighlightDark: { fontFamily: "Inter_700Bold", fontSize: 26, color: "#F9FAFB", textAlign: "center", lineHeight: 34 },
  
  processingBox: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 28 },
  processingText: { fontFamily: "Inter_500Medium", fontSize: 15, color: "#4B5563" },
  
  micRingOuter: { padding: 4, borderRadius: 100, borderWidth: 1, borderColor: "#BFDBFE" },
  micRingInner: { padding: 8, borderRadius: 100, backgroundColor: "#fff" },
  recordButton: {
    width: 110, height: 110, borderRadius: 55, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  recordButtonDisabled: { opacity: 0.5 },
  waveformStatic: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 40, height: 30 },
  waveBarStatic: { width: 3, backgroundColor: "#93C5FD", borderRadius: 2 },
  
  bottomNav: { width: "100%", alignItems: "center", paddingBottom: 20 },
  backButton: { backgroundColor: "#F3F4F6", paddingVertical: 12, paddingHorizontal: 32, borderRadius: 8 },
  backButtonText: { fontFamily: "Inter_500Medium", color: "#4B5563", fontSize: 14 },
  
  recordingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#111827", opacity: 0.96 },
  recordingOverlayContent: { ...StyleSheet.absoluteFillObject, alignItems: "center", padding: 24 },
  recordingTopLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#D1D5DB", letterSpacing: 1, marginBottom: 8 },
  recordingTimer: { fontFamily: "Inter_400Regular", fontSize: 44, color: "#fff" },
  recordingWarningLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: "#9CA3AF", marginTop: 8 },
  
  waveformDynamic: { flexDirection: "row", alignItems: "center", gap: 4, height: 100, marginBottom: 40 },
  waveBarDynamic: { width: 4, backgroundColor: "#06B6D4", borderRadius: 2 },
  
  recordingControlsArea: { alignItems: "center", justifyContent: "center" },
  micRingOuterDark: { padding: 4, borderRadius: 100, borderWidth: 1, borderColor: "#374151" },
  recordButtonDark: { width: 110, height: 110, borderRadius: 55, backgroundColor: "#1F2937", alignItems: "center", justifyContent: "center" },
  
  fabContainer: { position: "absolute", flexDirection: "row", gap: 40 },
  fabButton: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", elevation: 5, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
  
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 28 },
  modalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 32, alignItems: "center", width: "100%", maxWidth: 340 },
  modalInstruction: { fontFamily: "Inter_500Medium", fontSize: 15, color: "#4B5563", textAlign: "center", marginBottom: 10 },
  countdownCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#000", alignItems: "center", justifyContent: "center", marginTop: 20 },
  countdownNumber: { fontFamily: "Inter_900Black", color: "#fff", fontSize: 36 },
  thankYouIcon: { marginBottom: 16 },
  thankYouText: { fontFamily: "Inter_800ExtraBold", fontSize: 18, color: "#1F2937", textAlign: "center" },
});
