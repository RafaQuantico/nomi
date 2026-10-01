import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, SafeAreaView, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function HelpOverlay({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>Pedir ayuda</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.description}>
              Si te sientes mal, abrumado o necesitas hablar con alguien urgente, aquí tienes opciones de ayuda inmediata.
            </Text>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => Linking.openURL('tel:1515')} // Ejemplo de número
            >
              <View style={styles.iconCircle}>
                <Feather name="phone-call" size={20} color="#4F46E5" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Línea Libre</Text>
                <Text style={styles.actionSubtitle}>Habla con un psicólogo ahora</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, { marginTop: 12 }]}
              onPress={() => Linking.openURL('tel:133')}
            >
              <View style={styles.iconCircle}>
                <Feather name="alert-triangle" size={20} color="#E11D48" />
              </View>
              <View style={styles.actionTextContainer}>
                <Text style={styles.actionTitle}>Emergencias</Text>
                <Text style={styles.actionSubtitle}>Asistencia inmediata</Text>
              </View>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity style={styles.continueButton} onPress={onClose}>
              <Text style={styles.continueButtonText}>Seguir actividad</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  safeArea: {
    width: '100%',
    maxWidth: 400,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    minHeight: 400,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_800ExtraBold",
    color: "#1F2937",
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#4B5563",
    lineHeight: 24,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#1F2937",
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: "#6B7280",
  },
  continueButton: {
    backgroundColor: '#4338CA', // Indigo
    paddingVertical: 16,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 24,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
