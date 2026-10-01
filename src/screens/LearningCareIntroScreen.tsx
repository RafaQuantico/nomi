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
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LearningCareIntro'>;
};

export default function LearningCareIntroScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.brand}>NOMI LEARNING CARE</Text>
          <Text style={styles.title}>Antes de la crisis, siempre hubo una señal.</Text>
          <Text style={styles.subtitle}>
            Una arquitectura de cuidado escolar que evalúa de forma continua y a escala, detectando a quienes necesitan ayuda antes de que lo pidan.
          </Text>
        </View>

        <View style={styles.cardsContainer}>
          <View style={[styles.card, { backgroundColor: '#F0F5DF' }]}>
            <Text style={[styles.cardTitle, { color: '#5A7717' }]}>Promoción</Text>
            <Text style={styles.cardText}>La mayoría de la comunidad. No presenta señales de riesgo.</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#FFF2D4' }]}>
            <Text style={[styles.cardTitle, { color: '#855E00' }]}>Prevención</Text>
            <Text style={styles.cardText}>Desgaste moderado. Requiere acciones generales para mejorar el clima.</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#FFE3DE' }]}>
            <Text style={[styles.cardTitle, { color: '#992B15' }]}>Riesgo</Text>
            <Text style={styles.cardText}>Necesita atención y derivación acompañada.</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.startButton} 
          onPress={() => navigation.navigate('LearningCareQuestion')} 
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#3B82F6', '#14B8A6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFillObject}
          />
          <Text style={styles.startButtonText}>Comenzar Evaluación</Text>
        </TouchableOpacity>
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
  brand: {
    fontSize: 12,
    fontFamily: "Inter_800ExtraBold",
    color: "#6B7280",
    letterSpacing: 2,
    marginBottom: 12,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_900Black",
    color: "#1F2937",
    lineHeight: 40,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#4B5563",
    lineHeight: 24,
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 40,
  },
  card: {
    padding: 20,
    borderRadius: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Inter_800ExtraBold",
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#374151",
    lineHeight: 22,
  },
  startButton: {
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 'auto',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: "Inter_800ExtraBold",
    zIndex: 1,
  },
});
