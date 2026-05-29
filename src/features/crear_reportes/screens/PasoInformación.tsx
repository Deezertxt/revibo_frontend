import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker"; // 🌟 Importamos el selector nativo
import React, { useEffect, useState } from "react";
import {
  Platform,
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
  { label: "Desvío", value: "desvío", icon: "warning-outline" },
  { label: "Otro", value: "otro", icon: "globe-outline" },
];

const TIPOS_ADICIONALES_OPTIONS = [
  { label: "Marcha", value: "marcha", icon: "people-outline" },
  { label: "Desfile", value: "desfile", icon: "flag-outline" },
  { label: "Festividad", value: "festividad", icon: "wine-outline" },
  { label: "Feria", value: "feria", icon: "storefront-outline" },
  { label: "Incendio", value: "incendio", icon: "flame-outline" },
  { label: "Derrumbe", value: "derrumbe", icon: "alert-circle-outline" },
  {
    label: "Deslizamiento",
    value: "deslizamiento",
    icon: "trending-down-outline",
  },
  { label: "Inundación", value: "inundacion", icon: "water-outline" },
];

const GRAVEDAD_OPTIONS = [
  { label: "Bajo", value: "Bajo", color: "#00C853" },
  { label: "Medio", value: "Medio", color: "#FFB300" },
  { label: "Alto", value: "Alto", color: "#FF5252" },
  { label: "Crítico", value: "Critico", color: "#B71C1C" },
];

// 🌟 Función Helper para formatear la fecha a texto amigable "DD/MM/AAAA | HH:MM" en la UI
const formatearVista = (fechaStr: string | null): string => {
  if (!fechaStr) return "";
  const d = new Date(fechaStr.replace(" ", "T")); // Asegura compatibilidad con string de Laravel
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}   |   ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

