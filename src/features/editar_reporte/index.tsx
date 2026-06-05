import React, { useEffect } from "react";
import { BackHandler, StyleSheet, View } from "react-native";

// === IMPORTAMOS TUS PASOS REALES DESDE TUS CARPETAS ===
import PasoImagenes from "./Screens/PasoImagenes";
import PasoInformacion from "./Screens/PasoInformacion";
import PasoUbicacion from "./Screens/PasoUbicación";

// === IMPORTAMOS TU STORE DE EDICIÓN ===
import { useEditarReporteStore } from "./store/editarReporteStore";

export default function EditarReporteFeature() {
  // Selectores atómicos de tu Zustand store
  const step = useEditarReporteStore((state) => state.step ?? 0);
  const setStep = useEditarReporteStore((state) => state.setStep);
  const reporteSeleccionado = useEditarReporteStore(
    (state) => state.reporteSeleccionado,
  );
  const limpiarReporteSeleccionado = useEditarReporteStore(
    (state) => state.limpiarReporteSeleccionado,
  );

  // Manejo del botón nativo de atrás en Android
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

  // Si no hay reporte seleccionado, no renderiza nada para evitar crashes
  if (!reporteSeleccionado) return null;

  // 🔀 Renderizado dinámico de tus pantallas reales sin logs dañinos en el JSX
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

  return <View style={styles.container}>{renderPasoActual()}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6347D1",
  },
});
