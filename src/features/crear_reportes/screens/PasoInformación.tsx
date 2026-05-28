import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Selector } from "../componentes/Selectores";
import { useCrearReporteStore } from "../store/crearReporteStore";

const TIPOS_OPTIONS = [
  {
    label: "Accidente",
    value: "accidente_vehicular",
    icon: "alert-circle-outline",
  },
  { label: "Bloqueo", value: "bloqueo", icon: "list-outline" },
  { label: "Mantenimiento", value: "mantenimiento", icon: "build-outline" },
  {
    label: "Cierre prog.",
    value: "cierre_programado",
    icon: "calendar-outline",
  },
  { label: "Desvío", value: "desvío", icon: "warning-outline" }, // Nota: Ajustar según API si es necesario
  { label: "Otro", value: "otro", icon: "globe-outline" },
];

const GRAVEDAD_OPTIONS = [
  { label: "Bajo", value: "Bajo", color: "#00C853" },
  { label: "Medio", value: "Medio", color: "#FFB300" },
  { label: "Alto", value: "Alto", color: "#FF5252" },
  { label: "Crítico", value: "Critico", color: "#B71C1C" },
];

export default function PasoInformacion() {
  const {
    titulo,
    descripcion,
    tipo_reporte,
    gravedad_reporte,
    updateData,
    setStep,
  } = useCrearReporteStore();

  const esValido =
    titulo.length > 0 &&
    descripcion.length > 0 &&
    tipo_reporte &&
    gravedad_reporte;

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Input de Título */}
        <Text style={styles.inputLabel}>
          Título <Text style={{ color: "red" }}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Colisión vehicular en Av. Ballivián"
          value={titulo}
          onChangeText={(val) => updateData({ titulo: val })}
        />

        {/* Input de Descripción */}
        <Text style={styles.inputLabel}>
          Descripción <Text style={{ color: "red" }}>*</Text>
        </Text>
        <View>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe lo que sucede..."
            multiline
            numberOfLines={4}
            maxLength={500}
            value={descripcion}
            onChangeText={(val) => updateData({ descripcion: val })}
          />
          <Text style={styles.charCount}>{descripcion.length} / 500</Text>
        </View>

        <Selector
          label="Tipo de reporte"
          options={TIPOS_OPTIONS}
          selectedValue={tipo_reporte}
          onSelect={(val) => updateData({ tipo_reporte: val })}
        />

        <Selector
          label="Gravedad"
          options={GRAVEDAD_OPTIONS}
          selectedValue={gravedad_reporte}
          onSelect={(val) => updateData({ gravedad_reporte: val })}
          columns={4}
        />

        <TouchableOpacity
          onPress={() => setStep(1)}
          disabled={!esValido}
          style={[styles.btnContinuar, !esValido && styles.btnDisabled]}
        >
          <Text style={styles.btnText}>Continuar →</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#444",
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#333",
    backgroundColor: "#FFF",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: "#AAA",
    marginTop: 4,
    marginBottom: 10,
  },
  btnContinuar: {
    backgroundColor: "#6347D1",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
  },
  btnDisabled: {
    backgroundColor: "#CCC",
  },
  btnText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
});