// 🌟 Función Helper para enviar los datos limpios que exige Laravel (YYYY-MM-DD HH:mm:ss)
const formatearLaravel = (date: Date): string => {
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export default function PasoInformacion() {
  const {
    titulo,
    descripcion,
    tipo_reporte,
    gravedad_reporte,
    fecha_inicio,
    fecha_fin,
    updateData,
    setStep,
  } = useCrearReporteStore();

  // Estados locales para controlar qué selector de fecha/hora se abre
  const [pickerConfig, setPickerConfig] = useState<{
    show: boolean;
    campo: "fecha_inicio" | "fecha_fin";
    mode: "date" | "time";
  }>({ show: false, campo: "fecha_inicio", mode: "date" });

  // 🌟 Efecto para inicializar la fecha_inicio con el "ahora" real si se elige cierre_programado
  useEffect(() => {
    if (tipo_reporte === "cierre_programado" && !fecha_inicio) {
      updateData({ fecha_inicio: formatearLaravel(new Date()) });
    }
  }, [tipo_reporte]);

  const esAdicional = TIPOS_ADICIONALES_OPTIONS.some(
    (opt) => opt.value === tipo_reporte,
  );
  const mostrarAdicionales = tipo_reporte === "otro" || esAdicional;

  const requiereFechaFin = tipo_reporte === "cierre_programado";
  const fechaFinValida = requiereFechaFin
    ? fecha_fin && fecha_fin.length > 0
    : true;

  const manejarSeleccionTipo = (val: string) => {
    if (val === "otro") {
      updateData({
        tipo_reporte: tipo_reporte === "otro" ? null : "otro",
        fecha_inicio: null,
        fecha_fin: null,
      });
    } else if (val === "cierre_programado") {
      updateData({
        tipo_reporte: "cierre_programado",
        fecha_inicio: formatearLaravel(new Date()), // Autocompleta al instante
        fecha_fin: null,
      });
    } else {
      updateData({
        tipo_reporte: val as any,
        fecha_inicio: null,
        fecha_fin: null,
      });
    }
  };

  // Manejador cuando el usuario confirma una fecha o una hora en el calendario nativo
  const onPickerChange = (event: any, selectedDate?: Date) => {
    if (event.type === "dismissed" || !selectedDate) {
      setPickerConfig((prev) => ({ ...prev, show: false }));
      return;
    }

    const campoActual = pickerConfig.campo;
    const valorActualEnStore =
      campoActual === "fecha_inicio" ? fecha_inicio : fecha_fin;

    // Si editamos, mezclamos el día previo con la hora nueva o viceversa
    let fechaBase = valorActualEnStore
      ? new Date(valorActualEnStore.replace(" ", "T"))
      : new Date();

    if (pickerConfig.mode === "date") {
      fechaBase.setFullYear(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
      );

      // En Android, los pickers van uno por uno. Si seleccionó fecha, abrimos de inmediato el reloj (time)
      if (Platform.OS === "android") {
        setPickerConfig({ show: true, campo: campoActual, mode: "time" });
        updateData({ [campoActual]: formatearLaravel(fechaBase) });
        return;
      }
    } else {
      fechaBase.setHours(selectedDate.getHours(), selectedDate.getMinutes());
    }

    updateData({ [campoActual]: formatearLaravel(fechaBase) });
    setPickerConfig((prev) => ({ ...prev, show: false }));
  };

  const abrirPicker = (campo: "fecha_inicio" | "fecha_fin") => {
    setPickerConfig({ show: true, campo, mode: "date" });
  };

  const esValido =
    titulo.length > 0 &&
    descripcion.length > 0 &&
    tipo_reporte &&
    tipo_reporte !== "otro" &&
    fechaFinValida &&
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

        {/* Selector Principal */}
        <Selector
          label="Tipo de reporte"
          options={TIPOS_OPTIONS}
          selectedValue={mostrarAdicionales ? "otro" : tipo_reporte}
          onSelect={manejarSeleccionTipo}
        />

        {/* Selector Desplegable de Adicionales */}
        {mostrarAdicionales && (
          <View style={styles.adicionalesContainer}>
            <Selector
              label="Especifique el tipo de incidente"
              options={TIPOS_ADICIONALES_OPTIONS}
              selectedValue={tipo_reporte === "otro" ? null : tipo_reporte}
              onSelect={(val) => updateData({ tipo_reporte: val })}
              columns={2}
            />
          </View>
        )}

        {/* 🌟 SECCIÓN: Período del Cierre (Inicio y Fin Dinámicos) 🌟 */}
        {requiereFechaFin && (
          <View style={styles.cierreContainer}>
            <View style={styles.cierreHeader}>
              <Ionicons name="calendar-outline" size={18} color="#4A37A0" />
              <Text style={styles.cierreTitle}>
                Período del cierre programado
              </Text>
            </View>

            {/* 🗓️ SUB-APARTADO: Fecha Inicio */}
            <Text style={styles.fechaLabel}>
              Fecha de inicio <Text style={{ color: "red" }}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.fechaInputBox}
              onPress={() => abrirPicker("fecha_inicio")}
            >
              <Ionicons
                name="calendar-clear-outline"
                size={20}
                color="#6347D1"
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.textInputInLine,
                  !fecha_inicio && { color: "#AAA" },
                ]}
              >
                {fecha_inicio
                  ? formatearVista(fecha_inicio)
                  : "Seleccionar inicio"}
              </Text>
              <Ionicons name="time-outline" size={18} color="#AAA" />
            </TouchableOpacity>

            <View style={{ marginVertical: 6 }} />

            {/* 🗓️ SUB-APARTADO: Fecha Fin */}
            <Text style={styles.fechaLabel}>
              Fecha de fin <Text style={{ color: "red" }}>*</Text>
            </Text>
            <TouchableOpacity
              style={styles.fechaInputBox}
              onPress={() => abrirPicker("fecha_fin")}
            >
              <Ionicons
                name="calendar-clear-outline"
                size={20}
                color="#AAA"
                style={styles.inputIcon}
              />
              <Text
                style={[
                  styles.textInputInLine,
                  !fecha_fin && { color: "#AAA" },
                ]}
              >
                {fecha_fin
                  ? formatearVista(fecha_fin)
                  : "DD / MM / AAAA   |   HH:MM"}
              </Text>
              <Ionicons name="time-outline" size={18} color="#AAA" />
            </TouchableOpacity>

            <Text style={styles.cierreHelper}>
              La fecha de fin debe ser posterior a la de inicio.
            </Text>
          </View>
        )}

        {/* Selector de Gravedad */}
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

      {/* 🌟 COMPONENTE MODAL OCULTO DEL DATETIME PICKER */}
      {pickerConfig.show && (
        <DateTimePicker
          value={
            pickerConfig.campo === "fecha_inicio"
              ? fecha_inicio
                ? new Date(fecha_inicio.replace(" ", "T"))
                : new Date()
              : fecha_fin
                ? new Date(fecha_fin.replace(" ", "T"))
                : new Date()
          }
          mode={pickerConfig.mode}
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onPickerChange}
        />
      )}
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
  adicionalesContainer: {
    marginTop: -5,
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  cierreContainer: {
    backgroundColor: "#F8F7FF",
    borderWidth: 1,
    borderColor: "#EAE6FF",
    borderRadius: 20,
    padding: 16,
    marginVertical: 10,
  },
  cierreHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  cierreTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3F3080",
  },
  fechaLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 6,
  },
  fechaInputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderWidth: 1.5,
    borderColor: "#DDDCCF",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInputInLine: {
    flex: 1,
    fontSize: 15,
    color: "#333",
  },
  cierreHelper: {
    fontSize: 13,
    color: "#7662E4",
    marginTop: 10,
    fontWeight: "500",
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
