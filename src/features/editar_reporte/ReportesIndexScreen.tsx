import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAuthStore } from "../../shared/store/useAuthStore";
import { ReporteCard } from "./componentes/card_reporte";
import { obtenerReportes } from "./services/editarService";
import { useEditarReporteStore } from "./store/editarReporteStore";

import EditarReporteFeature from "./ReportesIndexScreen";

export default function ReportesIndexScreen() {
  const reporteSeleccionado = useEditarReporteStore(
    (state) => state.reporteSeleccionado,
  );
  const cargarReporteParaEditar = useEditarReporteStore(
    (state) => state.cargarReporteParaEditar,
  );

  const accessToken = useAuthStore((state) => state.accessToken);

  const [reportes, setReportes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargarReportesDesdeApi = async (mostrarLoaderSilencioso = false) => {
    if (!accessToken) {
      setError("No se detectó una sesión activa.");
      setLoading(false);
      return;
    }
    if (!mostrarLoaderSilencioso) setLoading(true);
    setError(null);

    try {
      const data = await obtenerReportes(accessToken);
      setReportes(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al cargar los reportes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarReportesDesdeApi();
  }, [accessToken]);

  const manejarRefresh = () => {
    setRefreshing(true);
    cargarReportesDesdeApi(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.mainContainer, styles.centerContainer]}>
        <StatusBar barStyle="light-content" backgroundColor="#6347D1" />
        <ActivityIndicator size="large" color="#FFF" />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#6347D1" />

      {reporteSeleccionado ? (
        <View style={{ flex: 1 }}>
          <EditarReporteFeature />
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <View>
              <Text style={styles.headerTitle}> Reportes</Text>
            </View>
            <TouchableOpacity
              style={styles.syncButton}
              onPress={() => cargarReportesDesdeApi()}
            >
              <Ionicons name="refresh" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {error ? (
            <View style={styles.centerContainer}>
              <Ionicons
                name="cloud-offline-outline"
                size={50}
                color="#E0D7FF"
              />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => cargarReportesDesdeApi()}
              >
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : reportes.length === 0 ? (
            <FlatList
              data={[]}
              renderItem={null}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons
                    name="document-text-outline"
                    size={60}
                    color="#E0D7FF"
                  />
                  <Text style={styles.emptyTitle}>
                    No hay reportes registrados
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    Los incidentes viales que puedes editar aparecerán en esta
                    lista.
                  </Text>
                </View>
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={manejarRefresh}
                  colors={["#6347D1"]}
                  tintColor="#FFF"
                />
              }
            />
          ) : (
            <FlatList
              data={reportes}
              contentContainerStyle={styles.listContent}
              keyExtractor={(item) =>
                String(item.id_reporte || item.id || Math.random())
              }
              renderItem={({ item }) => (
                <ReporteCard
                  item={item}
                  onPressEditar={() => {
                    setTimeout(() => {
                      cargarReporteParaEditar(item);
                    }, 50);
                  }}
                />
              )}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: "#5339B8" },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: "#6347D1",
    borderBottomWidth: 1,
    borderColor: "#5339B8",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E0D7FF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#FFF" },
  syncButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 15,
    color: "#FFF",
    fontWeight: "500",
  },
  listContent: { padding: 16, paddingBottom: 30 },
  errorText: {
    fontSize: 15,
    color: "#FFD2D2",
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
    fontWeight: "500",
  },
  retryButton: {
    backgroundColor: "#FFF",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: { color: "#6347D1", fontWeight: "bold", fontSize: 14 },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#E0D7FF",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
