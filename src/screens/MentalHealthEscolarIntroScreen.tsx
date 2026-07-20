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

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MentalHealthEscolarIntro'>;
};

export default function MentalHealthEscolarIntroScreen({ navigation }: Props) {
  function handleStart() {
    navigation.navigate('MentalHealthData', { target: 'escolar' });
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Instrucciones</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.paragraph}>
            Hola. Esta es una experiencia breve para conocer cómo te has sentido durante las últimas dos semanas. Te haré seis preguntas.
          </Text>
          <Text style={styles.paragraph}>
            En cada una, responde con qué frecuencia te pasó lo que describo. Puedes responder:
          </Text>
          <View style={styles.optionsList}>
            <Text style={styles.bulletItem}>• "Nunca."</Text>
            <Text style={styles.bulletItem}>• "Algunos días."</Text>
            <Text style={styles.bulletItem}>• "Más de la mitad de los días."</Text>
            <Text style={styles.bulletItem}>• "Casi todos los días."</Text>
          </View>
          <Text style={styles.paragraph}>
            No hay respuestas correctas o incorrectas.
          </Text>
          <Text style={styles.paragraph}>
            Al final, si quieres, podrás contar con tus propias palabras qué situación ha influido en cómo te has sentido.
          </Text>
          
          <View style={styles.warningBox}>
            <Feather name="info" size={20} color="#78350f" style={styles.warningIcon} />
            <Text style={styles.warningText}>
              Esta experiencia es orientativa. No entrega un diagnóstico ni reemplaza una conversación con un profesional.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleStart} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Comenzar</Text>
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
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginBottom: 8,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
  },
  card: {
    backgroundColor: '#f8f8f8',
    padding: 24,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#eee',
    marginBottom: 32,
  },
  paragraph: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  optionsList: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  bulletItem: {
    fontSize: 16,
    color: '#000',
    fontWeight: '700',
    lineHeight: 28,
  },
  warningBox: {
    flexDirection: 'row',
    backgroundColor: '#fff8e1',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
    marginTop: 8,
  },
  warningIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#78350f',
    lineHeight: 20,
    fontWeight: '500',
  },
  button: {
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
});
