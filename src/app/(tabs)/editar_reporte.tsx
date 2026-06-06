import React from "react";
import { StyleSheet, View } from "react-native";

import EditarReporteFeature from "../../features/editar_reporte/ReportesIndexScreen";

export default function EditarReporteScreen() {
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
