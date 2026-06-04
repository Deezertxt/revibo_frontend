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
        {/* Encabezado del Panel */}
        <View style={styles.headerContainer}>
          <Text style={styles.subtitle}>PANEL DE CONTROL</Text>
          <Text style={styles.title}>¿Qué deseas hacer hoy?</Text>
        </View>

        {/* Contenedor de la Fila de Botones */}
        <View style={styles.gridContainer}>
          {/* 1. BOTÓN: CREAR REPORTE */}
          <TouchableOpacity
            style={styles.squareButton}
            onPress={() => router.push("/(tabs)/crear_reportes")}
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

          {/* 2. BOTÓN: EDITAR REPORTE 
          <TouchableOpacity 
            style={styles.squareButton} 
            onPress={() => router.push("/(tabs)/editar_reporte")}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="edit" size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.buttonText}>Editar{"\n"}Reporte</Text>
          </TouchableOpacity>*/}

          {/* 3. BOTÓN: ELIMINAR REPORTE 
          <TouchableOpacity 
            style={styles.squareButton} 
            onPress={() => router.push("/(tabs)/eliminar_reporte")}
            activeOpacity={0.8}
          >
            <View style={styles.iconCircle}>
              <MaterialIcons name="delete-outline" size={26} color="#FFFFFF" />
            </View>
            <Text style={styles.buttonText}>Eliminar{"\n"}Reporte</Text>
          </TouchableOpacity>*/}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6347D1", // Tu color morado base de la interfaz
  },
  menuWrapper: {
    flex: 1,
    justifyContent: "center", // Centra todo el bloque en medio de la pantalla
    paddingHorizontal: 24,
  },
  headerContainer: {
    marginBottom: 28,
    alignItems: "center",
  },
  subtitle: {
    color: "#B4A3F5", // Morado claro sutil para el tag superior
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
    height: BUTTON_SIZE, // Forzamos a que el alto sea igual al ancho calculado
    backgroundColor: "#5034B7", // Tono más oscuro para dar contraste premium sobre el fondo
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    // Sombras para Android
    elevation: 6,
    // Sombras para iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 5.46,
    // Efecto de borde fino semi-transparente
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  iconCircle: {
    backgroundColor: "rgba(255, 255, 255, 0.15)", // Fondo translúcido para el icono
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
