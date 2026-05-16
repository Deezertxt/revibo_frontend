import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Importamos el servicio y los stores
import { getAccessToken } from "../../../shared/store/authStore";
import { crearReporte } from "../services/reporteService";
import { useCrearReporteStore } from "../store/crearReporteStore";

export default function PasoImagenes() {
  const store = useCrearReporteStore();
  const [loading, setLoading] = useState(false);

  const publicar = async () => {
    const token = getAccessToken();

    if (!token) {
      Alert.alert(
        "Error de sesión",
        "No se encontró un token válido. Por favor, vuelve a iniciar sesión.",
      );
      return;
    }

    if (!store.geom || !store.geom.coordinates) {
      Alert.alert(
        "Falta ubicación",
        "Debes marcar un punto o tramo en el mapa antes de publicar.",
      );
      return;
    }

    setLoading(true);

    const body = {
      titulo: store.titulo,
      descripcion: store.descripcion,
      tipo_reporte: store.tipo_reporte || "",
      gravedad_reporte: store.gravedad_reporte || "",
      geom: store.geom,
      url_imagen: [],
    };

    try {
      const res = await crearReporte(body, token);

      Alert.alert("¡Éxito!", res.message || "Reporte creado correctamente", [
        {
          text: "Volver al inicio",
          onPress: () => store.reset(),
        },
      ]);
    } catch (e: any) {
      let errorMsg = e.message || "No se pudo crear el reporte";

      if (errorMsg.includes("geom field is required")) {
        errorMsg =
          "La ubicación es obligatoria. Regresa al mapa y selecciona el lugar.";
      }

      Alert.alert("Error al publicar", errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const renderDetalleUbicacion = () => {
    if (!store.geom || !store.geom.coordinates) {
      return <Text style={styles.summaryValue}> No seleccionada</Text>;
    }

    const esPunto = store.geom.type === "Point";
    const coords = store.geom.coordinates;

    return (
      <View style={styles.ubicacionDetalleContainer}>
        <View style={styles.tipoUbicacionRow}>
          <Ionicons
            name={esPunto ? "pin" : "git-commit"}
            size={16}
            color={esPunto ? "#6347D1" : "#FF4763"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tipoUbicacionText,
              { color: esPunto ? "#6347D1" : "#FF4763" },
            ]}
          >
            {esPunto ? "Punto Fijo" : "Tramo Vial"}
          </Text>
        </View>

        <Text style={styles.direccionTextoDisplay} numberOfLines={2}>
          {store.direccionTexto ||
            (esPunto
              ? `Lat: ${coords[1]?.toFixed(5)}, Lng: ${coords[0]?.toFixed(5)}`
              : `Desde: ${coords[0][1]?.toFixed(4)}, ${coords[0][0]?.toFixed(4)}\nHasta: ${coords[1][1]?.toFixed(4)}, ${coords[1][0]?.toFixed(4)}`)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Sección de Imágenes */}
        <Text style={styles.sectionTitle}>
          Fotos del incidente (opcional, máx. 5)
        </Text>
        <View style={styles.imageGrid}>
          <TouchableOpacity
            style={styles.addCard}
            onPress={() =>
              Alert.alert(
                "Próximamente",
                "La carga de imágenes se habilitará pronto.",
              )
            }
          >
            <Ionicons name="add" size={30} color="#999" />
            <Text style={styles.addText}>Agregar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.imageCount}>0 de 5 imágenes cargadas.</Text>

        {/* Sección Resumen */}
        <Text style={styles.sectionTitle}>Resumen del reporte</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Título</Text>
            <Text style={styles.summaryValue} numberOfLines={2}>
              {store.titulo || "Sin título"}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tipo</Text>
            <View style={styles.badgeTipo}>
              <Text style={styles.badgeTextTipo}>
                {store.tipo_reporte || "-"}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gravedad</Text>
            <View
              style={[
                styles.badgeGravedad,
                {
                  backgroundColor: store.gravedad_reporte
                    ? "#FFEBEE"
                    : "#F0F0F0",
                },
              ]}
            >
              <Text style={[styles.badgeTextGravedad, { color: "#FF4763" }]}>
                {store.gravedad_reporte || "-"}
              </Text>
            </View>
          </View>

          {/* Fila de Ubicación Optimizada */}
          <View
            style={[
              styles.summaryRow,
              { alignItems: "flex-start", borderBottomWidth: 0 },
            ]}
          >
            <Text style={[styles.summaryLabel, { marginTop: 4 }]}>
              Ubicación
            </Text>
            {renderDetalleUbicacion()}
          </View>
        </View>
      </ScrollView>

      {/* Botón Publicar */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={publicar}
          style={[
            styles.publishBtn,
            (loading || !store.geom) && { opacity: 0.6 },
          ]}
          disabled={loading || !store.geom}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="white"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.publishText}>Publicar reporte</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 10,
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#444",
    marginBottom: 15,
    marginTop: 10,
  },
  imageGrid: {
    flexDirection: "row",
    marginBottom: 10,
  },
  addCard: {
    width: 100,
    height: 100,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#EEE",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  addText: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
  imageCount: {
    fontSize: 12,
    color: "#AAA",
    marginBottom: 20,
  },
  summaryCard: {
    backgroundColor: "#F8F9FD",
    borderRadius: 20,
    padding: 15,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#888",
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    flex: 2,
    textAlign: "right",
  },
  badgeTipo: {
    backgroundColor: "#EEF0FF",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeTextTipo: {
    color: "#6347D1",
    fontSize: 12,
    fontWeight: "700",
  },
  badgeGravedad: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeTextGravedad: {
    fontSize: 12,
    fontWeight: "700",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#F5F5F5",
  },
  publishBtn: {
    backgroundColor: "#FF4763",
    flexDirection: "row",
    padding: 18,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#FF4763",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  publishText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  /* NUEVOS ESTILOS PARA LA DETECCION VISUAL DE UBICACION */
  ubicacionDetalleContainer: {
    flex: 2,
    alignItems: "flex-end",
  },
  tipoUbicacionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  tipoUbicacionText: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  direccionTextoDisplay: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    textAlign: "right",
  },
});
