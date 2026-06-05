import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  BackHandler,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCrearReporteStore } from "./store/crearReporteStore";

import PasoImagenes from "./screens/PasoImegenes";
import PasoInformacion from "./screens/PasoInformacion";
import PasoUbicacion from "./screens/PasoUbicación";

export default function CrearReporteFeature() {
  const router = useRouter();
  const step = useCrearReporteStore((state) => state.step);
  const setStep = useCrearReporteStore((state) => state.setStep);

  const limpiarStore = useCrearReporteStore((state) => state.limpiarStore);

  const titles = ["Información", "Ubicación", "Resumen"];

  const salirAlMenu = () => {
    limpiarStore();
    router.push("/(tabs)/reportes_menu");
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      salirAlMenu();
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (step > 0) {
        setStep(step - 1);
        return true;
      } else {
        salirAlMenu();
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, [step]);

  const renderContent = () => {
    switch (step) {
      case 0:
        return <PasoInformacion />;
      case 1:
        return <PasoUbicacion />;
      case 2:
        return <PasoImagenes />;
      default:
        return <PasoInformacion />;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#6347D1" />

      <View style={styles.header}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear reporte</Text>
        </View>

        <Text style={styles.headerSubtitle}>{titles[step]}</Text>

        <View style={styles.progressContainer}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.progressBar,
                i <= step ? styles.progressActive : styles.progressInactive,
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.content}>{renderContent()}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6347D1",
  },
  header: {
    paddingHorizontal: 25,
    paddingVertical: 20,
    backgroundColor: "#6347D1",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    marginTop: 5,
    marginLeft: 36,
  },
  progressContainer: {
    flexDirection: "row",
    marginTop: 20,
    height: 6,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  progressActive: {
    backgroundColor: "white",
  },
  progressInactive: {
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  content: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: "hidden",
  },
});
