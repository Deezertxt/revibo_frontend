import { StyleSheet, View } from "react-native";

import CrearReporteFeature from "../../features/crear_reportes";

export default function CrearReporteScreen() {
  return (
    <View style={styles.container}>
      <CrearReporteFeature />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6347D1",
  },
});
