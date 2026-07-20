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

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MentalHealthQuestion'>;
  route: RouteProp<RootStackParamList, 'MentalHealthQuestion'>;
};

const QUESTIONS_ESCOLAR = [
  "Durante las últimas dos semanas, ¿con qué frecuencia has tenido pocas ganas o poco interés en hacer las cosas que normalmente disfrutas?",
  "Durante las últimas dos semanas, ¿con qué frecuencia te has sentido triste, desanimado o pensando que las cosas no van a mejorar?",
  "Durante las últimas dos semanas, ¿con qué frecuencia te has sentido nervioso, preocupado o muy tenso?",
  "Durante las últimas dos semanas, ¿con qué frecuencia te ha costado dejar de preocuparte o sacar una preocupación de tu cabeza?",
  "Durante las últimas dos semanas, ¿con qué frecuencia has sentido que las exigencias del colegio, de tu casa o de tu vida diaria eran demasiado para ti?",
  "Durante las últimas dos semanas, ¿con qué frecuencia te ha costado relajarte o sentirte tranquilo, incluso cuando tenías la oportunidad?"
];

const QUESTIONS_UNIVERSITARIO = [
  "Durante las últimas dos semanas, ¿con qué frecuencia has tenido poco interés o placer en hacer las cosas?",
  "Durante las últimas dos semanas, ¿con qué frecuencia te has sentido desanimado, deprimido o sin esperanza?",
  "Durante las últimas dos semanas, ¿con qué frecuencia te has sentido nervioso, ansioso o muy tenso?",
  "Durante las últimas dos semanas, ¿con qué frecuencia te ha costado dejar de preocuparte o controlar tus preocupaciones?",
  "Durante las últimas dos semanas, ¿con qué frecuencia has sentido que las exigencias del estudio, el trabajo o tu vida cotidiana te sobrepasaban?",
  "Durante las últimas dos semanas, ¿con qué frecuencia te ha costado relajarte, incluso cuando tenías la oportunidad?"
];

const ALTERNATIVAS = [
  "Nunca",
  "Algunos días",
  "Más de la mitad de los días",
  "Casi todos los días"
];

export default function MentalHealthQuestionScreen({ navigation, route }: Props) {
  const { target, initialAudioUri } = route.params;
  const questionsList = target === 'escolar' ? QUESTIONS_ESCOLAR : QUESTIONS_UNIVERSITARIO;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);

  function handleContinue() {
    if (!selectedOption) return;
    
    const newAnswers = [...answers, selectedOption];
    setAnswers(newAnswers);

    if (currentIndex < questionsList.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null); // Resetear selección para la nueva pregunta
    } else {
      console.log('Test completado. Pasando a pantalla final con:', newAnswers);
      navigation.navigate('MentalHealthFinal', { target, answers: newAnswers, initialAudioUri });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.questionNumber}>Pregunta {currentIndex + 1} de 6</Text>
          <Text style={styles.title}>{questionsList[currentIndex]}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {ALTERNATIVAS.map((alt) => {
            const isSelected = selectedOption === alt;
            return (
              <TouchableOpacity
                key={alt}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => setSelectedOption(alt)}
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

        {selectedOption && (
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
    flexGrow: 1, // Permite que el botón de continuar baje si hay espacio
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
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000',
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
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  optionTextSelected: {
    color: '#78350f',
    fontWeight: '800',
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 'auto', // Empuja el botón hacia abajo si hay espacio
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
