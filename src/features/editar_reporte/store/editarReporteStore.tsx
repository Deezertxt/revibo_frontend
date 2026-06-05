import { create } from "zustand";

export type TipoReporte =
  | "bloqueo"
  | "marcha"
  | "mantenimiento"
  | "cierre_programado"
  | "desfile"
  | "festividad"
  | "feria"
  | "accidente_vehicular"
  | "incendio"
  | "derrumbe"
  | "deslizamiento"
  | "inundacion"
  | "otro";

export type GravedadReporte = "Bajo" | "Medio" | "Alto" | "Critico";

interface EditarReporteState {
  // === ESTADO SINOPSIS REQUERIDO POR EL INDEX ===
  reporteSeleccionado: any | null;

  // Campos del Reporte desestructurados para el Wizard
  id_reporte: string | number | null;
  step: number;
  titulo: string;
  descripcion: string;
  tipo_reporte: TipoReporte | null;
  gravedad_reporte: GravedadReporte | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  geom: {
    type: "Point" | "LineString";
    coordinates: any;
  } | null;
  direccionTexto: string;
  url_imagen: string[];

  // Acciones
  setStep: (step: number) => void;
  updateData: (
    data: Partial<
      Omit<
        EditarReporteState,
        | "setStep"
        | "updateData"
        | "reset"
        | "cargarReporteParaEditar"
        | "limpiarReporteSeleccionado"
      >
    >,
  ) => void;
  cargarReporteParaEditar: (reporteBackend: any) => void;
  limpiarReporteSeleccionado: () => void; // <-- Declarada para ReportesIndexScreen
  reset: () => void;
}

const initialState = {
  reporteSeleccionado: null,
  id_reporte: null,
  step: 0,
  titulo: "",
  descripcion: "",
  tipo_reporte: null,
  gravedad_reporte: null,
  fecha_inicio: null,
  fecha_fin: null,
  geom: null,
  direccionTexto: "",
  url_imagen: [],
};

export const useEditarReporteStore = create<EditarReporteState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  updateData: (data) => set((state) => ({ ...state, ...data })),

  cargarReporteParaEditar: (reporteBackend) => {
    // Capturamos el array de imágenes sin importar si viene como 'imagenes' o 'url_imagen'
    const listaImagenes =
      reporteBackend.imagenes || reporteBackend.url_imagen || [];

    set({
      // Guardamos la referencia completa del reporte original
      reporteSeleccionado: reporteBackend,

      id_reporte: reporteBackend.id_reporte || reporteBackend.id,
      step: 0,
      titulo: reporteBackend.titulo || "",
      descripcion: reporteBackend.descripcion || "",
      tipo_reporte: reporteBackend.tipo_reporte || null,
      gravedad_reporte: reporteBackend.gravedad_reporte || null,
      fecha_inicio: reporteBackend.fecha_inicio || null,
      fecha_fin: reporteBackend.fecha_fin || null,
      geom: reporteBackend.geom || null,
      direccionTexto:
        reporteBackend.direccionTexto || reporteBackend.direccion || "",

      // Sincronizamos la propiedad del Store con el arreglo del Backend
      url_imagen: Array.isArray(listaImagenes)
        ? listaImagenes
        : [listaImagenes],
    });
  },

  // Vinculamos limpiarReporteSeleccionado para que limpie todo devolviendo al estado inicial
  limpiarReporteSeleccionado: () => set({ ...initialState }),

  reset: () => set({ ...initialState }),
}));
