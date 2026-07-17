import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { Feather } from '@expo/vector-icons';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'MentalHealthSuccess'>;
};

export default function MentalHealthSuccessScreen({ navigation }: Props) {
  function handleClose() {
    navigation.reset({
      index: 0,
      routes: [{ name: 'ServiceSelection' }],
    });
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Feather name="check" size={48} color="#16a34a" />
        </View>
        <Text style={styles.title}>¡Gracias por tus respuestas!</Text>
        <Text style={styles.paragraph}>
          Tus datos han sido registrados exitosamente. Te hemos enviado un correo confirmando la recepción.
        </Text>
      </View>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleClose} activeOpacity={0.8}>
          <Text style={styles.buttonText}>Volver al Inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  paragraph: {
    fontSize: 16,
    color: '#555',
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 400,
  },
  footer: {
    padding: 24,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
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
