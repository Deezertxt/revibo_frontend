import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
// Importamos el feature real que tiene el Wizard de pasos
import EditarReporteFeature from "../../features/editar_reporte/ReportesIndexScreen";

export default function EditarReporteScreen() {
  useEffect(() => {
    console.log(
      "🚀 [Pantalla Edición] ¡El puente ha reaccionado! Entrando al formulario...",
    );
  }, []);

  return (
    <View style={styles.container}>
      <EditarReporteFeature />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6347D1",
  },
});
