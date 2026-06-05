import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ReporteCardProps {
  item: {
    id_reporte?: string | number;
    id?: string | number;
    titulo: string;
    descripcion: string;
    tipo_reporte: string;
    gravedad_reporte: "Bajo" | "Medio" | "Alto" | "Critico" | string;
    direccionTexto?: string;
    direccion?: string;
    fecha_inicio?: string | null;
  };
  onPressEditar: () => void;
  onPressDetalle?: () => void;
}

const GRAVEDAD_CONFIG: Record<string, { color: string; label: string }> = {
  Bajo: { color: "#2ECC71", label: "Bajo" },
  Medio: { color: "#F1C40F", label: "Medio" },
  Alto: { color: "#E67E22", label: "Alto" },
  Critico: { color: "#E74C3C", label: "Crítico" },
};

export function ReporteCard({
  item,
  onPressEditar,
  onPressDetalle,
}: ReporteCardProps) {
  const gravedad = item.gravedad_reporte || "Bajo";
  const configGravedad = GRAVEDAD_CONFIG[gravedad] || {
    color: "#6347D1",
    label: gravedad,
  };

  const direccionFinal =
    item.direccionTexto || item.direccion || "Ubicación no especificada";

  return (
    // Cambiamos el contenedor principal a un View para aislar los toques
    <View style={styles.cardContainer}>
      {/* Toda la zona de la información es la que dispara el Detalle */}
      <TouchableOpacity
        style={styles.infoContainer}
        onPress={onPressDetalle}
        activeOpacity={0.7}
      >
        {/* Fila Superior: Badges de Gravedad y Tipo */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.badgeGravedad,
              { backgroundColor: configGravedad.color + "15" },
            ]}
          >
            <Text
              style={[
                styles.badgeTextGravedad,
                { color: configGravedad.color },
              ]}
            >
              {configGravedad.label}
            </Text>
          </View>

          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>
              {item.tipo_reporte?.replace("_", " ")}
            </Text>
          </View>
        </View>

        {/* Título y Descripción Corta */}
        <Text style={styles.title} numberOfLines={1}>
          {item.titulo || "Incidente sin título"}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.descripcion || "Sin descripción proporcionada."}
        </Text>

        {/* Footer de la Card: Dirección y Botón Editar */}
        <View style={styles.footerRow}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText} numberOfLines={1}>
              {direccionFinal}
            </Text>
          </View>

          {/* El botón ahora reaccionará de manera independiente sin interferencias */}
          <TouchableOpacity
            style={styles.editFooterButton}
            onPress={onPressEditar}
            activeOpacity={0.6}
          >
            <Text style={styles.editFooterButtonText}>Editar</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F0F0F5",
  },
  infoContainer: {
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badgeGravedad: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeTextGravedad: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2C3E50",
  },
  description: {
    fontSize: 13,
    color: "#7F8C8D",
    lineHeight: 18,
    marginVertical: 6,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 0.7, // Ajustado ligeramente para dar un margen seguro al botón
  },
  locationText: {
    fontSize: 12,
    color: "#95A5A6",
    fontWeight: "500",
  },
  typeBadge: {
    backgroundColor: "#F5F6FA",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "#EAEAEA",
  },
  typeText: {
    fontSize: 10,
    color: "#7F8C8D",
    fontWeight: "600",
    textTransform: "capitalize",
  },
  editFooterButton: {
    backgroundColor: "#6347D1",
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  editFooterButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
});
