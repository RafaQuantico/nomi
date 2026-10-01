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
import { LinearGradient } from 'expo-linear-gradient';
import HelpButton from '../components/HelpButton';
import HelpOverlay from '../components/HelpOverlay';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LearningCareWelcome'>;
  route: RouteProp<RootStackParamList, 'LearningCareWelcome'>;
};

export default function LearningCareWelcomeScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const [showHelp, setShowHelp] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>N O M I</Text>
            <Text style={styles.brandSubtitle}>E D U  C A R E</Text>
          </View>
          <HelpButton onPress={() => setShowHelp(true)} />
        </View>

        <Text style={styles.greeting}>
          Hola, <Text style={styles.greetingName}>[{studentId || 'Estudiante'}]</Text>
        </Text>
        <Text style={styles.subtitle}>
          Hoy tu colegio te invita a una actividad corta para saber cómo estás.
        </Text>

        <View style={styles.videoCard}>
          <View style={styles.playButtonWrapper}>
            <View style={styles.playButton}>
              <Feather name="play" size={24} color="#4338CA" style={{ marginLeft: 4 }} />
            </View>
          </View>
          <Text style={styles.videoTitle}>¿Qué es NOMI y cómo funciona?</Text>
          <Text style={styles.videoDuration}>VIDEO · [DURACIÓN]</Text>
          
          {/* Decorative wave */}
          <View style={styles.videoWave} />
        </View>

        <LinearGradient
          colors={['#4F46E5', '#38BDF8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.moduleCard}
        >
          <View style={styles.moduleIconWrapper}>
            <Feather name="heart" size={20} color="#fff" />
          </View>
          <Text style={styles.moduleLabel}>MÓDULO</Text>
          <Text style={styles.moduleTitle}>Learning Care</Text>
          
          <Text style={styles.moduleDesc}>
            Cuatro estaciones con preguntas sobre cómo te has sentido. No hay respuestas correctas ni incorrectas, y puedes responder tocando, hablando o escribiendo.
          </Text>

          <TouchableOpacity 
            style={styles.routeButton} 
            onPress={() => navigation.navigate('LearningCareRoadmap', { studentId })}
            activeOpacity={0.8}
          >
            <Text style={styles.routeButtonText}>Ver mi hoja de ruta</Text>
            <Feather name="arrow-right" size={20} color="#1F2937" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.footerNote}>
          <Feather name="lock" size={16} color="#4338CA" />
          <Text style={styles.footerNoteText}>Lo que respondas es confidencial.</Text>
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
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  brandContainer: {},
  brandTitle: {
    fontSize: 24,
    fontFamily: "Inter_900Black",
    color: "#111827",
    letterSpacing: 4,
  },
  brandSubtitle: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: "#374151",
    letterSpacing: 4,
    marginTop: 2,
  },
  greeting: {
    fontSize: 32,
    fontFamily: "Inter_500Medium",
    color: "#111827",
    marginBottom: 8,
  },
  greetingName: {
    fontFamily: "Inter_700Bold",
    color: "#4338CA",
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 32,
  },
  videoCard: {
    backgroundColor: '#0F172A',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  playButtonWrapper: {
    marginBottom: 20,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: 'center',
  },
  videoDuration: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#9CA3AF",
    letterSpacing: 2,
  },
  videoWave: {
    position: 'absolute',
    bottom: -20,
    width: '120%',
    height: 60,
    borderTopWidth: 2,
    borderColor: '#312E81',
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    opacity: 0.5,
  },
  moduleCard: {
    borderRadius: 24,
    padding: 32,
    marginBottom: 24,
  },
  moduleIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  moduleLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 2,
    marginBottom: 4,
  },
  moduleTitle: {
    fontSize: 28,
    fontFamily: "Inter_800ExtraBold",
    color: "#fff",
    marginBottom: 16,
  },
  moduleDesc: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#fff",
    lineHeight: 24,
    marginBottom: 32,
  },
  routeButton: {
    backgroundColor: '#fff',
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  routeButtonText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#1F2937",
    marginRight: 8,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  footerNoteText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#4B5563",
    marginLeft: 8,
  },
});
