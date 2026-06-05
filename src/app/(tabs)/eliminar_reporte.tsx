import React from "react";
import { StyleSheet, View } from "react-native";

import EliminarReporte from "../../features/resolver_reporte";

export default function EditarReporteScreen() {
  return (
    <View style={styles.container}>
      <EliminarReporte />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6347D1",
  },
});
