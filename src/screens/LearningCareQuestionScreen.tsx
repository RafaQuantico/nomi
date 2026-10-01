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
import { RootStackParamList } from '../../App';
import { Feather } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LearningCareQuestion'>;
};

const QUESTIONS = [
  {
    text: "En general, ¿cómo calificarías tu salud y bienestar emocional?",
    options: ["Muy mala", "Mala", "Regular", "Buena", "Excelente"],
    values: [0, 1, 2, 3, 4],
    domain: 'k' // KIDSCREEN proxy
  },
  {
    text: "Durante las últimas semanas, ¿te has sentido lleno/a de energía?",
    options: ["Nunca", "Casi nunca", "A veces", "Casi siempre", "Siempre"],
    values: [0, 1, 2, 3, 4],
    domain: 'k'
  },
  {
    text: "¿Te has sentido nervioso/a, ansioso/a o con los nervios de punta?",
    options: ["Nunca", "Varios días", "Más de la mitad de los días", "Casi todos los días"],
    values: [0, 1, 2, 3],
    domain: 'g' // GAD-7 proxy
  },
  {
    text: "¿No has podido dejar de preocuparte o controlar tu preocupación?",
    options: ["Nunca", "Varios días", "Más de la mitad de los días", "Casi todos los días"],
    values: [0, 1, 2, 3],
    domain: 'g'
  },
  {
    text: "¿Has tenido poco interés o placer en hacer las cosas?",
    options: ["Nunca", "Varios días", "Más de la mitad de los días", "Casi todos los días"],
    values: [0, 1, 2, 3],
    domain: 'p' // PHQ-9 proxy
  },
  {
    text: "¿Te has sentido decaído/a, deprimido/a o sin esperanzas?",
    options: ["Nunca", "Varios días", "Más de la mitad de los días", "Casi todos los días"],
    values: [0, 1, 2, 3],
    domain: 'p'
  },
  {
    text: "¿Has tenido pensamientos de que estarías mejor muerto/a o de lastimarte de alguna manera?",
    options: ["Nunca", "Varios días", "Más de la mitad de los días", "Casi todos los días"],
    values: [0, 1, 2, 3],
    domain: 's' // Sensible
  }
];

export default function LearningCareQuestionScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [scores, setScores] = useState({ k: 0, g: 0, p: 0, s: 0 });

  function handleContinue() {
    if (selectedOptionIndex === null) return;
    
    const currentQ = QUESTIONS[currentIndex];
    const value = currentQ.values[selectedOptionIndex];
    
    const newScores = { ...scores };
    if (currentQ.domain === 'k') newScores.k += value;
    if (currentQ.domain === 'g') newScores.g += value;
    if (currentQ.domain === 'p') newScores.p += value;
    if (currentQ.domain === 's') {
      newScores.p += value; // item sensible is also part of PHQ-9
      newScores.s += value;
    }
    
    setScores(newScores);

    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOptionIndex(null);
    } else {
      // Calculate Route
      let route = 'Promoción';
      if (newScores.s > 0) {
        route = 'Riesgo';
      } else if (newScores.p >= 4 || newScores.g >= 3) {
        route = 'Riesgo';
      } else if (newScores.k < 4) {
        route = 'Prevención';
      }
      
      // Go to open audio question
      navigation.navigate('LearningCareAudio', { 
        routeResult: route, 
        scores: newScores 
      });
    }
  }

  const currentQ = QUESTIONS[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.questionNumber}>Pregunta {currentIndex + 1} de {QUESTIONS.length}</Text>
          <Text style={styles.title}>{currentQ.text}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQ.options.map((alt, idx) => {
            const isSelected = selectedOptionIndex === idx;
            return (
              <TouchableOpacity
                key={alt}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => setSelectedOptionIndex(idx)}
                activeOpacity={0.7}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {alt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {selectedOptionIndex !== null && (
          <TouchableOpacity 
            style={styles.continueButton} 
            onPress={handleContinue} 
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scroll: {
    padding: 24,
    paddingTop: 12,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  header: {
    marginBottom: 32,
  },
  questionNumber: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#9CA3AF",
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_900Black",
    color: "#1F2937",
    lineHeight: 34,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 40,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#eee',
  },
  optionCardSelected: {
    backgroundColor: '#fff8e1',
    borderColor: '#f59e0b',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  radioCircleSelected: {
    borderColor: '#f59e0b',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f59e0b',
  },
  optionText: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: "#374151",
    flex: 1,
  },
  optionTextSelected: {
    color: '#78350f',
    fontFamily: "Inter_800ExtraBold",
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: "Inter_800ExtraBold",
  },
});
