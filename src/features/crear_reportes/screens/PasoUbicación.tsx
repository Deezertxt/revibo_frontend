import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useCrearReporteStore } from "../store/crearReporteStore";

const { width } = Dimensions.get("window");

export default function PasoUbicacion() {
  const { updateData, setStep } = useCrearReporteStore();

  // Estados para los puntos del tramo
  const [puntoA, setPuntoA] = useState({
    latitude: -17.3935,
    longitude: -66.1568,
  });
  const [puntoB, setPuntoB] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [esTramo, setEsTramo] = useState(false);

  // Al mover el mapa, actualizamos el punto que esté activo
  const handleRegionChange = (newRegion: any) => {
    if (!esTramo) {
      setPuntoA({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      });
      // Guardamos como Punto por defecto
      updateData({
        geom: {
          type: "Point",
          coordinates: [newRegion.longitude, newRegion.latitude],
        },
      });
    } else {
      setPuntoB({
        latitude: newRegion.latitude,
        longitude: newRegion.longitude,
      });
      // Si ya hay Punto B, guardamos como LineString
      if (puntoA) {
        updateData({
          geom: {
            type: "LineString",
            coordinates: [
              [puntoA.longitude, puntoA.latitude],
              [newRegion.longitude, newRegion.latitude],
            ],
          },
        });
      }
    }
  };

  return (
    <ScrollView
      style={styles.mainContainer}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <Text style={styles.sectionTitle}>Ubicación del incidente</Text>

      {/* CONTENEDOR DEL MAPA */}
      <View style={styles.mapWrapper}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={{
            latitude: puntoA.latitude,
            longitude: puntoA.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          onRegionChangeComplete={handleRegionChange}
        >
          {/* Marcador Punto A */}
          <Marker coordinate={puntoA}>
            <Ionicons name="location" size={35} color="#6347D1" />
          </Marker>

          {/* Marcador Punto B (si existe) */}
          {puntoB && (
            <Marker coordinate={puntoB}>
              <Ionicons name="flag" size={35} color="#FF4763" />
            </Marker>
          )}

          {/* Línea que une ambos puntos */}
          {puntoA && puntoB && (
            <Polyline
              coordinates={[puntoA, puntoB]}
              strokeColor="#6347D1"
              strokeWidth={3}
            />
          )}
        </MapView>
      </View>

      {/* BOTONES DE ACCIÓN RÁPIDA */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.modeBtn, !esTramo && styles.modeBtnActive]}
          onPress={() => {
            setEsTramo(false);
            setPuntoB(null);
          }}
        >
          <Text
            style={[styles.modeBtnText, !esTramo && styles.modeBtnTextActive]}
          >
            Punto Fijo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, esTramo && styles.modeBtnActive]}
          onPress={() => setEsTramo(true)}
        >
          <Text
            style={[styles.modeBtnText, esTramo && styles.modeBtnTextActive]}
          >
            Trazar Tramo
          </Text>
        </TouchableOpacity>
      </View>

      {/* RESUMEN DE COORDENADAS (Abajo del mapa) */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Ionicons name="pin" size={18} color="#6347D1" />
          <Text style={styles.summaryLabel}>Inicio (A):</Text>
          <Text style={styles.summaryValue}>
            {puntoA.latitude.toFixed(5)}, {puntoA.longitude.toFixed(5)}
          </Text>
        </View>

        {esTramo && (
          <View style={styles.summaryRow}>
            <Ionicons name="flag" size={18} color="#FF4763" />
            <Text style={styles.summaryLabel}>Fin (B):</Text>
            <Text style={styles.summaryValue}>
              {puntoB
                ? `${puntoB.latitude.toFixed(5)}, ${puntoB.longitude.toFixed(5)}`
                : "Mueve el mapa..."}
            </Text>
          </View>
        )}
      </View>

      {/* BOTÓN CONTINUAR */}
      <TouchableOpacity onPress={() => setStep(2)} style={styles.btnContinuar}>
        <Text style={styles.btnText}>Confirmar y Continuar</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: "#FFF",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  mapWrapper: {
    width: "100%",
    height: 250, // Altura reducida
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#EEE",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  map: {
    flex: 1,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  modeBtn: {
    flex: 0.48,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F0F0F0",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  modeBtnActive: {
    backgroundColor: "#6347D1",
    borderColor: "#6347D1",
  },
  modeBtnText: {
    color: "#666",
    fontWeight: "600",
  },
  modeBtnTextActive: {
    color: "#FFF",
  },
  summaryCard: {
    backgroundColor: "#F8F9FD",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 13,
    color: "#333",
    fontFamily: "monospace",
  },
  btnContinuar: {
    backgroundColor: "#6347D1",
    flexDirection: "row",
    padding: 18,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
});
