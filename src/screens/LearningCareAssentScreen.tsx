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
  navigation: NativeStackNavigationProp<RootStackParamList, 'LearningCareAssent'>;
  route: RouteProp<RootStackParamList, 'LearningCareAssent'>;
};

export default function LearningCareAssentScreen({ navigation, route }: Props) {
  const { studentId } = route.params;
  const [showHelp, setShowHelp] = useState(false);
  const [agreed, setAgreed] = useState(false);

  function handleStart() {
    if (agreed) {
      navigation.navigate('LearningCareQuestion', { studentId });
    }
  }

  function handleSkip() {
    navigation.navigate('ServiceSelection'); // Or go back to start
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Feather name="arrow-left" size={24} color="#111827" />
          </TouchableOpacity>
          <HelpButton onPress={() => setShowHelp(true)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.overline}>ANTES DE EMPEZAR</Text>
          <Text style={styles.title}>Tú decides si participas</Text>

          <View style={styles.bulletItem}>
            <View style={[styles.bulletIconWrapper, { backgroundColor: '#E0E7FF' }]}>
              <Feather name="pause" size={20} color="#4338CA" />
            </View>
            <Text style={styles.bulletText}>
              Es voluntario. Puedes pausar o parar cuando quieras, sin problema.
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <View style={[styles.bulletIconWrapper, { backgroundColor: '#E0E7FF' }]}>
              <Feather name="check" size={20} color="#4338CA" />
            </View>
            <Text style={styles.bulletText}>
              No hay respuestas correctas ni incorrectas. No es una prueba ni tiene nota.
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <View style={[styles.bulletIconWrapper, { backgroundColor: '#F3E8FF' }]}>
              <Feather name="lock" size={20} color="#7E22CE" />
            </View>
            <Text style={styles.bulletText}>
              Tus compañeros y tus profesores no verán lo que respondas.
            </Text>
          </View>

          <View style={styles.bulletItem}>
            <View style={[styles.bulletIconWrapper, { backgroundColor: '#FFE4E6' }]}>
              <Feather name="heart" size={20} color="#E11D48" />
            </View>
            <Text style={styles.bulletText}>
              Si algo nos hace pensar que no estás seguro, un adulto de tu colegio te va a buscar para ayudarte.
            </Text>
          </View>

          <TouchableOpacity 
            style={styles.checkboxContainer} 
            onPress={() => setAgreed(!agreed)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
              {agreed && <Feather name="check" size={16} color="#fff" />}
            </View>
            <Text style={styles.checkboxText}>Entiendo y quiero participar</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flex: 1, minHeight: 40 }} />

        <TouchableOpacity 
          style={[styles.startButton, !agreed && styles.startButtonDisabled]} 
          onPress={handleStart}
          disabled={!agreed}
          activeOpacity={0.8}
        >
          <Text style={[styles.startButtonText, !agreed && styles.startButtonTextDisabled]}>
            Comenzar la primera estación
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={handleSkip}
          activeOpacity={0.8}
        >
          <Text style={styles.skipButtonText}>Ahora no</Text>
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 32,
    padding: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
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
    fontSize: 28,
    fontFamily: "Inter_800ExtraBold",
    color: "#111827",
    marginBottom: 24,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  bulletIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "#111827",
    lineHeight: 22,
    paddingTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxActive: {
    backgroundColor: '#111827',
    borderColor: '#111827',
  },
  checkboxText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#111827",
  },
  startButton: {
    backgroundColor: '#4338CA',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 16,
  },
  startButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  startButtonTextDisabled: {
    color: '#9CA3AF',
  },
  skipButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#4338CA',
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
