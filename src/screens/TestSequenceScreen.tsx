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
  Alert
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../App";
import { useAuth } from "../context/AuthContext";
import { useWavRecorder } from "../hooks/useWavRecorder";

type Props = NativeStackScreenProps<RootStackParamList, "TestSequence">;

const AM_QUESTIONS = [
  "¡Buenos días! Cuéntame, ¿cuál es tu objetivo principal para el turno de hoy y cómo planeas lograrlo?",
  "Hola. Antes de empezar, descríbeme brevemente cómo te preparaste físicamente o mentalmente para venir al trabajo hoy.",
  "¡Hola! Imagina que hoy será un turno excelente. ¿Qué cosas tendrían que pasar para que al salir sientas que fue un gran día?",
  "Buen turno. ¿Hay alguna tarea o desafío particular que tengas que enfrentar hoy? Cuéntame un poco sobre ello."
];

const PM_QUESTIONS = [
  "¡Buen trabajo hoy! Cuéntame en detalle, ¿cuál fue la parte más difícil o pesada de tu turno y cómo la superaste?",
  "Hola de nuevo. Si pudieras retroceder el tiempo y repetir este turno, ¿hay algo que harías de manera diferente?",
  "¡Terminaste! Describe brevemente una interacción o un momento que te haya llamado la atención durante el día de hoy.",
  "Hola. Ya puedes descansar, pero antes cuéntame: ¿Qué fue lo más interesante que aprendiste o resolviste en tu turno?"
];

