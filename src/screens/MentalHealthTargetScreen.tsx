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
  navigation: NativeStackNavigationProp<RootStackParamList, 'MentalHealthTarget'>;
};

export default function MentalHealthTargetScreen({ navigation }: Props) {
  function handleSelect(type: 'escolar' | 'universitario') {
    // Aquí más adelante se puede navegar a la siguiente pantalla
    // navigation.navigate('SiguientePantalla', { type });
    console.log('Seleccionado:', type);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#000" />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Salud Mental</Text>
          <Text style={styles.subtitle}>
            Para poder brindarte el mejor acompañamiento, necesitamos saber a qué grupo perteneces.
            Por favor selecciona una de las siguientes opciones:
          </Text>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => handleSelect('escolar')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Feather name="user" size={32} color="#000" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Estudiantes escolares</Text>
              <Text style={styles.optionSubtitle}>12 a 17 años</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => handleSelect('universitario')}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              <Feather name="users" size={32} color="#000" />
            </View>
            <View style={styles.optionTextContainer}>
              <Text style={styles.optionTitle}>Estudiantes universitarios</Text>
              <Text style={styles.optionSubtitle}>18 o más</Text>
            </View>
            <Feather name="chevron-right" size={24} color="#ccc" />
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
    marginBottom: 16,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
  },
  optionsContainer: {
    gap: 16,
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
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
});
