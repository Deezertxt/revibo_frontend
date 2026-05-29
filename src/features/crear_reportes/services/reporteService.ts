const BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL.trim()}/api/v1`
  : "https://revibo-backend.onrender.com/api/v1";

const API_URL = BASE_URL.replace(/\/$/, "");

export type CrearReportePayload = {
  titulo: string;
  descripcion: string;
  tipo_reporte: string;
  gravedad_reporte: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  geom: {
    type: "Point" | "LineString";
    coordinates: number[] | number[][];
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

  const responseBody = (await response.json().catch(() => null)) as any;

  if (!response.ok) {
    if (responseBody?.errors) {
      const detalle = Object.entries(responseBody.errors)
        .map(([campo, msgs]: any) => `${campo}: ${msgs.join(", ")}`)
        .join(" | ");
      throw new Error(`Fallo de Validación -> ${detalle}`);
    }

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
