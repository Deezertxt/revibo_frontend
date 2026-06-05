import { Ionicons } from "@expo/vector-icons";
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

import PasoImagenes from "./Screens/PasoImagenes";
import PasoInformacion from "./Screens/PasoInformacion";
import PasoUbicacion from "./Screens/PasoUbicación";

import { useEditarReporteStore } from "./store/editarReporteStore";

export default function EditarReporteFeature() {
  const step = useEditarReporteStore((state) => state.step ?? 0);
  const setStep = useEditarReporteStore((state) => state.setStep);
  const reporteSeleccionado = useEditarReporteStore(
    (state) => state.reporteSeleccionado,
  );
  const limpiarReporteSeleccionado = useEditarReporteStore(
    (state) => state.limpiarReporteSeleccionado,
  );

  const titles = ["Información", "Ubicación", "Resumen"];

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      limpiarReporteSeleccionado();
    }
  };

  useEffect(() => {
    const backAction = () => {
      if (step > 0) {
        setStep(step - 1);
      } else {
        limpiarReporteSeleccionado();
      }
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );
    return () => backHandler.remove();
  }, [step]);

  if (!reporteSeleccionado) return null;

  const renderPasoActual = () => {
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
          {step > 0 && (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Editar reporte</Text>
        </View>

        <Text
          style={[styles.headerSubtitle, { marginLeft: step > 0 ? 36 : 0 }]}
        >
          {titles[step]}
        </Text>

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

      <View style={styles.content}>{renderPasoActual()}</View>
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
