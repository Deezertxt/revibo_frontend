import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuthStore } from "../../../shared/store/useAuthStore";
import { uploadImageToCloudinary } from "../services/cloudinaryService";
import { actualizarReporte } from "../services/editarService";
import { useEditarReporteStore } from "../store/editarReporteStore";

const GRAVEDAD_COLORS: Record<string, string> = {
  Bajo: "#00C853",
  Medio: "#FFB300",
  Alto: "#FF5252",
  Critico: "#B71C1C",
};

export default function PasoImagenes({
  alFinalizar,
}: {
  alFinalizar?: () => void;
}) {
  const store = useEditarReporteStore();
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);

  const [loading, setLoading] = useState(false);
  const [imagenesRemotas, setImagenesRemotas] = useState<string[]>([]);

  const inicializado = useRef(false);

  const imagenesLocales = store.url_imagen || [];
  const totalImagenes = imagenesLocales.length + imagenesRemotas.length;

  useEffect(() => {
    if (!inicializado.current && store.reporteSeleccionado) {
      const fotosBackend =
        store.reporteSeleccionado.imagenes ||
        store.reporteSeleccionado.url_imagen ||
        [];

      const listaFotos = Array.isArray(fotosBackend)
        ? fotosBackend
        : fotosBackend
          ? [fotosBackend]
          : [];

      const remotas = listaFotos.filter(
        (url: string) => typeof url === "string" && url.startsWith("http"),
      );
      setImagenesRemotas(remotas);
      store.updateData({ url_imagen: [] });

      inicializado.current = true;
    }

    return () => {
      store.updateData({ url_imagen: [] });
    };
  }, [store.reporteSeleccionado]);

  const seleccionarImagen = async () => {
    if (totalImagenes >= 5) {
      Alert.alert(
        "Límite alcanzado",
        "Solo puedes subir un máximo de 5 imágenes.",
      );
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      store.updateData({
        url_imagen: [...imagenesLocales, result.assets[0].uri],
      });
    }
  };

  const eliminarImagenLocal = (indexAEliminar: number) => {
    store.updateData({
      url_imagen: imagenesLocales.filter(
        (_, index) => index !== indexAEliminar,
      ),
    });
  };

  const eliminarImagenRemota = (indexAEliminar: number) => {
    Alert.alert(
      "¿Eliminar imagen guardada?",
      "Esta foto ya forma parte del reporte. Si guardas los cambios, se eliminará de forma permanente.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setImagenesRemotas((prev) =>
              prev.filter((_, index) => index !== indexAEliminar),
            );
          },
        },
      ],
    );
  };

  const guardarCambios = async () => {
    const token = accessToken;
    if (!token || !store.id_reporte) {
      Alert.alert("Error", "Sesión inválida o ID de reporte no encontrado.");
      return;
    }

    setLoading(true);

    try {
      let nuevasUrls: string[] = [];

      if (imagenesLocales.length > 0) {
        const promesasSubida = imagenesLocales.map((uri) =>
          uploadImageToCloudinary(uri),
        );
        nuevasUrls = await Promise.all(promesasSubida);
      }

      const urlsFinales = [...imagenesRemotas, ...nuevasUrls];

      const body = {
        titulo: store.titulo,
        descripcion: store.descripcion,
        tipo_reporte: store.tipo_reporte!,
        gravedad_reporte: store.gravedad_reporte!,
        fecha_inicio: store.fecha_inicio,
        fecha_fin: store.fecha_fin,
        geom: store.geom,
        url_imagen: urlsFinales,
      };

      const res = await actualizarReporte(store.id_reporte, body, token);

      Alert.alert(
        "Modificado",
        res.message || "Reporte actualizado con éxito.",
        [
          {
            text: "Aceptar",
            onPress: () => {
              if (store.reporteSeleccionado) {
                store.updateData({
                  reporteSeleccionado: {
                    ...store.reporteSeleccionado,
                    imagenes: urlsFinales,
                    url_imagen: urlsFinales,
                  },
                });
              }

              setImagenesRemotas([]);
              store.updateData({ url_imagen: [] });
              store.reset();

              if (alFinalizar) {
                alFinalizar();
              } else {
                router.dismissAll();
              }
            },
          },
        ],
      );
    } catch (e: any) {
      Alert.alert("Error al actualizar", e.message || "Inténtalo más tarde.");
    } finally {
      setLoading(false);
    }
  };

  const renderDetalleUbicacion = () => {
    if (!store.geom || !store.geom.coordinates)
      return <Text style={styles.summaryValue}>No seleccionada</Text>;
    const esPunto = store.geom.type === "Point";
    const coords = store.geom.coordinates;

    return (
      <View style={styles.ubicacionDetalleContainer}>
        <View style={styles.tipoUbicacionRow}>
          <Ionicons
            name={esPunto ? "location" : "trending-up-outline"}
            size={15}
            color="#6347D1"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.tipoUbicacionText}>
            {esPunto ? "Punto Fijo" : "Tramo Vial"}
          </Text>
        </View>
        <Text style={styles.direccionTextoDisplay} numberOfLines={2}>
          {store.direccionTexto ||
            (esPunto
              ? `Lat: ${coords[1]?.toFixed(5)}, Lng: ${coords[0]?.toFixed(5)}`
              : "Tramo marcado")}
        </Text>
      </View>
    );
  };

  const colorGravedadActual =
    GRAVEDAD_COLORS[store.gravedad_reporte || "Bajo"] || "#6347D1";

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.sectionTitle}>
          Modificar fotos del incidente (máx. 5)
        </Text>

        <View style={styles.imageGrid}>
          {imagenesRemotas.map((uri, index) => (
            <View key={`remote-${index}`} style={styles.imageCard}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.deleteBadge}
                onPress={() => eliminarImagenRemota(index)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={14} color="white" />
              </TouchableOpacity>
            </View>
          ))}

          {imagenesLocales.map((uri, index) => (
            <View key={`local-${index}`} style={styles.imageCard}>
              <Image source={{ uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.deleteBadge}
                onPress={() => eliminarImagenLocal(index)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={14} color="white" />
              </TouchableOpacity>
            </View>
          ))}

          {totalImagenes < 5 && (
            <TouchableOpacity
              style={styles.addCard}
              onPress={seleccionarImagen}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={28} color="#6347D1" />
              <Text style={styles.addText}>Agregar</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.imageCount}>
          {totalImagenes} de 5 imágenes totales.
        </Text>

        <Text style={styles.sectionTitle}>Resumen de Modificaciones</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Título</Text>
            <Text style={styles.summaryValue} numberOfLines={2}>
              {store.titulo || "Sin título"}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tipo de Incidente</Text>
            <View style={styles.badgeTipo}>
              <Text style={styles.badgeTextTipo}>
                {store.tipo_reporte?.replace("_", " ")}
              </Text>
            </View>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Gravedad del Reporte</Text>
            <View
              style={[
                styles.badgeGravedad,
                { borderColor: colorGravedadActual },
              ]}
            >
              <Text
                style={[
                  styles.badgeTextGravedad,
                  { color: colorGravedadActual },
                ]}
              >
                {store.gravedad_reporte || "Bajo"}
              </Text>
            </View>
          </View>

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

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={guardarCambios}
          style={[styles.publishBtn, loading && { opacity: 0.7 }]}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color="white"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.publishText}>Guardar Cambios</Text>
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
  scrollContent: { padding: 20, paddingBottom: 30 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
    marginTop: 10,
  },
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  imageCard: { width: 95, height: 95, borderRadius: 16, position: "relative" },
  imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: "#F2F2F7",
  },
  deleteBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#FF4763",
    borderRadius: 12,
    width: 22,
    height: 22,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  addCard: {
    width: 95,
    height: 95,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#6347D1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F7FF",
  },
  addText: { fontSize: 12, color: "#6347D1", fontWeight: "600", marginTop: 4 },
  imageCount: { fontSize: 12, color: "#AAA", marginBottom: 22, paddingLeft: 2 },
  summaryCard: {
    backgroundColor: "#F8F9FD",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EEF0F6",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EAECEF",
  },
  summaryLabel: { fontSize: 14, color: "#666", fontWeight: "500", flex: 1 },
  summaryValue: {
    fontSize: 14,
    color: "#222",
    fontWeight: "600",
    flex: 1.8,
    textAlign: "right",
  },
  badgeTipo: {
    backgroundColor: "#EFEFFF",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  badgeTextTipo: {
    color: "#6347D1",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  badgeGravedad: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#FFF",
  },
  badgeTextGravedad: { fontSize: 13, fontWeight: "700" },
  footer: { padding: 20, backgroundColor: "#FFF" },
  publishBtn: {
    backgroundColor: "#6347D1",
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    width: "100%",
    elevation: 2,
    shadowColor: "#6347D1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  publishText: { color: "white", fontSize: 16, fontWeight: "700" },
  ubicacionDetalleContainer: { flex: 1.8, alignItems: "flex-end" },
  tipoUbicacionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  tipoUbicacionText: { fontSize: 12, fontWeight: "700", color: "#6347D1" },
  direccionTextoDisplay: {
    fontSize: 14,
    color: "#333",
    fontWeight: "600",
    textAlign: "right",
  },
});
