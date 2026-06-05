const BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL.trim()}/api/v1`
  : "https://revibo-backend.onrender.com/api/v1";

const API_URL = BASE_URL.replace(/\/$/, "");

export type EditarReportePayload = {
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

function obtenerFechaActualBackend(): string {
  const ahora = new Date();

  const dia = String(ahora.getDate()).padStart(2, "0");
  const mes = String(ahora.getMonth() + 1).padStart(2, "0"); // Enero es 0
  const anio = ahora.getFullYear();

  const hora = String(ahora.getHours()).padStart(2, "0");
  const min = String(ahora.getMinutes()).padStart(2, "0");

  return `${dia}-${mes}-${anio} ${hora}:${min}`;
}

function formatearFechaEstricta(fechaInput: any): string | null {
  if (!fechaInput) return null;

  const str = String(fechaInput).trim();

  const regexCorrecto = /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/;
  if (regexCorrecto.test(str)) {
    return str;
  }

  const digitos = str.match(/\d+/g);

  if (digitos && digitos.length >= 5) {
    let primerGrupo = digitos[0];

    let anio = "";
    let mes = "";
    let dia = "";
    let hora = digitos[3].padStart(2, "0");
    let min = digitos[4].padStart(2, "0");

    if (primerGrupo.length === 4) {
      anio = primerGrupo;
      mes = digitos[1].padStart(2, "0");
      dia = digitos[2].padStart(2, "0");
    } else {
      dia = primerGrupo.padStart(2, "0");
      mes = digitos[1].padStart(2, "0");
      anio = digitos[2];
    }

    return `${dia}-${mes}-${anio} ${hora}:${min}`;
  }

  return null;
}

export async function obtenerReportes(token: string): Promise<any[]> {
  const response = await fetch(`${API_URL}/reporte`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const responseBody = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(responseBody?.message || "Error al obtener reportes.");
  return responseBody?.data || responseBody || [];
}

export async function obtenerReportePorId(
  idReporte: string | number,
  token: string,
): Promise<any> {
  const response = await fetch(`${API_URL}/reporte/${idReporte}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const responseBody = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(responseBody?.message || "No se pudo obtener el reporte.");
  return responseBody?.data || responseBody;
}

export async function actualizarReporte(
  idReporte: string | number,
  payload: EditarReportePayload,
  token: string,
): Promise<{ message: string; data?: any }> {
  const payloadFormateado: Record<string, any> = {
    ...payload,
  };

  if (payload.tipo_reporte === "cierre_programado") {
    payloadFormateado.fecha_inicio = formatearFechaEstricta(
      payload.fecha_inicio,
    );
    payloadFormateado.fecha_fin = formatearFechaEstricta(payload.fecha_fin);
  } else {
    payloadFormateado.fecha_inicio = obtenerFechaActualBackend();

    delete payloadFormateado.fecha_fin;
  }

  const response = await fetch(`${API_URL}/reporte/${idReporte}`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payloadFormateado),
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    if (responseBody?.errors) {
      const detalle = Object.entries(responseBody.errors)
        .map(([campo, msgs]: any) => `${campo}: ${msgs.join(", ")}`)
        .join(" | ");
      throw new Error(`Fallo de Validación al Editar -> ${detalle}`);
    }
    throw new Error(responseBody?.message ?? "Error al actualizar el reporte.");
  }
  return { message: responseBody.message, data: responseBody.data };
}
