import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuthStore } from "../../shared/store/useAuthStore";
import { ReporteCardResolver } from "./componentes/card_resolver";
import { eliminarImagenDeCloudinary } from "./services/borrarCloud";
import {
  eliminarReportePorId,
  obtenerReportesParaResolver,
} from "./services/resolverServices";

export default function ResolverReporteScreen() {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const [reportes, setReportes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  const handleBack = () => {
    router.push("/(tabs)/reportes_menu");
  };

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  const cargarReportes = async () => {
    if (!accessToken) return;
    try {
      setLoading(true);
      const data = await obtenerReportesParaResolver(accessToken);
      setReportes(data);
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "No se pudieron cargar los reportes.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarReportes();
  }, [accessToken]);

  const handleConfirmarResolver = (item: any) => {
    const idReporte = item.id || item.id_reporte;

    if (!idReporte) {
      Alert.alert("Error", "No se encontró el ID del reporte.");
      return;
    }

    Alert.alert(
      "¿Resolver Reporte?",
      `¿Estás seguro de que deseas resolver el reporte "${item.titulo || "este reporte"}"`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Resolver",
          style: "destructive",
          onPress: () => ejecutarEliminacion(idReporte),
        },
      ],
    );
  };

  const ejecutarEliminacion = async (idReporte: string | number) => {
    if (!accessToken) return;
    try {
      setActionLoading(true);

      const reporteAEliminar = reportes.find(
        (r) => r.id === idReporte || r.id_reporte === idReporte,
      );

      if (reporteAEliminar && reporteAEliminar.url_imagen) {
        const urls: string[] = Array.isArray(reporteAEliminar.url_imagen)
          ? reporteAEliminar.url_imagen
          : JSON.parse(reporteAEliminar.url_imagen || "[]");

        if (urls.length > 0) {
          await Promise.all(
            urls.map((url) =>
              eliminarImagenDeCloudinary(url).catch((err) => console.log(err)),
            ),
          );
        }
      }

      const respuesta = await eliminarReportePorId(idReporte, accessToken);

      setReportes((prev) =>
        prev.filter((r) => r.id !== idReporte && r.id_reporte !== idReporte),
      );

      Alert.alert("Éxito", respuesta.message || "Reporte resuelto");
    } catch (error: any) {
      Alert.alert(
        "Error al eliminar",
        error.message || "Inténtalo de nuevo más tarde.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>
          Obteniendo reportes de la base de datos...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Resuelve tus Reportes</Text>
        </View>
        <TouchableOpacity
          style={styles.syncButton}
          onPress={cargarReportes}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      {actionLoading && (
        <View style={styles.miniLoader}>
          <ActivityIndicator size="small" color="#6347D1" />
          <Text style={styles.miniLoaderText}>Resolviendo reporte...</Text>
        </View>
      )}

      <FlatList
        data={reportes}
        keyExtractor={(item) =>
          (item.id || item.id_reporte || Math.random()).toString()
        }
        renderItem={({ item }) => (
          <ReporteCardResolver
            item={item}
            onPressResolver={() => handleConfirmarResolver(item)}
            onPressDetalle={() =>
              console.log("Ver detalle del reporte", item.id)
            }
          />
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No quedan reportes viales activos
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6347D1",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 20,
    backgroundColor: "#6347D1",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 4,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.7)",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  syncButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#6347D1",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 30,
  },
  emptyContainer: {
    marginTop: 40,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 15,
    color: "#ffffff",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
  },
  miniLoader: {
    flexDirection: "row",
    backgroundColor: "rgba(99, 71, 209, 0.12)",
    padding: 12,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(99, 71, 209, 0.2)",
  },
  miniLoaderText: {
    color: "#6347D1",
    fontSize: 14,
    fontWeight: "600",
  },
});
