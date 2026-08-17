import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../App";
import { useAuth } from "../context/AuthContext";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "FatigueMetadata">;
};

export default function FatigueMetadataScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [sex, setSex] = useState<"Hombre" | "Mujer" | null>(null);
  const [age, setAge] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContinue = async () => {
    if (!sex || !age || !weight || !height) {
      Alert.alert("Campos incompletos", "Por favor completa todos los campos para continuar.");
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 20 || ageNum > 65) {
      Alert.alert("Edad inválida", "La edad debe estar entre 20 y 65 años.");
      return;
    }

    setIsSubmitting(true);
    try {
      // API call to save metadata

      const response = await fetch("https://script.google.com/macros/s/AKfycbzuckGDrAO4FXJvhTS08XbYDQyGmiVS-masTb7Ov3lHu8sDZpOV8_vpudET0b7NXkZe/exec", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          action: "save_fatigue_metadata",
          uuid: user?.uuid,
          nickname: user?.nickname,
          sex,
          age: ageNum,
          weight: parseFloat(weight),
          height: parseFloat(height)
        })
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || (result && result.ok === false)) {
        throw new Error((result && result.error) ? result.error : "Failed to save metadata");
      }

      await AsyncStorage.setItem(`@nomi_fatigue_metadata_${user?.uuid}`, "true");
      navigation.replace("TestSetup");

    } catch (error) {
      console.error(error);
      Alert.alert("Error", error instanceof Error ? error.message : "Hubo un problema guardando tus datos. Intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Completa tu perfil</Text>
          <Text style={styles.subtitle}>
            Antes de comenzar, necesitamos algunos datos básicos. Esta información solo se solicitará una vez y es confidencial.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sexo biológico</Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[styles.selectBtn, sex === "Hombre" && styles.selectBtnActive]}
                onPress={() => setSex("Hombre")}
              >
                <Text style={[styles.selectBtnText, sex === "Hombre" && styles.selectBtnTextActive]}>Hombre</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.selectBtn, sex === "Mujer" && styles.selectBtnActive]}
                onPress={() => setSex("Mujer")}
              >
                <Text style={[styles.selectBtnText, sex === "Mujer" && styles.selectBtnTextActive]}>Mujer</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Edad (20-65 años)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 35"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={age}
              onChangeText={setAge}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 70"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Estatura (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 175"
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
          </View>

          <TouchableOpacity 
            style={styles.button} 
            onPress={handleContinue}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continuar</Text>
                <Feather name="arrow-right" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 32, flexGrow: 1, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "900", color: "#000", marginBottom: 12 },
  subtitle: { fontSize: 16, color: "#6b7280", lineHeight: 24, marginBottom: 40 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#000",
  },
  row: { flexDirection: "row", gap: 12 },
  selectBtn: {
    flex: 1,
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  selectBtnActive: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  selectBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },
  selectBtnTextActive: {
    color: "#fff",
  },
  button: {
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    gap: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
