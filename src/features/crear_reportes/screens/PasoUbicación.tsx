import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

  const mapRef = useRef<MapView | null>(null);

  const [puntoA, setPuntoA] = useState({
    latitude: -17.3935,
    longitude: -66.1568,
  });
  const [puntoB, setPuntoB] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [esTramo, setEsTramo] = useState(false);

  const [direccionA, setDireccionA] = useState("Cargando dirección...");
  const [direccionB, setDireccionB] = useState("");
  const [loadingDireccion, setLoadingDireccion] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(true);

  const debounceTimer = useRef<any>(null);

  // EFECTO INICIAL: Obtiene el GPS guarda la ubicación por defecto de inmediato
  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permiso denegado",
            "Necesitamos acceso a tu ubicación para centrar el mapa automáticamente.",
          );
          setLoadingGPS(false);
          return;
        }

        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const latInicial = location.coords.latitude;
        const lngInicial = location.coords.longitude;

        const nuevaRegion = {
          latitude: latInicial,
          longitude: lngInicial,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        };

        // 1. Actualizamos el estado visual local
        setPuntoA({ latitude: latInicial, longitude: lngInicial });
        mapRef.current?.animateToRegion(nuevaRegion, 1000);

        // 2. CRÍTICO: Guardamos la ubicación del celular en el Store desde ya
        updateData({
          geom: {
            type: "Point",
            coordinates: [lngInicial, latInicial], // Longitud primero para GeoJSON
          },
        });

        // 3. Obtenemos el nombre de la calle y lo guardamos también en el Store
        obtenerDireccionTexto(latInicial, lngInicial, false);
      } catch (error) {
        Alert.alert("Error de GPS", "No se pudo obtener la ubicación actual.");
      } finally {
        setLoadingGPS(false);
      }
    })();
  }, []);

  // Conversión de coordenadas a calle (Nominatim)
  const obtenerDireccionTexto = async (
    lat: number,
    lng: number,
    esPuntoB: boolean,
  ) => {
    setLoadingDireccion(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers: { "User-Agent": "ReviboApp/1.0" } },
      );
      const data = await response.json();
      const calle =
        data.address.road ||
        data.address.suburb ||
        data.display_name.split(",")[0] ||
        "Calle desconocida";

      if (!esPuntoB) {
        setDireccionA(calle);
        // Guardamos la dirección del Punto A en el store de Zustand
        updateData({ direccionTexto: calle });
      } else {
        setDireccionB(calle);
        // Si es un tramo, guardamos el intervalo "Desde calle A hasta calle B"
        updateData({ direccionTexto: `${direccionA} hasta ${calle}` });
      }
    } catch (error) {
      const fallbackError = "Dirección desconocida";
      if (!esPuntoB) {
        setDireccionA(fallbackError);
        updateData({ direccionTexto: fallbackError });
      } else {
        setDireccionB(fallbackError);
        updateData({ direccionTexto: `${direccionA} hasta ${fallbackError}` });
      }
    } finally {
      setLoadingDireccion(false);
    }
  };

  // Maneja el guardado en Zustand cuando el usuario interactúa manualmente
  const procesarCambioUbicacion = (
    lat: number,
    lng: number,
    esFin: boolean,
  ) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (!esFin) {
      setPuntoA({ latitude: lat, longitude: lng });

      if (esTramo && puntoB) {
        updateData({
          geom: {
            type: "LineString",
            coordinates: [
              [lng, lat],
              [puntoB.longitude, puntoB.latitude],
            ],
          },
        });
      } else {
        updateData({
          geom: {
            type: "Point",
            coordinates: [lng, lat],
          },
        });
      }

      debounceTimer.current = window.setTimeout(() => {
        obtenerDireccionTexto(lat, lng, false);
      }, 600);
    } else {
      setPuntoB({ latitude: lat, longitude: lng });
      updateData({
        geom: {
          type: "LineString",
          coordinates: [
            [puntoA.longitude, puntoA.latitude],
            [lng, lat],
          ],
        },
      });

      debounceTimer.current = window.setTimeout(() => {
        obtenerDireccionTexto(lat, lng, true);
      }, 600);
    }
  };

  // Maneja el clic directo sobre el mapa
  const handleMapPress = (e: any) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    if (!esTramo) {
      procesarCambioUbicacion(latitude, longitude, false);
    } else {
      procesarCambioUbicacion(latitude, longitude, true);
    }
  };

  const activarModoTramo = () => {
    setEsTramo(true);
    const latB = puntoA.latitude;
    const lngB = puntoA.longitude + 0.0004;

    setPuntoB({ latitude: latB, longitude: lngB });

    updateData({
      geom: {
        type: "LineString",
        coordinates: [
          [puntoA.longitude, puntoA.latitude],
          [lngB, latB],
        ],
      },
    });

    obtenerDireccionTexto(latB, lngB, true);
  };

  const cambiarAModoPunto = () => {
    setEsTramo(false);
    setPuntoB(null);
    setDireccionB("");

    updateData({
      geom: {
        type: "Point",
        coordinates: [puntoA.longitude, puntoA.latitude],
      },
      direccionTexto: direccionA, // Volvemos a guardar solo la calle principal en el store
    });
  };

  return (
    <ScrollView
      style={styles.mainContainer}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <Text style={styles.sectionTitle}>Ubicación del incidente</Text>

      <View style={styles.mapWrapper}>
        {loadingGPS ? (
          <View style={styles.loadingGpsContainer}>
            <ActivityIndicator size="large" color="#6347D1" />
            <Text style={styles.loadingGpsText}>Buscando señal GPS...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: puntoA.latitude,
              longitude: puntoA.longitude,
              latitudeDelta: 0.001,
              longitudeDelta: 0.001,
            }}
            showsUserLocation={true}
            onPress={handleMapPress}
          >
            <Marker
              coordinate={puntoA}
              draggable
              onDragEnd={(e) => {
                const { latitude, longitude } = e.nativeEvent.coordinate;
                procesarCambioUbicacion(latitude, longitude, false);
              }}
            >
              <Ionicons name="location" size={38} color="#6347D1" />
            </Marker>

            {esTramo && puntoB && (
              <Marker
                coordinate={puntoB}
                draggable
                onDragEnd={(e) => {
                  const { latitude, longitude } = e.nativeEvent.coordinate;
                  procesarCambioUbicacion(latitude, longitude, true);
                }}
              >
                <Ionicons name="flag" size={38} color="#FF4763" />
              </Marker>
            )}

            {esTramo && puntoB && (
              <Polyline
                coordinates={[puntoA, puntoB]}
                strokeColor="#6347D1"
                strokeWidth={4}
              />
            )}
          </MapView>
        )}
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={[styles.modeBtn, !esTramo && styles.modeBtnActive]}
          onPress={cambiarAModoPunto}
        >
          <Text
            style={[styles.modeBtnText, !esTramo && styles.modeBtnTextActive]}
          >
            Punto Fijo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeBtn, esTramo && styles.modeBtnActive]}
          onPress={activarModoTramo}
        >
          <Text
            style={[styles.modeBtnText, esTramo && styles.modeBtnTextActive]}
          >
            Trazar Tramo
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.headerCardRow}>
          <Text style={styles.cardTitle}>Dirección detectada</Text>
          {loadingDireccion && (
            <ActivityIndicator size="small" color="#6347D1" />
          )}
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.iconCirclePurple}>
            <Ionicons name="pin" size={16} color="#6347D1" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.summaryLabel}>
              Inicio / Punto (Toca el mapa o arrastra)
            </Text>
            <Text style={styles.summaryValue} numberOfLines={2}>
              {direccionA}
            </Text>
          </View>
        </View>

        {esTramo && (
          <View style={[styles.summaryRow, { marginTop: 12 }]}>
            <View style={styles.iconCircleRed}>
              <Ionicons name="flag" size={16} color="#FF4763" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.summaryLabel}>
                Fin del Tramo (Toca el mapa o arrastra)
              </Text>
              <Text style={styles.summaryValue} numberOfLines={2}>
                {direccionB || "Cargando dirección de fin..."}
              </Text>
            </View>
          </View>
        )}
      </View>

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
    height: 230,
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
  loadingGpsContainer: {
    height: 230,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
  },
  loadingGpsText: {
    marginTop: 10,
    fontSize: 14,
    color: "#6347D1",
    fontWeight: "500",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  modeBtn: {
    flex: 0.48,
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: "#F5F6FA",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  modeBtnActive: {
    backgroundColor: "#6347D1",
    borderColor: "#6347D1",
  },
  modeBtnText: {
    color: "#777",
    fontWeight: "600",
    fontSize: 14,
  },
  modeBtnTextActive: {
    color: "#FFF",
  },
  summaryCard: {
    backgroundColor: "#F8F9FD",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#EEF0FF",
  },
  headerCardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCirclePurple: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF0FF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  iconCircleRed: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#888",
    fontWeight: "500",
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
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
