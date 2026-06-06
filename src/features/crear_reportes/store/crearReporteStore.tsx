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

interface ReporteState {
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

  setStep: (step: number) => void;
  updateData: (
    data: Partial<
      Omit<ReporteState, "setStep" | "updateData" | "reset" | "limpiarStore">
    >,
  ) => void;
  limpiarStore: () => void;
  reset: () => void;
}

const initialState = {
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

export const useCrearReporteStore = create<ReporteState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  updateData: (data) => set((state) => ({ ...state, ...data })),

  limpiarStore: () => set({ ...initialState }),

  reset: () => set({ ...initialState }),
}));
