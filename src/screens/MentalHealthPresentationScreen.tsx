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
  navigation: NativeStackNavigationProp<RootStackParamList, 'MentalHealthPresentation'>;
};

export default function MentalHealthPresentationScreen({ navigation }: Props) {
  function handleStart() {
    navigation.navigate('MentalHealthTarget');
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>NOMI Learning Care</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.paragraph}>
            Esta experiencia permite conocer cómo NOMI Learning Care ayuda a una comunidad educativa a comprender y ordenar sus necesidades de salud mental.
          </Text>
          <Text style={styles.paragraph}>
            A través de una conversación breve, el sistema identifica señales asociadas al ánimo, la ansiedad y la sobrecarga, incorpora el contexto expresado por cada persona y traduce esa información en una de cuatro rutas de cuidado: promoción, prevención, intervención o riesgo.
          </Text>
          <Text style={styles.paragraph}>
            El resultado no constituye un diagnóstico. Su propósito es entregar una primera orientación, clara, masiva y accionable, para apoyar a estudiantes, familias, equipos profesionales y comunidades educativas.
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleStart} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Comenzar experiencia</Text>
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
