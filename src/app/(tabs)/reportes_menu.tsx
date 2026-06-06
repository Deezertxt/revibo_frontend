import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import MaterialIcons from "@expo/vector-icons/MaterialIcons";

const { width } = Dimensions.get("window");

const BUTTON_SIZE = (width - 48 - 24) / 3;

export default function AdminReportesScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.menuWrapper}>
        <View style={styles.headerContainer}>
          <Text style={styles.subtitle}>GESTIONA LOS REPORTES</Text>
          <Text style={styles.title}>PANEL DE CONTROL</Text>
        </View>

        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={styles.squareButton}
            onPress={() => router.push("/crear_reportes")}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons
                name="add-circle-outline"
                size={26}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.buttonText}>Crear{"\n"}Reporte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.squareButton}
            onPress={() => router.push("/editar_reporte")}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="edit" size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.buttonText}>Editar{"\n"}Reporte</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.squareButton}
            onPress={() => router.push("/eliminar_reporte")}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons
                name="check-circle-outline"
                size={26}
                color="#FFFFFF"
              />
            </View>
            <Text style={styles.buttonText}>Resolver{"\n"}Reporte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6347D1",
  },
  menuWrapper: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  headerContainer: {
    marginBottom: 28,
    alignItems: "center",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 4,
  },
  gridContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  squareButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    backgroundColor: "#5034B7",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 5.46,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  iconCircle: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
  },
});
