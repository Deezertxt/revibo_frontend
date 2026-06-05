import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { BuscadorBolivia } from "../componentes/BuscadorBolivia";
import { useEditarReporteStore } from "../store/editarReporteStore";

export default function PasoUbicacionEditar() {
  const { geom, direccionTexto, updateData, setStep } = useEditarReporteStore();
  const mapRef = useRef<MapView | null>(null);

  const [puntoA, setPuntoA] = useState<{ latitude: number; longitude: number }>(
    {
      latitude: -17.3935,
      longitude: -66.1568,
    },
  );
  const [puntoB, setPuntoB] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [esTramo, setEsTramo] = useState(false);

  const [coordenadasRutaVisual, setCoordenadasRutaVisual] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  const [direccionA, setDireccionA] = useState("Cargando dirección...");
  const [direccionB, setDireccionB] = useState("");
  const [loadingDireccion, setLoadingDireccion] = useState(false);
  const [loadingGPS, setLoadingGPS] = useState(true);

  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    (async () => {
      if (geom && geom.coordinates) {
        try {
          if (geom.type === "Point") {
            const lng = geom.coordinates[0];
            const lat = geom.coordinates[1];

            setPuntoA({ latitude: lat, longitude: lng });
            setEsTramo(false);
            setDireccionA(direccionTexto || "Dirección cargada");

            setTimeout(() => {
              mapRef.current?.animateToRegion(
                {
                  latitude: lat,
                  longitude: lng,
                  latitudeDelta: 0.004,
                  longitudeDelta: 0.004,
                },
                500,
              );
            }, 600);
          } else if (geom.type === "LineString") {
            const coords = geom.coordinates;
            const primerPunto = coords[0];
            const ultimoPunto = coords[coords.length - 1];

            const pA = { latitude: primerPunto[1], longitude: primerPunto[0] };
            const pB = { latitude: ultimoPunto[1], longitude: ultimoPunto[0] };

            setPuntoA(pA);
            setPuntoB(pB);
            setEsTramo(true);

            setCoordenadasRutaVisual(
              coords.map((c: number[]) => ({
                latitude: c[1],
                longitude: c[0],
              })),
            );

            if (direccionTexto && direccionTexto.includes(" hasta ")) {
              const partes = direccionTexto.split(" hasta ");
              setDireccionA(partes[0]);
              setDireccionB(partes[1]);
            } else {
              setDireccionA(direccionTexto || "Punto de Inicio");
            }

            setTimeout(() => {
              mapRef.current?.animateToRegion(
                {
                  latitude: pA.latitude,
                  longitude: pA.longitude,
                  latitudeDelta: 0.006,
                  longitudeDelta: 0.006,
                },
                500,
              );
            }, 600);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingGPS(false);
        }
        return;
      }

      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permiso denegado", "Necesitamos acceso a tu ubicación.");
          setLoadingGPS(false);
          return;
        }
        let location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const latInicial = location.coords.latitude;
        const lngInicial = location.coords.longitude;

        setPuntoA({ latitude: latInicial, longitude: lngInicial });
        updateData({
          geom: { type: "Point", coordinates: [lngInicial, latInicial] },
        });
        obtenerDireccionTexto(latInicial, lngInicial, false);

        setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              latitude: latInicial,
              longitude: lngInicial,
              latitudeDelta: 0.004,
              longitudeDelta: 0.004,
            },
            500,
          );
        }, 600);
      } catch {
        Alert.alert(
          "Error GPS",
          "No se pudo sincronizar la ubicación satelital.",
        );
      } finally {
        setLoadingGPS(false);
      }
    })();
  }, []);

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
        updateData({
          direccionTexto:
            esTramo && direccionB ? `${calle} hasta ${direccionB}` : calle,
        });
      } else {
        setDireccionB(calle);
        updateData({ direccionTexto: `${direccionA} hasta ${calle}` });
      }
    } catch {
      const fallback = "Dirección desconocida";
      if (!esPuntoB) {
        setDireccionA(fallback);
        updateData({
          direccionTexto:
            esTramo && direccionB
              ? `${fallback} hasta ${direccionB}`
              : fallback,
        });
      } else {
        setDireccionB(fallback);
        updateData({ direccionTexto: `${direccionA} hasta ${fallback}` });
      }
    } finally {
      setLoadingDireccion(false);
    }
  };

  const calcularRutaGratis = async (
    latA: number,
    lngA: number,
    latB: number,
    lngB: number,
  ) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lngA},${latA};${lngB},${latB}?overview=full&geometries=geojson`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.code === "Ok" && data.routes?.length > 0) {
        const geometryCoordinates = data.routes[0].geometry.coordinates;
        setCoordenadasRutaVisual(
          geometryCoordinates.map((c: number[]) => ({
            latitude: c[1],
            longitude: c[0],
          })),
        );
        updateData({
          geom: { type: "LineString", coordinates: geometryCoordinates },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const procesarCambioUbicacion = (
    lat: number,
    lng: number,
    esFin: boolean,
  ) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (!esFin) {
      setPuntoA({ latitude: lat, longitude: lng });
      if (esTramo && puntoB) {
        calcularRutaGratis(lat, lng, puntoB.latitude, puntoB.longitude);
      } else {
        updateData({ geom: { type: "Point", coordinates: [lng, lat] } });
      }
      debounceTimer.current = setTimeout(
        () => obtenerDireccionTexto(lat, lng, false),
        600,
      );
    } else {
      setPuntoB({ latitude: lat, longitude: lng });
      calcularRutaGratis(puntoA.latitude, puntoA.longitude, lat, lng);
      debounceTimer.current = setTimeout(
        () => obtenerDireccionTexto(lat, lng, true),
        600,
      );
    }
  };

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
    const latB = puntoA.latitude - 0.0001;
    const lngB = puntoA.longitude + 0.0001;
    setPuntoB({ latitude: latB, longitude: lngB });
    calcularRutaGratis(puntoA.latitude, puntoA.longitude, latB, lngB);
    obtenerDireccionTexto(latB, lngB, true);
  };

  const cambiarAModoPunto = () => {
    setEsTramo(false);
    setPuntoB(null);
    setDireccionB("");
    setCoordenadasRutaVisual([]);
    updateData({
      geom: { type: "Point", coordinates: [puntoA.longitude, puntoA.latitude] },
      direccionTexto: direccionA,
    });
  };

  const manejarConfirmacionFinal = () => {
    if (esTramo) {
      if (!puntoB || coordenadasRutaVisual.length === 0) {
        Alert.alert(
          "Atención",
          "Trazando la ruta del tramo, por favor espere un momento...",
        );
        return;
      }
      const geojsonCoordinates = coordenadasRutaVisual.map((c) => [
        c.longitude,
        c.latitude,
      ]);
      updateData({
        geom: { type: "LineString", coordinates: geojsonCoordinates },
        direccionTexto: direccionB
          ? `${direccionA} hasta ${direccionB}`
          : direccionA,
      });
    } else {
      updateData({
        geom: {
          type: "Point",
          coordinates: [puntoA.longitude, puntoA.latitude],
        },
        direccionTexto: direccionA,
      });
    }
    setStep(2);
  };

  return (
    <ScrollView
      style={styles.mainContainer}
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.sectionTitle}>Ubicación del incidente (Edición)</Text>

      <BuscadorBolivia
        onLocationSelect={(_, lat, lon) => {
          mapRef.current?.animateToRegion(
            {
              latitude: lat,
              longitude: lon,
              latitudeDelta: 0.004,
              longitudeDelta: 0.004,
            },
            1000,
          );
          if (!esTramo) {
            procesarCambioUbicacion(lat, lon, false);
          } else {
            procesarCambioUbicacion(lat, lon, true);
          }
        }}
      />

      <View style={styles.mapWrapper}>
        {loadingGPS ? (
          <View style={styles.loadingGpsContainer}>
            <ActivityIndicator size="large" color="#6347D1" />
            <Text style={styles.loadingGpsText}>
              Sincronizando coordenadas del reporte...
            </Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: puntoA.latitude,
              longitude: puntoA.longitude,
              latitudeDelta: esTramo ? 0.008 : 0.005,
              longitudeDelta: esTramo ? 0.008 : 0.005,
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

            {esTramo && puntoB && coordenadasRutaVisual.length > 0 && (
              <Polyline
                coordinates={coordenadasRutaVisual}
                strokeColor="#6347D1"
                strokeWidth={5}
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

      <View style={styles.navigationRow}>
        <TouchableOpacity
          onPress={manejarConfirmacionFinal}
          style={styles.btnContinuar}
        >
          <Text style={styles.btnText}>Guardar Cambios</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
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
    zIndex: 1,
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
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "#F5F6FA",
    alignItems: "center",
    justifyContent: "center",
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
  navigationRow: {
    width: "100%",
    marginTop: 10,
  },
  btnContinuar: {
    backgroundColor: "#6347D1",
    flexDirection: "row",
    padding: 18,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  btnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 10,
  },
});
