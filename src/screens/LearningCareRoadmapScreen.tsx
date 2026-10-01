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
  navigation: NativeStackNavigationProp<RootStackParamList, 'LearningCareRoadmap'>;
  route: RouteProp<RootStackParamList, 'LearningCareRoadmap'>;
};

const STATIONS = [
  {
    num: 1,
    title: 'Cómo te has sentido',
    subtitle: '10 preguntas · tocar, hablar o escribir',
    descTitle: 'QUÉ MIDE',
    desc: 'Preguntas sobre tu energía, tus amigos, tu familia y el colegio. Nos ayudan a saber cómo va tu vida en general estos días.',
  },
  {
    num: 2,
    title: 'Tus preocupaciones',
    subtitle: '7 preguntas · últimas dos semanas',
    descTitle: 'QUÉ MIDE',
    desc: 'Preguntas sobre qué cosas te han tenido nervioso o inquieto últimamente.',
  },
  {
    num: 3,
    title: 'Tu ánimo',
    subtitle: '9 preguntas · últimas dos semanas',
    descTitle: 'QUÉ MIDE',
    desc: 'Preguntas para entender si te has sentido decaído, triste o sin ganas de hacer cosas.',
  },
  {
    num: 4,
    title: 'Con tus palabras',
    subtitle: '1 pregunta abierta · voz o texto',
    descTitle: 'QUÉ MIDE',
    desc: 'Un espacio seguro para que nos cuentes cualquier cosa que sientas que no te preguntamos y quieras compartir.',
  },
];

export default function LearningCareRoadmapScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const [showHelp, setShowHelp] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <HelpButton onPress={() => setShowHelp(true)} />
        </View>

        <Text style={styles.overline}>TU HOJA DE RUTA</Text>
        <Text style={styles.title}>Cuatro estaciones. Así sabes qué viene.</Text>
        <Text style={styles.subtitle}>Toca cada estación para ver de qué se trata.</Text>

        <View style={styles.stationsList}>
          {STATIONS.map((station, index) => {
            const isExpanded = expandedIndex === index;
            return (
              <TouchableOpacity
                key={station.num}
                style={[styles.stationCard, isExpanded && styles.stationCardExpanded]}
                onPress={() => setExpandedIndex(isExpanded ? -1 : index)}
                activeOpacity={0.8}
              >
                <View style={styles.stationHeader}>
                  <View style={[styles.numberCircle, isExpanded ? styles.numberCircleActive : styles.numberCircleInactive]}>
                    <Text style={[styles.numberText, isExpanded ? styles.numberTextActive : styles.numberTextInactive]}>{station.num}</Text>
                  </View>
                  <View style={styles.stationHeaderText}>
                    <Text style={styles.stationTitle}>{station.title}</Text>
                    <Text style={styles.stationSubtitle}>{station.subtitle}</Text>
                  </View>
                  <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={24} color="#4338CA" />
                </View>

                {isExpanded && (
                  <View style={styles.stationDetails}>
                    <Text style={styles.descTitle}>{station.descTitle}</Text>
                    <Text style={styles.descText}>{station.desc}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ flex: 1, minHeight: 40 }} />

        <TouchableOpacity 
          style={styles.startButton} 
          onPress={() => navigation.navigate('LearningCareAssent', { studentId })}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Iniciar</Text>
          <Feather name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>

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
  backButton: {
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
  overline: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#4338CA",
    letterSpacing: 2,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_900Black",
    color: "#111827",
    lineHeight: 38,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#4B5563",
    marginBottom: 32,
  },
  stationsList: {
    gap: 16,
  },
  stationCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  stationCardExpanded: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    borderColor: 'transparent',
  },
  stationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  numberCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  numberCircleActive: {
    backgroundColor: '#4338CA',
  },
  numberCircleInactive: {
    backgroundColor: '#E0E7FF',
  },
  numberText: {
    fontSize: 18,
    fontFamily: "Inter_800ExtraBold",
  },
  numberTextActive: {
    color: '#fff',
  },
  numberTextInactive: {
    color: '#4338CA',
  },
  stationHeaderText: {
    flex: 1,
  },
  stationTitle: {
    fontSize: 18,
    fontFamily: "Inter_800ExtraBold",
    color: "#111827",
    marginBottom: 4,
  },
  stationSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#6B7280",
  },
  stationDetails: {
    marginTop: 20,
    paddingLeft: 64,
  },
  descTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#4338CA",
    letterSpacing: 2,
    marginBottom: 8,
  },
  descText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#4B5563",
    lineHeight: 22,
  },
  startButton: {
    backgroundColor: '#4338CA',
    flexDirection: 'row',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginRight: 8,
  },
});
