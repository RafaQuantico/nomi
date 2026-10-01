import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Feather } from '@expo/vector-icons';
import HelpButton from '../components/HelpButton';
import HelpOverlay from '../components/HelpOverlay';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'LearningCareAuth'>;
};

export default function LearningCareAuthScreen({ navigation }: Props) {
  const [schoolCode, setSchoolCode] = useState('');
  const [studentId, setStudentId] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  function handleLogin() {
    if (schoolCode.trim() && studentId.trim()) {
      navigation.navigate('LearningCareWelcome', { schoolCode, studentId });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          
          <View style={styles.topRow}>
            <View style={{ flex: 1 }} />
            <HelpButton onPress={() => setShowHelp(true)} />
          </View>

          <View style={styles.brandContainer}>
            <Text style={styles.brandTitle}>N O M I</Text>
            <Text style={styles.brandSubtitle}>E D U  C A R E</Text>
            
            {/* Faces Image Mockup */}
            <View style={styles.facesMockup}>
              <View style={styles.faceCircle1}>
                <Feather name="meh" size={24} color="#4338CA" />
              </View>
              <View style={styles.faceCircle2}>
                <Feather name="smile" size={24} color="#4338CA" />
              </View>
              <View style={styles.faceCircle3}>
                <Feather name="frown" size={24} color="#4338CA" />
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hola, qué bueno que estés aquí</Text>
            <Text style={styles.cardSubtitle}>
              Ingresa con los datos que te entregó tu colegio.
            </Text>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>CÓDIGO DEL COLEGIO</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: COL-4821"
                placeholderTextColor="#9CA3AF"
                value={schoolCode}
                onChangeText={setSchoolCode}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>TU USUARIO</Text>
              <TextInput
                style={styles.input}
                placeholder="Código de estudiante"
                placeholderTextColor="#9CA3AF"
                value={studentId}
                onChangeText={setStudentId}
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity 
              style={[styles.submitButton, (!schoolCode || !studentId) && styles.submitButtonDisabled]} 
              onPress={handleLogin}
              disabled={!schoolCode || !studentId}
              activeOpacity={0.8}
            >
              <Text style={styles.submitButtonText}>Ingresar</Text>
              <Feather name="arrow-right" size={20} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.footerText}>
              ¿No tienes tu código? Pídelo a tu profesor jefe.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <HelpOverlay visible={showHelp} onClose={() => setShowHelp(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6', // Light grayish-blue
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
    marginBottom: 40,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandTitle: {
    fontSize: 40,
    fontFamily: "Inter_900Black",
    color: "#111827",
    letterSpacing: 4,
  },
  brandSubtitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#374151",
    letterSpacing: 6,
    marginTop: 4,
    marginBottom: 32,
  },
  facesMockup: {
    height: 120,
    width: 140,
    position: 'relative',
  },
  faceCircle1: {
    position: 'absolute', top: 40, left: 0,
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#C7D2FE',
    justifyContent: 'center', alignItems: 'center',
  },
  faceCircle2: {
    position: 'absolute', top: 0, right: 20,
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#DDD6FE',
    justifyContent: 'center', alignItems: 'center',
  },
  faceCircle3: {
    position: 'absolute', bottom: 0, right: 10,
    width: 64, height: 64, borderRadius: 32, backgroundColor: '#A78BFA',
    justifyContent: 'center', alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 26,
    fontFamily: "Inter_800ExtraBold",
    color: "#111827",
    lineHeight: 34,
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: "#4338CA",
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#1F2937",
  },
  submitButton: {
    backgroundColor: '#4338CA',
    flexDirection: 'row',
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginRight: 8,
  },
  footerText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#6B7280",
    textAlign: 'center',
  },
});
