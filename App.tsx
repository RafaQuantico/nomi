import React, { useEffect } from 'react';
import { Linking, ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import IntroScreen from './src/screens/IntroScreen';
import AuthScreen from './src/screens/AuthScreen';
import ServiceSelectionScreen from './src/screens/ServiceSelectionScreen';
import EmailConfirmationScreen from './src/screens/EmailConfirmationScreen';
import TestSetupScreen from './src/screens/TestSetupScreen';
import TestSequenceScreen from './src/screens/TestSequenceScreen';
import MentalHealthPresentationScreen from './src/screens/MentalHealthPresentationScreen';
import MentalHealthTargetScreen from './src/screens/MentalHealthTargetScreen';
import MentalHealthMockupDisclaimerScreen from './src/screens/MentalHealthMockupDisclaimerScreen';
import MentalHealthEscolarIntroScreen from './src/screens/MentalHealthEscolarIntroScreen';
import MentalHealthUniversitarioIntroScreen from './src/screens/MentalHealthUniversitarioIntroScreen';
import MentalHealthQuestionScreen from './src/screens/MentalHealthQuestionScreen';
import MentalHealthFinalScreen from './src/screens/MentalHealthFinalScreen';
import MentalHealthSuccessScreen from './src/screens/MentalHealthSuccessScreen';

export type RootStackParamList = {
  Intro: undefined;
  Auth: undefined;
  ServiceSelection: undefined;
  EmailConfirmation: undefined;
  TestSetup: undefined;
  TestSequence: { eventPhase: 'activo' | 'cansado' };
  MentalHealthPresentation: undefined;
  MentalHealthTarget: undefined;
  MentalHealthMockupDisclaimer: { target: 'escolar' | 'universitario' };
  MentalHealthEscolarIntro: undefined;
  MentalHealthUniversitarioIntro: undefined;
  MentalHealthQuestion: { target: 'escolar' | 'universitario' };
  MentalHealthFinal: { target: 'escolar' | 'universitario'; answers: string[] };
  MentalHealthSuccess: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Configuración de deep linking: nomi-app://test abre TestSetup
const linking = {
  prefixes: ['nomi-app://'],
  config: {
    screens: {
      TestSetup: 'test',
    },
  },
};

function AppNavigator() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={user ? 'ServiceSelection' : 'Intro'}
    >
      <Stack.Screen name="Intro" component={IntroScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="ServiceSelection" component={ServiceSelectionScreen} />
      <Stack.Screen name="EmailConfirmation" component={EmailConfirmationScreen} />
      <Stack.Screen name="TestSetup" component={TestSetupScreen} />
      <Stack.Screen name="TestSequence" component={TestSequenceScreen} />
      <Stack.Screen name="MentalHealthPresentation" component={MentalHealthPresentationScreen} />
      <Stack.Screen name="MentalHealthTarget" component={MentalHealthTargetScreen} />
      <Stack.Screen name="MentalHealthMockupDisclaimer" component={MentalHealthMockupDisclaimerScreen} />
      <Stack.Screen name="MentalHealthEscolarIntro" component={MentalHealthEscolarIntroScreen} />
      <Stack.Screen name="MentalHealthUniversitarioIntro" component={MentalHealthUniversitarioIntroScreen} />
      <Stack.Screen name="MentalHealthQuestion" component={MentalHealthQuestionScreen} />
      <Stack.Screen name="MentalHealthFinal" component={MentalHealthFinalScreen} />
      <Stack.Screen name="MentalHealthSuccess" component={MentalHealthSuccessScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer linking={linking}>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
