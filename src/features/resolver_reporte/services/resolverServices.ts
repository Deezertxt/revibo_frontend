const BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL.trim()}/api/v1`
  : "https://revibo-backend.onrender.com/api/v1";

const API_URL = BASE_URL.replace(/\/$/, "");

export async function obtenerReportesParaResolver(
  token: string,
): Promise<any[]> {
  const response = await fetch(`${API_URL}/reporte/user`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  const responseBody = await response.json().catch(() => null);
  if (!response.ok)
    throw new Error(responseBody?.message || "Error al obtener los reportes.");
  return responseBody?.data || responseBody || [];
}

export async function eliminarReportePorId(
  idReporte: string | number,
  token: string,
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/reporte/${idReporte}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      responseBody?.message || "No se pudo eliminar/resolver el reporte.",
    );
  }

  return { message: responseBody?.message || "Reporte resuelto con éxito." };
}
