import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'EmailConfirmation'>;
};

export default function EmailConfirmationScreen({ navigation }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const buttonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // El botón de continuar aparece después de 2 segundos
    setTimeout(() => {
      Animated.timing(buttonOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 2000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[styles.content, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}
      >
        <View style={styles.iconCircle}>
          <Feather name="mail" size={40} color="#000" />
        </View>
        <Text style={styles.title}>¡Te enviamos un correo!</Text>
        <Text style={styles.body}>
          Revisa tu bandeja de entrada. Te hemos enviado las instrucciones para continuar el test de Fatiga.
        </Text>

        <View style={styles.separator} />

        <View style={styles.instructionRow}>
          <Text style={styles.instructionNumber}>1</Text>
          <Text style={styles.instructionText}>Abre el correo de NOMI en tu bandeja de entrada.</Text>
        </View>
        <View style={styles.instructionRow}>
          <Text style={styles.instructionNumber}>2</Text>
          <Text style={styles.instructionText}>Lee las instrucciones y el aviso de privacidad.</Text>
        </View>
        <View style={styles.instructionRow}>
          <Text style={styles.instructionNumber}>3</Text>
          <Text style={styles.instructionText}>Cuando estés listo, presiona el botón de abajo.</Text>
        </View>

        <Animated.View style={[styles.buttonWrapper, { opacity: buttonOpacity }]}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => navigation.navigate('TestSetup')}
            activeOpacity={0.85}
          >
            <Text style={styles.continueButtonText}>Ya leí el correo → Continuar</Text>
          </TouchableOpacity>
          <Text style={styles.footerNote}>
            Al presionar confirmas haber leído el aviso de privacidad.
          </Text>
        </Animated.View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingHorizontal: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    marginBottom: 14,
  },
  body: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
  },
  separator: {
    width: 40,
    height: 2,
    backgroundColor: '#000',
    marginVertical: 24,
    borderRadius: 1,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 14,
    width: '100%',
  },
  instructionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#000',
    color: '#fff',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 28,
    flexShrink: 0,
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
    paddingTop: 4,
  },
  buttonWrapper: {
    width: '100%',
    marginTop: 32,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#000',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  footerNote: {
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 16,
  },
});
