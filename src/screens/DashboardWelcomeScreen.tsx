import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DashboardWelcome'>;
type WelcomeRouteProp = RouteProp<RootStackParamList, 'DashboardWelcome'>;

export default function DashboardWelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<WelcomeRouteProp>();

  useEffect(() => {
    // Verificamos autorización
    const { auth, authenticated } = route.params || {};
    if (auth !== 'admin_token' && !authenticated) {
      // Si no hay token de enlace y no viene de la pantalla Auth, redirigimos
      navigation.replace('DashboardAuth');
    }
  }, [route.params, navigation]);

  const handleContinue = () => {
    navigation.navigate('DashboardInteractive');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image source={require('../../assets/Nomi_Negro.png')} style={styles.logoImage} resizeMode="contain" />
        <Text style={styles.title}>Bienvenido al Dashboard</Text>
        <Text style={styles.subtitle}>
          Esta es una lectura agregada y anonimizada de cómo se distribuyen las necesidades de cuidado dentro de la comunidad.
        </Text>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.button} onPress={handleContinue}>
          <Text style={styles.buttonText}>Revisar resultados</Text>
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
    padding: 32,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 150,
    height: 50,
    marginBottom: 24,
    marginTop: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    width: '100%',
    height: 56,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
});
