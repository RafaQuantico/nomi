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
import HelpButton from '../components/HelpButton';
import HelpOverlay from '../components/HelpOverlay';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LearningCareQuestion'>;
  route: RouteProp<RootStackParamList, 'LearningCareQuestion'>;
};

const QUESTIONS = [
  {
    text: "En general, ¿cómo calificarías tu salud y bienestar emocional?",
    options: ["Muy mala", "Mala", "Regular", "Buena", "Excelente"],
    values: [0, 1, 2, 3, 4],
    domain: 'k',
    station: 'ESTACIÓN 1 · CÓMO TE HAS SENTIDO'
  },
  {
    text: "Durante las últimas semanas, ¿te has sentido lleno/a de energía?",
    options: ["Nunca", "Casi nunca", "A veces", "Casi siempre", "Siempre"],
    values: [0, 1, 2, 3, 4],
    domain: 'k',
    station: 'ESTACIÓN 1 · CÓMO TE HAS SENTIDO'
  },
  {
    text: "¿Cuántas veces te has sentido nervioso, inquieto o con los nervios de punta?",
    options: ["Nunca", "Algunos días", "Más de la mitad de los días", "Casi todos los días"],
    values: [0, 1, 2, 3],
    domain: 'g',
    station: 'ESTACIÓN 2 · TUS PREOCUPACIONES'
  },
  {
    text: "¿No has podido dejar de preocuparte o controlar tu preocupación?",
    options: ["Nunca", "Algunos días", "Más de la mitad de los días", "Casi todos los días"],
    values: [0, 1, 2, 3],
    domain: 'g',
    station: 'ESTACIÓN 2 · TUS PREOCUPACIONES'
  },
  {
    text: "¿Has tenido poco interés o placer en hacer las cosas?",
    options: ["Nunca", "Algunos días", "Más de la mitad de los días", "Casi todos los días"],
    values: [0, 1, 2, 3],
    domain: 'p',
    station: 'ESTACIÓN 3 · TU ÁNIMO'
  },
  {
    text: "¿Te has sentido decaído/a, deprimido/a o sin esperanzas?",
    options: ["Nunca", "Algunos días", "Más de la mitad de los días", "Casi todos los días"],
    values: [0, 1, 2, 3],
    domain: 'p',
    station: 'ESTACIÓN 3 · TU ÁNIMO'
  },
  {
    text: "¿Has tenido pensamientos de que estarías mejor muerto/a o de lastimarte de alguna manera?",
    options: ["Nunca", "Algunos días", "Más de la mitad de los días", "Casi todos los días"],
    values: [0, 1, 2, 3],
    domain: 's',
    station: 'ESTACIÓN 3 · TU ÁNIMO'
  }
];

export default function LearningCareQuestionScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
  const [scores, setScores] = useState({ k: 0, g: 0, p: 0, s: 0 });
  const [showHelp, setShowHelp] = useState(false);

  function handleNext() {
    if (selectedOptionIndex === null) return;
    
    const currentQ = QUESTIONS[currentIndex];
    const value = currentQ.values[selectedOptionIndex];
    
    const newScores = { ...scores };
    if (currentQ.domain === 'k') newScores.k += value;
    if (currentQ.domain === 'g') newScores.g += value;
    if (currentQ.domain === 'p') newScores.p += value;
    if (currentQ.domain === 's') {
      newScores.p += value;
      newScores.s += value;
    }
    
    setScores(newScores);

    if (currentIndex < QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOptionIndex(null);
    } else {
      let routeResult = 'Promoción';
      if (newScores.s > 0) {
        routeResult = 'Riesgo';
      } else if (newScores.p >= 4 || newScores.g >= 3) {
        routeResult = 'Riesgo';
      } else if (newScores.k < 4) {
        routeResult = 'Prevención';
      }
      
      navigation.navigate('LearningCareAudio', { studentId, routeResult, scores: newScores });
    }
  }

  function handleBack() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedOptionIndex(null);
    } else {
      navigation.goBack();
    }
  }

  const currentQ = QUESTIONS[currentIndex];
  const progressPercent = ((currentIndex + 1) / QUESTIONS.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButtonTop} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <HelpButton onPress={() => setShowHelp(true)} />
        </View>

        <View style={styles.progressHeader}>
          <Text style={styles.stationLabel}>{currentQ.station}</Text>
          <Text style={styles.progressCount}>{currentIndex + 1} / {QUESTIONS.length}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>

        <View style={styles.tabsContainer}>
          <View style={[styles.tab, styles.tabActive]}>
            <Text style={[styles.tabText, styles.tabTextActive]}>Tocar</Text>
          </View>
          <View style={styles.tab}>
            <Text style={styles.tabText}>Hablar</Text>
          </View>
          <View style={styles.tab}>
            <Text style={styles.tabText}>Escribir</Text>
          </View>
        </View>

        <Text style={styles.timeContext}>En las últimas dos semanas...</Text>
        <Text style={styles.questionText}>{currentQ.text}</Text>

        <View style={styles.optionsContainer}>
          {currentQ.options.map((alt, idx) => {
            const isSelected = selectedOptionIndex === idx;
            return (
              <TouchableOpacity
                key={alt}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => setSelectedOptionIndex(idx)}
                activeOpacity={0.8}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <Text style={styles.optionText}>{alt}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flex: 1, minHeight: 40 }} />

        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.bottomNavBack} onPress={handleBack}>
            <Text style={styles.bottomNavBackText}>Atrás</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.bottomNavNext, selectedOptionIndex === null && styles.bottomNavNextDisabled]} 
            onPress={handleNext}
            disabled={selectedOptionIndex === null}
          >
            <Text style={styles.bottomNavNextText}>Siguiente</Text>
            <Feather name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

      </ScrollView>
      <HelpOverlay visible={showHelp} onClose={() => setShowHelp(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
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
  timeContext: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#6B7280",
    marginBottom: 8,
  },
  questionText: {
    fontSize: 26,
    fontFamily: "Inter_500Medium",
    color: "#111827",
    lineHeight: 34,
    marginBottom: 32,
  },
  optionsContainer: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionCardSelected: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4338CA',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  radioCircleSelected: {
    borderColor: '#4338CA',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4338CA',
  },
  optionText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#111827",
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  bottomNavBack: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNavBackText: {
    color: '#111827',
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  bottomNavNext: {
    flex: 2,
    backgroundColor: '#4338CA',
    borderRadius: 100,
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bottomNavNextDisabled: {
    backgroundColor: '#9CA3AF',
  },
  bottomNavNextText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
