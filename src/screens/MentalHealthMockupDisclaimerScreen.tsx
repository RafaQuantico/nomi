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
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';
import { Feather } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MentalHealthMockupDisclaimer'>;
  route: RouteProp<RootStackParamList, 'MentalHealthMockupDisclaimer'>;
};

export default function MentalHealthMockupDisclaimerScreen({ navigation, route }: Props) {
  function handleContinue() {
    if (route.params.target === 'escolar') {
      navigation.navigate('MentalHealthEscolarIntro');
    } else {
      navigation.navigate('MentalHealthUniversitarioIntro');
    }
  }

  function handleBack() {
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Feather name="alert-triangle" size={48} color="#f59e0b" style={styles.icon} />
          <Text style={styles.title}>Aviso Importante</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.paragraph}>
            Esta es una maqueta demostrativa. Tus respuestas no serán usadas para tomar decisiones reales ni serán monitoreadas por un equipo profesional.
          </Text>
          <Text style={styles.paragraph}>
            En una implementación real, la institución debe definir previamente consentimiento informado, responsables, acceso a la información, protocolos de derivación y resguardo de datos.
          </Text>
        </View>

        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleContinue} activeOpacity={0.8}>
            <Text style={styles.continueButtonText}>Entiendo y quiero continuar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.8}>
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
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
    paddingTop: 40,
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff8e1',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#fde68a',
    marginBottom: 40,
  },
  paragraph: {
    fontSize: 16,
    color: '#78350f',
    lineHeight: 24,
    marginBottom: 16,
    fontWeight: '500',
  },
  buttonsContainer: {
    gap: 16,
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  backButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#eee',
  },
  backButtonText: {
    color: '#555',
    fontSize: 16,
    fontWeight: '700',
  },
});
