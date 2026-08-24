import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';

type Props = NativeStackScreenProps<RootStackParamList, 'FatigueSubstance'>;

export default function FatigueSubstanceScreen({ route, navigation }: Props) {
  const { recordings, eventPhase, samnPerelli, testStartTime } = route.params;
  const { user } = useAuth();

  const [hasSubstance, setHasSubstance] = useState<'Si' | 'No' | null>(null);
  const [selectedSubstances, setSelectedSubstances] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const toggleSubstance = (substance: string) => {
    if (selectedSubstances.includes(substance)) {
      setSelectedSubstances(selectedSubstances.filter((s) => s !== substance));
    } else {
      setSelectedSubstances([...selectedSubstances, substance]);
    }
  };

  const handleFinish = async () => {
    if (hasSubstance === null) {
      Alert.alert("Selección requerida", "Por favor indique si ha ingerido alguna sustancia.");
      return;
    }
    if (hasSubstance === 'Si' && selectedSubstances.length === 0) {
      Alert.alert("Selección requerida", "Por favor indique qué sustancia(s) ha ingerido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        action: "test_completed",
        email: user?.email,
        nickname: user?.nickname,
        uuid: user?.uuid,
        eventPhase,
        samnPerelli,
        testStartTime,
        completedAt: new Date().toISOString(),
        audios: recordings,
        hasSubstance,
        selectedSubstances: hasSubstance === 'Si' ? selectedSubstances.join(', ') : 'Ninguna'
      };

      const res = await fetch("https://script.google.com/macros/s/AKfycbzuckGDrAO4FXJvhTS08XbYDQyGmiVS-masTb7Ov3lHu8sDZpOV8_vpudET0b7NXkZe/exec", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
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
      setIsSubmitting(false);
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.questionNumber}>PREGUNTA FINAL</Text>
          <Text style={styles.title}>
            Para finalizar, ¿ha ingerido durante el día de hoy algún fármaco, bebida alcohólica u otra sustancia que pueda alterar sus reflejos o coordinación motora?
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[styles.optionCard, hasSubstance === 'Si' && styles.optionCardSelected]}
            onPress={() => setHasSubstance('Si')}
          >
            <Feather name="check-circle" size={20} color={hasSubstance === 'Si' ? '#f59e0b' : '#333'} />
            <Text style={[styles.optionText, hasSubstance === 'Si' && styles.optionTextSelected]}>Sí</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionCard, hasSubstance === 'No' && styles.optionCardSelected]}
            onPress={() => { setHasSubstance('No'); setSelectedSubstances([]); }}
          >
            <Feather name="x-circle" size={20} color={hasSubstance === 'No' ? '#f59e0b' : '#333'} />
            <Text style={[styles.optionText, hasSubstance === 'No' && styles.optionTextSelected]}>No</Text>
          </TouchableOpacity>
        </View>

        {hasSubstance === 'Si' && (
          <View style={styles.substancesSection}>
            <Text style={styles.subTitle}>¿Podría por favor indicarnos cuál de las anteriores?</Text>
            <View style={styles.optionsContainer}>
              {['Remedio o fármaco', 'Bebida alcohólica', 'Otra sustancia'].map((substance) => (
                <TouchableOpacity
                  key={substance}
                  style={[styles.optionCard, selectedSubstances.includes(substance) && styles.optionCardSelected]}
                  onPress={() => toggleSubstance(substance)}
                >
                  <Feather
                    name={selectedSubstances.includes(substance) ? "check-square" : "square"}
                    size={20}
                    color={selectedSubstances.includes(substance) ? '#f59e0b' : '#333'}
                  />
                  <Text style={[styles.optionText, selectedSubstances.includes(substance) && styles.optionTextSelected]}>
                    {substance}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[styles.continueButton, isSubmitting && styles.continueButtonDisabled]}
          onPress={handleFinish}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.continueButtonText}>Finalizar</Text>
          )}
        </TouchableOpacity>
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
  subTitle: { fontSize: 18, fontWeight: '700', color: '#333', marginBottom: 16 },
  optionsContainer: { gap: 12, marginBottom: 24 },
  substancesSection: { marginTop: 16 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f8f8',
    padding: 16, borderRadius: 12, borderWidth: 2, borderColor: '#eee', gap: 12
  },
  optionCardSelected: { backgroundColor: '#fff8e1', borderColor: '#f59e0b' },
  optionText: { fontSize: 16, fontWeight: '600', color: '#333' },
  optionTextSelected: { color: '#78350f', fontWeight: '800' },
  continueButton: {
    backgroundColor: '#000', padding: 18, borderRadius: 12,
    alignItems: 'center', marginTop: 'auto'
  },
  continueButtonDisabled: { opacity: 0.7 },
  continueButtonText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  
  completedContainer: {
    flex: 1, justifyContent: "center", alignItems: "center", padding: 32,
    maxWidth: 400, alignSelf: "center", width: "100%",
  },
  completedIconCircle: {
    width: 96, height: 96, borderRadius: 48, backgroundColor: "#16a34a",
    justifyContent: "center", alignItems: "center", marginBottom: 24,
  },
  completedTitle: { fontSize: 28, fontWeight: "900", color: "#000", marginBottom: 12, textAlign: "center" },
  completedBody: { fontSize: 16, color: "#555", textAlign: "center", lineHeight: 24, marginBottom: 40 },
  doneButton: { backgroundColor: "#000", paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12 },
  doneButtonText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
