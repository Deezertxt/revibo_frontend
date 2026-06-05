const BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL.trim()}/api/v1`
  : "https://revibo-backend.onrender.com/api/v1";

const API_URL = BASE_URL.replace(/\/$/, "");

// === TIPADOS DE DOMINIO ===

export type GeoJSONGeometry = {
  type: "Point" | "LineString";
  coordinates: number[] | number[][];
};

export type EditarReportePayload = {
  titulo: string;
  descripcion: string;
  tipo_reporte: string;
  gravedad_reporte: string;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  geom: GeoJSONGeometry | null;
  url_imagen: string[];
};

// Interfaz para representar la estructura común de un reporte que viene de tu base de datos
export interface ReporteData extends EditarReportePayload {
  id_reporte: string | number;
  id_usuario: string | number;
  direccionTexto?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Obtiene la lista completa de reportes de la API para alimentar las card_reporte
 */
export async function obtenerReportes(token: string): Promise<ReporteData[]> {
  const response = await fetch(`${API_URL}/reporte`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      responseBody?.message || "Error al obtener la lista de reportes.",
    );
  }

  // Previene fallos si la API encapsula el array en un objeto .data o .reportes
  return responseBody?.data || responseBody?.reportes || responseBody || [];
}

/**
 * Obtiene un único reporte por su ID para precargar el Store de Edición
 */
export async function obtenerReportePorId(
  idReporte: string | number,
  token: string,
): Promise<ReporteData> {
  if (!idReporte) throw new Error("ID de reporte no provisto.");

  const response = await fetch(`${API_URL}/reporte/${idReporte}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      responseBody?.message || "No se pudo recuperar los datos del reporte.",
    );
  }

  return responseBody?.data || responseBody;
}

/**
 * Envía las modificaciones consolidadas del reporte mediante una petición PUT
 */
export async function actualizarReporte(
  idReporte: string | number,
  payload: EditarReportePayload,
  token: string,
): Promise<{ message: string; data?: ReporteData }> {
  if (!idReporte) throw new Error("ID de reporte inválido para actualización.");

  const response = await fetch(`${API_URL}/reporte/${idReporte}`, {
    method: "PUT",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    // Manejo inteligente de fallos de validación complejos (P. ej: de frameworks tipo Laravel/Express Validation)
    if (responseBody?.errors) {
      const detalle = Object.entries(responseBody.errors)
        .map(([campo, msgs]: any) => {
          const mensajeLimpio = Array.isArray(msgs) ? msgs.join(", ") : msgs;
          return `${campo}: ${mensajeLimpio}`;
        })
        .join(" | ");
      throw new Error(`Fallo de Validación al Editar -> ${detalle}`);
    }

    throw new Error(
      responseBody?.message ?? "Error interno al actualizar el reporte.",
    );
  }

  return {
    message: responseBody?.message || "Reporte actualizado con éxito.",
    data: responseBody?.data,
  };
}
