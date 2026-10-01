import React from 'react';
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
import { RouteProp } from '@react-navigation/native';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LearningCareResult'>;
  route: RouteProp<RootStackParamList, 'LearningCareResult'>;
};

const ROUTE_INFO = {
  'Promoción': { color: '#4338CA', bg: '#E0E7FF', icon: 'check-circle', desc: 'No se observan señales de riesgo inmediato.' },
  'Prevención': { color: '#B45309', bg: '#FEF3C7', icon: 'info', desc: 'Se detecta un nivel de desgaste que podría requerir acciones generales.' },
  'Riesgo': { color: '#BE123C', bg: '#FFE4E6', icon: 'alert-circle', desc: 'Se identifican señales que requieren atención y acompañamiento.' },
};

export default function LearningCareResultScreen({ navigation, route }: Props) {
  const { studentId, routeResult, scores } = route.params;
  const info = ROUTE_INFO[routeResult as keyof typeof ROUTE_INFO] || ROUTE_INFO['Promoción'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Feather name="check-circle" size={64} color="#4338CA" style={{ marginBottom: 24 }} />
          <Text style={styles.title}>Evaluación Completada</Text>
          <Text style={styles.subtitle}>
            Gracias por participar. Tus respuestas han sido guardadas de forma segura.
          </Text>
        </View>

        <View style={styles.resultContainer}>
          <Text style={styles.resultLabel}>RESULTADO DEL ALGORITMO (Demo)</Text>
          
          <View style={[styles.routeCard, { backgroundColor: info.bg }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
              <Feather name={info.icon as any} size={24} color={info.color} />
              <Text style={[styles.routeTitle, { color: info.color }]}>{routeResult}</Text>
            </View>
            <Text style={[styles.routeDesc, { color: info.color }]}>{info.desc}</Text>
          </View>
          
          <View style={styles.scoresCard}>
            <Text style={styles.scoresTitle}>Puntajes Internos ({studentId}):</Text>
            <Text style={styles.scoreText}>Calidad de Vida (KIDSCREEN): {scores.k}</Text>
            <Text style={styles.scoreText}>Ansiedad (GAD-7): {scores.g}</Text>
            <Text style={styles.scoreText}>Depresión (PHQ-9): {scores.p}</Text>
            <Text style={styles.scoreText}>Ítem Sensible: {scores.s}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.homeButton} 
          onPress={() => navigation.navigate('ServiceSelection')} 
          activeOpacity={0.8}
        >
          <Text style={styles.homeButtonText}>Volver al Inicio</Text>
          <Feather name="home" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 40,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_900Black",
    color: "#111827",
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#4B5563",
    textAlign: 'center',
    lineHeight: 24,
  },
  resultContainer: {
    marginBottom: 40,
  },
  resultLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#4338CA",
    marginBottom: 12,
    letterSpacing: 1,
  },
  routeCard: {
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 20,
    fontFamily: "Inter_800ExtraBold",
  },
  routeDesc: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
  },
  scoresCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  scoresTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#111827",
    marginBottom: 12,
  },
  scoreText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#4B5563",
    marginBottom: 6,
  },
  homeButton: {
    backgroundColor: '#4338CA',
    borderRadius: 100,
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    gap: 8,
  },
  homeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
});
