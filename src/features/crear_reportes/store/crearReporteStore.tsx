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
  | "inundacion";

export type GravedadReporte = "Bajo" | "Medio" | "Alto" | "Critico";

interface ReporteState {
  step: number;
  titulo: string;
  descripcion: string;
  tipo_reporte: TipoReporte | null;
  gravedad_reporte: GravedadReporte | null;
  geom: {
    type: "Point" | "LineString";
    coordinates: any;
  } | null;
  url_imagen: string[];

  // Acciones
  setStep: (step: number) => void;
  updateData: (
    data: Partial<Omit<ReporteState, "setStep" | "updateData" | "reset">>,
  ) => void;
  reset: () => void;
}

const initialState = {
  step: 0,
  titulo: "",
  descripcion: "",
  tipo_reporte: null,
  gravedad_reporte: null,
  geom: null,
  url_imagen: [],
};

export const useCrearReporteStore = create<ReporteState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  updateData: (data) => set((state) => ({ ...state, ...data })),

  reset: () => set({ ...initialState }),
}));
