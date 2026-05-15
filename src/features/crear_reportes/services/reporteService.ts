import { Platform } from "react-native";

const DEFAULT_API_URL =
  Platform.OS === "android"
    ? "http://192.168.1.8:8000/api/v1"
    : "http://localhost:8000/api/v1";

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(
  /\/$/,
  "",
);

// CORRECCIÓN AQUÍ: Modificamos el tipo para soportar LineString (Tramos)
export type CrearReportePayload = {
  titulo: string;
  descripcion: string;
  tipo_reporte: string;
  gravedad_reporte: string;
  geom: {
    type: "Point" | "LineString"; // <-- Permite ambos tipos
    coordinates: number[] | number[][]; // <-- Permite [lng, lat] o [[lng, lat], [lng, lat]]
  } | null;
  url_imagen: string[];
};

type ReporteResponse = {
  message: string;
  data?: {
    id_reporte: string;
    [key: string]: any;
  };
};

export async function crearReporte(
  payload: CrearReportePayload,
  token: string,
): Promise<ReporteResponse> {
  const response = await fetch(`${API_URL}/reporte`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const responseBody = (await response
    .json()
    .catch(() => null)) as ReporteResponse | null;

  if (!response.ok) {
    const message = responseBody?.message ?? "Error al crear el reporte.";
    throw new Error(message);
  }

  if (!responseBody) {
    throw new Error("El servidor no devolvió una respuesta válida.");
  }

  return {
    message: responseBody.message,
    data: responseBody.data,
  };
}
