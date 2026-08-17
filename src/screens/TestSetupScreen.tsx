import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../App";
import { useAuth } from "../context/AuthContext";

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, "TestSetup">;
};

export default function TestSetupScreen({ navigation }: Props) {
  const { user } = useAuth();
  const [selected, setSelected] = useState<"activo" | "cansado" | null>(null);
  const [samnPerelli, setSamnPerelli] = useState<number | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkMetadata = async () => {
      try {
        const hasMetadata = await AsyncStorage.getItem(`@nomi_fatigue_metadata_${user?.uuid}`);
        if (!hasMetadata) {
          navigation.replace("FatigueMetadata");
        } else {
          setIsChecking(false);
        }
      } catch (e) {
        setIsChecking(false);
      }
    };
    if (user) checkMetadata();
  }, [user, navigation]);

  if (isChecking) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  const scaleOptions = [
    { value: 1, label: "Completamente alerta, muy despierto" },
    { value: 2, label: "Muy animado, receptivo, pero no al máximo" },
    { value: 3, label: "Bien, algo fresco" },
    { value: 4, label: "Un poco cansado, menos que fresco" },
    { value: 5, label: "Moderadamente cansado, decaído" },
    { value: 6, label: "Extremadamente cansado, muy difícil concentrarse" },
    { value: 7, label: "Completamente exhausto, incapaz de funcionar" }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>¿Cómo estás ahora?</Text>
        <Text style={styles.subtitle}>
          Selecciona tu estado actual y nivel de fatiga.
        </Text>

        <View style={styles.optionsRow}>
          <TouchableOpacity
            style={[styles.optionCard, selected === "activo" && styles.optionCardSelected]}
            onPress={() => setSelected("activo")}
            activeOpacity={0.85}
          >
            <View style={styles.iconWrapper}>
              <Feather name="sun" size={32} color={selected === "activo" ? "#fff" : "#000"} />
            </View>
            <Text style={[styles.optionTitle, selected === "activo" && styles.optionTitleSelected]}>
              Inicio de Jornada
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionCard, selected === "cansado" && styles.optionCardSelected]}
            onPress={() => setSelected("cansado")}
            activeOpacity={0.85}
          >
            <View style={styles.iconWrapper}>
              <Feather name="moon" size={32} color={selected === "cansado" ? "#fff" : "#000"} />
            </View>
            <Text style={[styles.optionTitle, selected === "cansado" && styles.optionTitleSelected]}>
              Fin de Jornada
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>¿Cómo te sientes ahora mismo?</Text>
        <View style={styles.scaleContainer}>
          {scaleOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.scaleOption, samnPerelli === opt.value && styles.scaleOptionSelected]}
              onPress={() => setSamnPerelli(opt.value)}
            >
              <Text style={[styles.scaleNum, samnPerelli === opt.value && styles.scaleTextSelected]}>{opt.value}</Text>
              <Text style={[styles.scaleLabel, samnPerelli === opt.value && styles.scaleTextSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.startButton, (!selected || !samnPerelli) && styles.startButtonDisabled]}
          onPress={() => {
            if (selected && samnPerelli) {
              navigation.navigate("TestSequence", { eventPhase: selected, samnPerelli });
            }
          }}
          disabled={!selected || !samnPerelli}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Continuar al Test</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    padding: 24,
    paddingBottom: 40
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "#000",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  optionsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 32,
    width: "100%",
  },
  optionCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#e0e0e0",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  optionCardSelected: {
    borderColor: "#000",
    backgroundColor: "#000",
  },
  iconWrapper: {
    marginBottom: 8,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#000",
    textAlign: "center"
  },
  optionTitleSelected: { color: "#fff" },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000",
    marginBottom: 16,
  },
  scaleContainer: {
    gap: 8,
    marginBottom: 32,
  },
  scaleOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  scaleOptionSelected: {
    backgroundColor: "#000",
    borderColor: "#000",
  },
  scaleNum: {
    fontSize: 18,
    fontWeight: "900",
    color: "#374151",
    width: 24,
    textAlign: "center"
  },
  scaleLabel: {
    flex: 1,
    fontSize: 14,
    color: "#4b5563",
    fontWeight: "500"
  },
  scaleTextSelected: {
    color: "#fff"
  },
  startButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  startButtonDisabled: {
    backgroundColor: "#d0d0d0",
  },
  startButtonText: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "800",
  },
});
