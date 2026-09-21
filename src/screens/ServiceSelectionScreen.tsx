import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthContext';
import { sendWelcomeEmail } from '../services/webhookService';
import { Platform } from 'react-native';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ServiceSelection'>;
};

type ServiceIcon = { lib: 'Feather' | 'MCI'; name: string };

const services: { id: string; title: string; iconLib: 'Feather' | 'MCI'; iconName: string; active: boolean }[] = [
  { id: 'fatigue',  title: 'Fatiga',       iconLib: 'Feather', iconName: 'zap',          active: true  },
  { id: 'mental',   title: 'Salud Mental', iconLib: 'Feather', iconName: 'heart',        active: false },
  { id: 'alcohol',  title: 'Alcohol',      iconLib: 'MCI',     iconName: 'glass-wine',    active: false },
  { id: 'drugs',    title: 'Drogas',       iconLib: 'MCI',     iconName: 'pill',          active: false },
];

function ServiceCardIcon({ lib, name, active }: { lib: 'Feather' | 'MCI'; name: string; active: boolean }) {
  const color = active ? '#fff' : '#ccc';
  if (lib === 'Feather') return <Feather name={name as any} size={44} color={color} />;
  return <MaterialCommunityIcons name={name as any} size={44} color={color} />;
}

export default function ServiceSelectionScreen({ navigation }: Props) {
  const { user, logout } = useAuth();

  async function handleServicePress(serviceId: string) {
    if (serviceId === 'fatigue') {
      navigation.navigate('FatigueMetadata');
    } else if (serviceId === 'mental') {
      navigation.navigate('MentalHealthPresentation');
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.nickname ?? 'usuario'}</Text>
            <Text style={styles.subtitle}>Selecciona el servicio</Text>
          </View>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Salir</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {services.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[
                styles.card,
                service.active ? styles.cardActive : styles.cardInactive,
              ]}
              onPress={service.active ? () => handleServicePress(service.id) : undefined}
              activeOpacity={service.active ? 0.7 : 1}
            >
              {service.active && (
                <LinearGradient colors={['#3B82F6', '#14B8A6']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={StyleSheet.absoluteFillObject} />
              )}
              <View style={[styles.cardIconWrapper, { zIndex: 1 }]}>
                <ServiceCardIcon lib={service.iconLib} name={service.iconName} active={service.active} />
              </View>
              <Text style={[styles.cardTitle, !service.active && styles.titleInactive, { zIndex: 1 }]}>
                {service.title}
              </Text>
              {!service.active && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Próximamente</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scroll: { 
    padding: 24, 
    paddingBottom: 40,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  greeting: { fontSize: 22, fontFamily: "Inter_900Black", color: "#1F2937" },
  subtitle: { fontSize: 14, color: "#4B5563", marginTop: 2 },
  logoutBtn: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  logoutText: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#374151" },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'center',
  },
  card: {
    width: '46%',
    minWidth: 150,
    maxWidth: 220,
    aspectRatio: 0.9,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  cardActive: {
    // bg handled by LinearGradient
  },
  cardInactive: {
    backgroundColor: '#f5f5f5',
    borderWidth: 2,
    borderColor: '#e8e8e8',
  },
  cardIconWrapper: {
    marginBottom: 12,
  },
  iconInactive: {
    opacity: 0.35,
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: "Inter_800ExtraBold",
    color: '#fff',
    textAlign: 'center',
  },
  titleInactive: {
    color: "#9CA3AF",
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  comingSoonText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#9CA3AF",
  },
});
