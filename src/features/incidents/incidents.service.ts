import NetInfo from '@react-native-community/netinfo';

import type { Incident } from '@/features/incidents/types';
import { getAccessToken } from '@/shared/store/authStore';

const DEFAULT_API_URL = 'http://localhost:8000/api/v1';
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL).replace(/\/$/, '');
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN;
const COORDINATE_ORDER = process.env.EXPO_PUBLIC_COORDINATE_ORDER ?? 'lat_lng';

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

async function requestJson<T>(path: string): Promise<T> {
  const sessionToken = getAccessToken();
  const tokenToUse = sessionToken ?? API_TOKEN;

  if (!tokenToUse) {
    throw new Error('Falta EXPO_PUBLIC_API_TOKEN para consultar reportes protegidos.');
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${tokenToUse}`,
    },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = payload?.message ?? `Error HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}

export async function fetchActiveIncidents(): Promise<Incident[]> {
  const netState = await NetInfo.fetch();

  if (!netState.isConnected || netState.isInternetReachable === false) {
    throw new ConnectivityError('Sin conexion a internet. Mostrando mapa sin reportes.');
  }

  const payload = await requestJson<ApiListResponse>('/reporte');
  return payload.data.map(mapApiReportToIncident);
}

export async function fetchIncidentDetailById(id: string): Promise<Incident> {
  const netState = await NetInfo.fetch();

  if (!netState.isConnected || netState.isInternetReachable === false) {
    throw new ConnectivityError('Sin conexion. No se pudo cargar el detalle del reporte.');
  }

  const payload = await requestJson<ApiDetailResponse>(`/reporte/${id}`);
  return mapApiReportToIncident(payload.data);
}
