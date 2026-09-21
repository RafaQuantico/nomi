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
import { LinearGradient } from "expo-linear-gradient";
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
    { value: 7, label: "Completamente alerta, muy despierto y enérgico" },
    { value: 6, label: "Muy animado, receptivo, pero no al máximo" },
    { value: 5, label: "Bien, algo fresco" },
    { value: 4, label: "Un poco cansado, menos que fresco" },
    { value: 3, label: "Moderadamente cansado, decaído" },
    { value: 2, label: "Extremadamente cansado, muy difícil concentrarse" },
    { value: 1, label: "Completamente exhausto, sin capacidad de funcionar de manera efectiva" }
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
            {selected === "activo" ? (
              <LinearGradient colors={['#3B82F6', '#14B8A6']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={StyleSheet.absoluteFillObject} />
            ) : null}
            <View style={styles.iconWrapper}>
              <Feather name="sun" size={32} color={selected === "activo" ? "#fff" : "#374151"} />
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
            {selected === "cansado" ? (
              <LinearGradient colors={['#3B82F6', '#14B8A6']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={StyleSheet.absoluteFillObject} />
            ) : null}
            <View style={styles.iconWrapper}>
              <Feather name="moon" size={32} color={selected === "cansado" ? "#fff" : "#374151"} />
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
              style={[styles.scaleOption, samnPerelli === opt.value && styles.scaleOptionSelectedBorder]}
              onPress={() => setSamnPerelli(opt.value)}
              activeOpacity={0.8}
            >
              {samnPerelli === opt.value ? (
                <LinearGradient colors={['#3B82F6', '#14B8A6']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={StyleSheet.absoluteFillObject} />
              ) : null}
              <Text style={[styles.scaleNum, samnPerelli === opt.value && styles.scaleTextSelected]}>{opt.value}</Text>
              <Text style={[styles.scaleLabel, samnPerelli === opt.value && styles.scaleTextSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.startButtonContainer}
          onPress={() => {
            if (selected && samnPerelli) {
              navigation.navigate("TestSequence", { eventPhase: selected, samnPerelli });
            }
          }}
          disabled={!selected || !samnPerelli}
          activeOpacity={0.8}
        >
          {(!selected || !samnPerelli) ? (
            <View style={[styles.startButton, styles.startButtonDisabled]}>
              <Text style={styles.startButtonTextDisabled}>Continuar al Test</Text>
            </View>
          ) : (
            <LinearGradient colors={['#3B82F6', '#14B8A6']} start={{x: 0, y: 0}} end={{x: 1, y: 0}} style={styles.startButton}>
              <Text style={styles.startButtonText}>Continuar al Test  ></Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: {
    padding: 24,
    paddingBottom: 40,
    maxWidth: 600,
    width: "100%",
    alignSelf: "center",
  },
  title: {
    fontFamily: "Inter_800ExtraBold",
    fontSize: 26,
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: "#4B5563",
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
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    overflow: "hidden",
  },
  optionCardSelected: {
    // handled by LinearGradient background
  },
  iconWrapper: {
    marginBottom: 8,
    zIndex: 1,
  },
  optionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
    color: "#374151",
    textAlign: "center",
    zIndex: 1,
  },
  optionTitleSelected: { color: "#fff" },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    color: "#1F2937",
    marginBottom: 16,
  },
  scaleContainer: {
    gap: 8,
    marginBottom: 32,
  },
  scaleOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    overflow: "hidden",
  },
  scaleOptionSelectedBorder: {
    // bg handled by linear gradient
  },
  scaleNum: {
    fontFamily: "Inter_900Black",
    fontSize: 18,
    color: "#374151",
    width: 24,
    textAlign: "center",
    zIndex: 1,
  },
  scaleLabel: {
    flex: 1,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    color: "#4B5563",
    zIndex: 1,
  },
  scaleTextSelected: {
    color: "#fff"
  },
  startButtonContainer: {
    borderRadius: 14,
    overflow: "hidden",
  },
  startButton: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  startButtonDisabled: {
    backgroundColor: "#E5E7EB",
  },
  startButtonText: {
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
    fontSize: 16,
  },
  startButtonTextDisabled: {
    fontFamily: "Inter_600SemiBold",
    color: "#9CA3AF",
    fontSize: 16,
  },
});
