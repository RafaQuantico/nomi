import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'TestSetup'>;
};

export default function TestSetupScreen({ navigation }: Props) {
  const [selected, setSelected] = useState<'activo' | 'cansado' | null>(null);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>¿Cómo estás ahora?</Text>
        <Text style={styles.subtitle}>
          Selecciona tu estado actual antes de comenzar el test de voz.
        </Text>

        <View style={styles.optionsRow}>
          {/* Activo - Inicio de jornada */}
          <TouchableOpacity
            style={[styles.optionCard, selected === 'activo' && styles.optionCardSelected]}
            onPress={() => setSelected('activo')}
            activeOpacity={0.85}
          >
            <View style={styles.iconWrapper}>
              <Feather
                name="sun"
                size={52}
                color={selected === 'activo' ? '#fff' : '#000'}
                strokeWidth={1.2}
              />
            </View>
            <Text style={[styles.optionTitle, selected === 'activo' && styles.optionTitleSelected]}>
              Activo
            </Text>
            <Text style={[styles.optionDesc, selected === 'activo' && styles.optionDescSelected]}>
              Inicio de jornada, con energía
            </Text>
          </TouchableOpacity>

          {/* Cansado - Fin de jornada */}
          <TouchableOpacity
            style={[styles.optionCard, selected === 'cansado' && styles.optionCardSelected]}
            onPress={() => setSelected('cansado')}
            activeOpacity={0.85}
          >
            <View style={styles.iconWrapper}>
              <Feather
                name="moon"
                size={52}
                color={selected === 'cansado' ? '#fff' : '#000'}
                strokeWidth={1.2}
              />
            </View>
            <Text style={[styles.optionTitle, selected === 'cansado' && styles.optionTitleSelected]}>
              Cansado
            </Text>
            <Text style={[styles.optionDesc, selected === 'cansado' && styles.optionDescSelected]}>
              Fin de jornada, con menos energía
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.startButton, !selected && styles.startButtonDisabled]}
          onPress={() => selected && navigation.navigate('TestSequence', { eventPhase: selected })}
          disabled={!selected}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Tomar test</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: {
    flex: 1,
    padding: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 36,
    paddingHorizontal: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 36,
    width: '100%',
  },
  optionCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 12,
    alignItems: 'center',
    backgroundColor: '#fafafa',
  },
  optionCardSelected: {
    borderColor: '#000',
    backgroundColor: '#000',
  },
  iconWrapper: {
    marginBottom: 14,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#000',
    marginBottom: 4,
  },
  optionTitleSelected: { color: '#fff' },
  optionDesc: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    lineHeight: 15,
  },
  optionDescSelected: { color: '#aaa' },
  startButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 14,
    width: '100%',
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#d0d0d0',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
});
