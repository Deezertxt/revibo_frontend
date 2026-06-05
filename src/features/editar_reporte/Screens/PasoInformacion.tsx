import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { Selector } from "../componentes/Selectores";
import { useEditarReporteStore } from "../store/editarReporteStore";

LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene.",
    "Feb.",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul.",
    "Ago",
    "Sep.",
    "Oct.",
    "Nov.",
    "Dic.",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

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

const formatearVista = (fechaStr: string | null): string => {
  if (!fechaStr) return "";
  const partes = fechaStr.split(" ");
  const fechaPartes = partes[0].split("-");
  return `${fechaPartes[2]}/${fechaPartes[1]}/${fechaPartes[0]}   |   ${partes[1] ? partes[1].substring(0, 5) : "00:00"}`;
};

const formatearLaravel = (
  year: number,
  month: number,
  day: number,
  hours: number,
  minutes: number,
): string => {
  const pad = (num: number) => String(num).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)} ${pad(hours)}:${pad(minutes)}:00`;
};

interface PasoInformacionProps {
  alSiguiente?: () => void;
}

export default function PasoInformacion({ alSiguiente }: PasoInformacionProps) {
  const {
    titulo,
    descripcion,
    tipo_reporte,
    gravedad_reporte,
    fecha_inicio,
    fecha_fin,
    updateData,
    setStep,
  } = useEditarReporteStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [campoActual, setCampoActual] = useState<"fecha_inicio" | "fecha_fin">(
    "fecha_inicio",
  );

  const [diaSeleccionado, setDiaSeleccionado] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    day: new Date().getDate(),
  });
  const [hora, setHora] = useState(new Date().getHours());
  const [minutos, setMinutos] = useState(new Date().getMinutes());

  useEffect(() => {
    if (tipo_reporte === "cierre_programado" && !fecha_inicio) {
      const ahora = new Date();
      updateData({
        fecha_inicio: formatearLaravel(
          ahora.getFullYear(),
          ahora.getMonth() + 1,
          ahora.getDate(),
          ahora.getHours(),
          ahora.getMinutes(),
        ),
      });
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
  const fechaInicioValida = requiereFechaFin
    ? fecha_inicio && fecha_inicio.length > 0
    : true;

  const manejarSeleccionTipo = (val: string) => {
    if (val === "otro") {
      updateData({ tipo_reporte: "otro", fecha_inicio: null, fecha_fin: null });
    } else if (val === "cierre_programado") {
      const ahora = new Date();
      updateData({
        tipo_reporte: "cierre_programado",
        fecha_inicio: formatearLaravel(
          ahora.getFullYear(),
          ahora.getMonth() + 1,
          ahora.getDate(),
          ahora.getHours(),
          ahora.getMinutes(),
        ),
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

  const abrirPicker = (campo: "fecha_inicio" | "fecha_fin") => {
    setCampoActual(campo);
    const valorActual = campo === "fecha_inicio" ? fecha_inicio : fecha_fin;

    if (valorActual && valorActual.includes("-")) {
      try {
        const partes = valorActual.split(" ");
        const f = partes[0].split("-");
        const h = partes[1].split(":");
        setDiaSeleccionado({
          year: parseInt(f[0]),
          month: parseInt(f[1]),
          day: parseInt(f[2]),
        });
        setHora(parseInt(h[0]));
        setMinutos(parseInt(h[1]));
      } catch (e) {
        console.error("Error al parsear la fecha existente", e);
      }
    } else {
      const ahora = new Date();
      setDiaSeleccionado({
        year: ahora.getFullYear(),
        month: ahora.getMonth() + 1,
        day: ahora.getDate(),
      });
      setHora(ahora.getHours());
      setMinutos(ahora.getMinutes());
    }
    setModalVisible(true);
  };

  const guardarFechaYHora = () => {
    const stringLaravel = formatearLaravel(
      diaSeleccionado.year,
      diaSeleccionado.month,
      diaSeleccionado.day,
      hora,
      minutos,
    );
    updateData({ [campoActual]: stringLaravel });
    setModalVisible(false);
  };

  const ajustarHora = (cantidad: number) => {
    setHora((prev) => {
      let nueva = prev + cantidad;
      if (nueva > 23) return 0;
      if (nueva < 0) return 23;
      return nueva;
    });
  };

  const ajustarMinutos = (cantidad: number) => {
    setMinutos((prev) => {
      let nuevos = prev + cantidad;
      if (nuevos > 59) return 0;
      if (nuevos < 0) return 59;
      return nuevos;
    });
  };

  const esValido =
    titulo &&
    titulo.trim().length > 0 &&
    descripcion &&
    descripcion.trim().length > 0 &&
    tipo_reporte &&
    tipo_reporte !== "otro" &&
    fechaInicioValida &&
    fechaFinValida &&
    gravedad_reporte;

  const manejarContinuar = () => {
    if (alSiguiente) {
      alSiguiente();
    } else {
      setStep(1);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.inputLabel}>
          Título <Text style={{ color: "red" }}>*</Text>
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Ej: Colisión vehicular en Av. Ballivián"
          value={titulo || ""}
          onChangeText={(val) => updateData({ titulo: val })}
        />

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
            value={descripcion || ""}
            onChangeText={(val) => updateData({ descripcion: val })}
          />
          <Text style={styles.charCount}>
            {(descripcion || "").length} / 500
          </Text>
        </View>

        <Selector
          label="Tipo de reporte"
          options={TIPOS_OPTIONS}
          selectedValue={mostrarAdicionales ? "otro" : tipo_reporte}
          onSelect={manejarSeleccionTipo}
        />

        {mostrarAdicionales && (
          <View style={styles.adicionalesContainer}>
            <Selector
              label="Especifique el tipo de incidente"
              options={TIPOS_ADICIONALES_OPTIONS}
              selectedValue={esAdicional ? tipo_reporte : null}
              onSelect={(val) => updateData({ tipo_reporte: val })}
              columns={2}
            />
          </View>
        )}

        {requiereFechaFin && (
          <View style={styles.cierreContainer}>
            <View style={styles.cierreHeader}>
              <Ionicons name="calendar-outline" size={18} color="#6347D1" />
              <Text style={styles.cierreTitle}>
                Período del cierre programado
              </Text>
            </View>

            <Text style={styles.fechaLabel}>
              Fecha y hora de inicio <Text style={{ color: "red" }}>*</Text>
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

            <Text style={styles.fechaLabel}>
              Fecha y hora de fin <Text style={{ color: "red" }}>*</Text>
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
          </View>
        )}

        <Selector
          label="Gravedad"
          options={GRAVEDAD_OPTIONS}
          selectedValue={gravedad_reporte}
          onSelect={(val) => updateData({ gravedad_reporte: val })}
          columns={4}
        />

        <TouchableOpacity
          onPress={manejarContinuar}
          disabled={!esValido}
          style={[styles.btnContinuar, !esValido && styles.btnDisabled]}
        >
          <Text style={styles.btnText}>Continuar a Ubicación →</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal transparent visible={modalVisible} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.calendarCard}>
            <Text style={styles.modalTitle}>
              Configurar {campoActual === "fecha_inicio" ? "Inicio" : "Fin"}
            </Text>

            <Calendar
              onDayPress={(day) =>
                setDiaSeleccionado({
                  year: day.year,
                  month: day.month,
                  day: day.day,
                })
              }
              markedDates={{
                [`${diaSeleccionado.year}-${String(diaSeleccionado.month).padStart(2, "0")}-${String(diaSeleccionado.day).padStart(2, "0")}`]:
                  {
                    selected: true,
                    selectedColor: "#6347D1",
                  },
              }}
              theme={{
                todayTextColor: "#6347D1",
                arrowColor: "#6347D1",
                textMonthFontWeight: "bold",
              }}
            />

            <View style={styles.timePickerContainer}>
              <Text style={styles.timeLabel}>Hora:</Text>
              <View style={styles.timeRow}>
                <View style={styles.timeSelectorBox}>
                  <TouchableOpacity
                    onPress={() => ajustarHora(1)}
                    style={styles.arrowBtn}
                  >
                    <Ionicons name="chevron-up" size={20} color="#6347D1" />
                  </TouchableOpacity>
                  <Text style={styles.timeValue}>
                    {String(hora).padStart(2, "0")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => ajustarHora(-1)}
                    style={styles.arrowBtn}
                  >
                    <Ionicons name="chevron-down" size={20} color="#6347D1" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.timeDivider}>:</Text>

                <View style={styles.timeSelectorBox}>
                  <TouchableOpacity
                    onPress={() => ajustarMinutos(5)}
                    style={styles.arrowBtn}
                  >
                    <Ionicons name="chevron-up" size={20} color="#6347D1" />
                  </TouchableOpacity>
                  <Text style={styles.timeValue}>
                    {String(minutos).padStart(2, "0")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => ajustarMinutos(-5)}
                    style={styles.arrowBtn}
                  >
                    <Ionicons name="chevron-down" size={20} color="#6347D1" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnCancelarText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnAceptar}
                onPress={guardarFechaYHora}
              >
                <Text style={styles.btnAceptarText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scrollContent: { padding: 20, paddingBottom: 40 },
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
  textArea: { height: 100, textAlignVertical: "top" },
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
  cierreTitle: { fontSize: 15, fontWeight: "700", color: "#3F3080" },
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
  inputIcon: { marginRight: 10 },
  textInputInLine: { flex: 1, fontSize: 15, color: "#333" },
  btnContinuar: {
    backgroundColor: "#6347D1",
    padding: 18,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 20,
  },
  btnDisabled: { backgroundColor: "#CCC" },
  btnText: { color: "white", fontSize: 18, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  calendarCard: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    width: "100%",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    color: "#333",
  },
  timePickerContainer: {
    alignItems: "center",
    marginVertical: 15,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#555",
    marginBottom: 8,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  timeSelectorBox: {
    alignItems: "center",
    backgroundColor: "#F5F5FA",
    borderRadius: 12,
    paddingHorizontal: 10,
  },
  arrowBtn: { padding: 4 },
  timeValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginVertical: 2,
  },
  timeDivider: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6347D1",
    marginHorizontal: 15,
  },
  modalActionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
    gap: 12,
  },
  btnCancelar: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  btnCancelarText: { color: "#666", fontWeight: "bold" },
  btnAceptar: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: "#6347D1",
  },
  btnAceptarText: { color: "#FFF", fontWeight: "bold" },
});