export default function TestSequenceScreen({ route, navigation }: Props) {
  const { eventPhase, samnPerelli } = route.params;
  const { user } = useAuth();
  
  const { isRecording, startRecording, stopRecording } = useWavRecorder();
  
  const [stepIndex, setStepIndex] = useState(0);
  const [recordings, setRecordings] = useState<{ label: string; base64: string; mimeType: string }[]>([]);
  
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
    const qList = eventPhase === "activo" ? AM_QUESTIONS : PM_QUESTIONS;
    const q = qList[Math.floor(Math.random() * qList.length)];
    setDynamicQuestion(q);
  }, [eventPhase]);

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
      label: "Audio 1 / 2",
      instruction: "Por favor lee en voz alta la siguiente frase",
      highlight: "“El rápido zorro marrón salta sobre el perro perezoso.”",
      recordingLabel: "Lee la frase...",
      minSeconds: 0
    },
    {
      label: "Audio 2 / 2",
      instruction: "Responde de forma fluida a la siguiente pregunta durante al menos 20 segundos",
      highlight: dynamicQuestion,
      recordingLabel: "Hablando libremente...",
      minSeconds: 20
    }
  ];

  const currentStep = steps[stepIndex];
  
  const isStopDisabled = isRecording && recordingSeconds < currentStep.minSeconds;

  const startCountdown = () => {
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
        const newRecordings = [...recordings, { label: "Paso " + (stepIndex + 1), base64: result.base64, mimeType: "audio/wav" }];
        setRecordings(newRecordings);
        
        setIsProcessing(false);
        setShowThankYou(true);
        setTimeout(() => {
          setShowThankYou(false);
          if (stepIndex < steps.length - 1) {
            setStepIndex(stepIndex + 1);
          } else {
            submitAll(newRecordings);
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

  const submitAll = async (finalRecordings: any[]) => {
    setIsProcessing(true);
    try {
      const payload = {
        action: "test_completed",
        email: user?.email,
        nickname: user?.nickname,
        uuid: user?.uuid,
        eventPhase: eventPhase,
        samnPerelli: samnPerelli,
        completedAt: new Date().toISOString(),
        audios: finalRecordings,
      };

      const res = await fetch("https://nomi-app-web.vercel.app/api/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsCompleted(true);
      } else {
        throw new Error("Error en webhook");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo enviar el test.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isCompleted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.completedContainer}>
          <View style={styles.completedIconCircle}>
            <Feather name="check" size={48} color="#fff" />
          </View>
          <Text style={styles.completedTitle}>¡Test Completado!</Text>
          <Text style={styles.completedBody}>Tus respuestas han sido enviadas de forma segura y confidencial. ¡Gracias por participar!</Text>
          <TouchableOpacity style={styles.doneButton} onPress={() => navigation.navigate("ServiceSelection")}>
            <Text style={styles.doneButtonText}>Volver al Inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

      <View style={styles.content}>
        <Text style={styles.stepLabel}>{currentStep.label}</Text>
        <View style={styles.progressRow}>
          {steps.map((_, i) => (
            <View key={i} style={[styles.progressDot, i <= stepIndex && styles.progressDotActive]} />
          ))}
        </View>

        {!isRecording && !isProcessing && (
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionMain}>{currentStep.instruction}</Text>
            <Text style={styles.instructionHighlight}>{currentStep.highlight}</Text>
            {currentStep.minSeconds > 0 && (
              <Text style={styles.instructionDetail}>
                Debes hablar durante un mínimo de {currentStep.minSeconds} segundos para que se habilite el botón detener.
              </Text>
            )}
          </View>
        )}

        {isRecording && (
          <View style={styles.recordingInfoBox}>
            <Text style={styles.recordingHighlight}>{currentStep.highlight}</Text>
            <Text style={styles.recordingLabel}>
              {currentStep.minSeconds > 0 ? "Tiempo transcurrido: " + recordingSeconds + "s" : currentStep.recordingLabel}
            </Text>
            {isStopDisabled && (
              <Text style={styles.recordingWarning}>Habla por al menos {currentStep.minSeconds - recordingSeconds}s más...</Text>
            )}
          </View>
        )}

        {isProcessing && (
          <View style={styles.processingBox}>
            <Feather name="loader" size={24} color="#000" />
            <Text style={styles.processingText}>Procesando y convirtiendo a WAV...</Text>
          </View>
        )}

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={[
              styles.recordButton,
              isRecording && !isStopDisabled && styles.recordButtonActive,
              (isProcessing || isStopDisabled) && styles.recordButtonDisabled,
            ]}
            onPress={isRecording ? handleStopRecording : startCountdown}
            disabled={isProcessing || isStopDisabled}
            activeOpacity={0.85}
          >
            {isProcessing ? (
              <Feather name="loader" size={32} color="#fff" />
            ) : isRecording ? (
              <>
                <Feather name={isStopDisabled ? "lock" : "square"} size={28} color="#fff" />
                <Text style={styles.recordButtonLabel}>{isStopDisabled ? "Espera..." : "Detener"}</Text>
              </>
            ) : (
              <>
                <Feather name="mic" size={32} color="#fff" />
                <Text style={styles.recordButtonLabel}>Comenzar</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
        
        {isRecording && (
          <View style={styles.waveform}>
            {[0.5, 0.75, 1, 0.75, 0.5].map((base, i) => (
              <View
                key={i}
                style={[styles.waveBar, { height: 6 + Math.random() * 20 * base }]}
              />
            ))}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { flex: 1, padding: 28, alignItems: "center", justifyContent: "center" },
  progressRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  progressDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#e0e0e0" },
  progressDotActive: { backgroundColor: "#000" },
  stepLabel: { fontSize: 13, color: "#888", fontWeight: "600", marginBottom: 28 },
  instructionsBox: { alignItems: "center", marginBottom: 36, paddingHorizontal: 8 },
  instructionMain: { fontSize: 15, color: "#666", textAlign: "center", lineHeight: 22, marginBottom: 10 },
  instructionHighlight: { fontSize: 20, fontWeight: "900", color: "#000", textAlign: "center", lineHeight: 28 },
  instructionDetail: { fontSize: 13, color: "#d97706", textAlign: "center", marginTop: 12, fontWeight: "600" },
  recordingInfoBox: { alignItems: "center", marginBottom: 28, paddingHorizontal: 16, width: "100%" },
  recordingHighlight: { fontSize: 22, fontWeight: "900", color: "#000", textAlign: "center", lineHeight: 32, marginBottom: 16 },
  recordingLabel: { fontSize: 15, color: "#555", textAlign: "center", marginBottom: 8, fontStyle: "italic" },
  recordingWarning: { fontSize: 14, color: "#d97706", fontWeight: "bold" },
  processingBox: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 28 },
  processingText: { fontSize: 15, color: "#555" },
  recordButton: {
    width: 130, height: 130, borderRadius: 65, backgroundColor: "#000",
    alignItems: "center", justifyContent: "center", gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 8, elevation: 6,
  },
  recordButtonActive: { backgroundColor: "#1a1a1a", borderWidth: 2, borderColor: "#555" },
  recordButtonDisabled: { backgroundColor: "#9ca3af" },
  recordButtonLabel: { color: "#fff", fontSize: 12, fontWeight: "700" },
  waveform: { flexDirection: "row", alignItems: "flex-end", gap: 5, marginTop: 24, height: 56 },
  waveBar: { width: 7, backgroundColor: "#000", borderRadius: 3.5, minHeight: 6 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center", padding: 28 },
  modalCard: { backgroundColor: "#fff", borderRadius: 24, padding: 32, alignItems: "center", width: "100%", maxWidth: 340 },
  modalInstruction: { fontSize: 15, color: "#666", textAlign: "center", lineHeight: 22, marginBottom: 10 },
  countdownCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#000", alignItems: "center", justifyContent: "center", marginTop: 20 },
  countdownNumber: { color: "#fff", fontSize: 36, fontWeight: "900" },
  thankYouIcon: { marginBottom: 16 },
  thankYouText: { fontSize: 18, fontWeight: "800", color: "#000", textAlign: "center", lineHeight: 26 },
  completedContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  completedIconCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: "#000", alignItems: "center", justifyContent: "center", marginBottom: 24 },
  completedTitle: { fontSize: 26, fontWeight: "900", color: "#000", marginBottom: 16, textAlign: "center" },
  completedBody: { fontSize: 15, color: "#555", textAlign: "center", lineHeight: 22, marginBottom: 40 },
  doneButton: { backgroundColor: "#000", paddingVertical: 16, paddingHorizontal: 40, borderRadius: 14 },
  doneButtonText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
