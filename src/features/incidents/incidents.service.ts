import NetInfo from '@react-native-community/netinfo';

import type { Incident } from '@/features/incidents/types';

const DEFAULT_API_URL = 'http://localhost:8000/api/v1';
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');
const COORDINATE_ORDER = process.env.EXPO_PUBLIC_COORDINATE_ORDER ?? 'lat_lng';
const REQUEST_TIMEOUT_MS = 12000;

type ApiGeometry = {
  type: 'Point' | 'LineString';
  coordinates: number[] | number[][];
};

type ApiReport = {
  id_reporte: string;
  titulo: string;
  descripcion: string;
  institucion?: string;
  tipo_reporte: Incident['type'];
  gravedad_reporte: Incident['severity'];
  geom: ApiGeometry | null;
  estado: boolean;
  fecha_inicio: string;
  fecha_fin?: string | null;
  imagenes?: string[];
};

type ApiListResponse = {
  message: string;
  data: ApiReport[];
};

type ApiDetailResponse = {
  message: string;
  data: ApiReport;
};

export class ConnectivityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectivityError';
  }
}

function parseCoordinatePair(pair: number[]): { latitude: number; longitude: number } {
  const [first, second] = pair;

  if (COORDINATE_ORDER === 'lng_lat') {
    return { latitude: second, longitude: first };
  }

  return { latitude: first, longitude: second };
}

function normalizeDate(dateValue: string | null | undefined): string | undefined {
  if (!dateValue) {
    return undefined;
  }

  const trimmed = dateValue.trim();

  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    return trimmed;
  }

  const match = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/);

  if (!match) {
    return trimmed;
  }

  const [, day, month, year, hour, minute] = match;
  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}

function mapApiReportToIncident(report: ApiReport): Incident {
  const geometry = report.geom;

  if (!geometry) {
    throw new Error('El reporte no contiene geometria.');
  }

  let mapCoordinates: Incident['mapCoordinates'] = [];

  if (geometry.type === 'Point') {
    const point = Array.isArray(geometry.coordinates) ? geometry.coordinates as number[] : [];

    if (point.length < 2) {
      throw new Error('El punto del reporte es invalido.');
    }

    mapCoordinates = [parseCoordinatePair(point)];
  } else {
    const points = Array.isArray(geometry.coordinates) ? geometry.coordinates as number[][] : [];

    mapCoordinates = points
      .filter((point) => Array.isArray(point) && point.length >= 2)
      .map((point) => parseCoordinatePair(point));

    if (mapCoordinates.length === 0) {
      throw new Error('La linea del reporte es invalida.');
    }
  }

  const primaryCoordinate = mapCoordinates[0];

  return {
    id: report.id_reporte,
    title: report.titulo,
    description: report.descripcion,
    type: report.tipo_reporte,
    status: report.estado ? 'activo' : 'resuelto',
    severity: report.gravedad_reporte,
    authority: report.institucion ?? 'Administracion',
    locationText: `${report.institucion ?? 'Administracion'} · ${report.tipo_reporte}`,
    geometryType: geometry.type,
    mapCoordinates,
    latitude: primaryCoordinate.latitude,
    longitude: primaryCoordinate.longitude,
    startAt: normalizeDate(report.fecha_inicio) ?? report.fecha_inicio,
    endAt: normalizeDate(report.fecha_fin ?? undefined),
    imageUrls: report.imagenes ?? [],
  };
}

function tryMapApiReportToIncident(report: ApiReport): Incident | null {
  try {
    return mapApiReportToIncident(report);
  } catch {
    return null;
  }
}

async function requestJson<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const message = payload?.message ?? `Error HTTP ${response.status}`;
      throw new Error(message);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('La consulta de reportes demoro demasiado.');
    }

    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function fetchActiveIncidents(): Promise<Incident[]> {
  const netState = await NetInfo.fetch();

  if (!netState.isConnected || netState.isInternetReachable === false) {
    throw new ConnectivityError('Sin conexion a internet. Mostrando mapa sin reportes.');
  }

  const payload = await requestJson<ApiListResponse>('/reporte');
  const incidents = payload.data
    .map(tryMapApiReportToIncident)
    .filter((incident): incident is Incident => incident !== null);

  if (incidents.length === 0 && payload.data.length > 0) {
    throw new Error('Los reportes recibidos no tienen geometria valida.');
  }

  return incidents;
}

export async function fetchIncidentDetailById(id: string): Promise<Incident> {
  const netState = await NetInfo.fetch();

  if (!netState.isConnected || netState.isInternetReachable === false) {
    throw new ConnectivityError('Sin conexion. No se pudo cargar el detalle del reporte.');
  }

  const payload = await requestJson<ApiDetailResponse>(`/reporte/${id}`);
  return mapApiReportToIncident(payload.data);
}
