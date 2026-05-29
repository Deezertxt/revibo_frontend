import { buildRoutePreview } from '@/features/rutas/services/rutas.service';
import { buildRouteSummary, type RouteCoordinate, type RouteDraft, type SavedRoute } from '@/features/rutas/types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL.trim()}/api/v1`
  : 'https://revibo-backend.onrender.com/api/v1';

const API_URL = BASE_URL.replace(/\/$/, '');

type BackendRouteGeometry = {
  type?: string;
  coordinates?: Array<[number, number]>;
} | string | null | undefined;

type BackendRouteResource = {
  id_ruta: string;
  nombre?: string | null;
  distancia_km?: number | string | null;
  tiempo_seg?: number | string | null;
  nombre_origen?: string | null;
  nombre_destino?: string | null;
  geom_ruta?: BackendRouteGeometry;
  geom_Json?: BackendRouteGeometry;
};

type BackendResponse<T> = {
  message?: string;
  data?: T;
};

function parseGeometry(rawGeometry: BackendRouteGeometry): Array<[number, number]> {
  if (!rawGeometry) {
    return [];
  }

  const geometry = typeof rawGeometry === 'string' ? (() => {
    try {
      return JSON.parse(rawGeometry) as { coordinates?: Array<[number, number]> };
    } catch {
      return null;
    }
  })() : rawGeometry;

  if (geometry && typeof geometry === 'object' && Array.isArray(geometry.coordinates)) {
    return geometry.coordinates;
  }

  return [];
}

function toCoordinates(rawCoordinates: Array<[number, number]>): RouteCoordinate[] {
  return rawCoordinates.map(([longitude, latitude]) => ({ latitude, longitude }));
}

function toSavedRoute(resource: BackendRouteResource, fallback: Partial<SavedRoute> = {}): SavedRoute {
  const origin = resource.nombre_origen?.trim() || 'Origen';
  const destination = resource.nombre_destino?.trim() || 'Destino';
  const summaryStops = fallback.stops?.length ? fallback.stops : [origin, destination];
  const geometry = parseGeometry(resource.geom_ruta ?? resource.geom_Json);
  const coordinates = geometry.length > 0 ? toCoordinates(geometry) : fallback.coordinates ?? [];
  const createdAt = fallback.createdAt ?? new Date().toISOString();
  const updatedAt = fallback.updatedAt ?? createdAt;

  return {
    id: resource.id_ruta,
    name: resource.nombre?.trim() || fallback.name || `${origin} → ${destination}`,
    stops: summaryStops,
    summary: buildRouteSummary(summaryStops),
    routeType: fallback.routeType ?? 'alternativa',
    distanceKm: Number(resource.distancia_km ?? fallback.distanceKm ?? 0),
    coordinates,
    createdAt,
    updatedAt,
  };
}

export async function loadRoutesFromBackend(
  token: string,
  currentRoutes: SavedRoute[] = [],
): Promise<SavedRoute[]> {
  const response = await fetch(`${API_URL}/rutas/me`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const responseBody = (await response.json().catch(() => null)) as BackendResponse<BackendRouteResource[] | BackendRouteResource> | null;

  if (!response.ok) {
    throw new Error(responseBody?.message ?? 'No se pudieron cargar las rutas.');
  }

  const routes = Array.isArray(responseBody?.data) ? responseBody.data : [];

  return routes.map((resource) => {
    const fallbackRoute = currentRoutes.find((route) => route.id === resource.id_ruta);
    return toSavedRoute(resource, fallbackRoute);
  });
}

export async function createRouteOnBackend(
  token: string,
  draft: RouteDraft,
  preview: Awaited<ReturnType<typeof buildRoutePreview>>,
): Promise<SavedRoute> {
  const normalizedStops = draft.stops
    .map((stop: string) => stop.trim())
    .filter((stop: string) => stop.length > 0);
  const routeCoordinates = preview.coordinates.length > 1
    ? preview.coordinates
    : preview.coordinates.length === 1
      ? [preview.coordinates[0], preview.coordinates[0]]
      : [];

  if (routeCoordinates.length < 2) {
    throw new Error('No se pudo calcular la geometría de la ruta.');
  }

  const response = await fetch(`${API_URL}/rutas/me`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre: draft.name.trim(),
      distancia: Math.max(1, Math.round(preview.distanceKm)),
      tiempo: Math.max(1, Math.round((preview.distanceKm / 40) * 3600)),
      origen_nombre: normalizedStops[0] ?? draft.name.trim(),
      destino_nombre: normalizedStops[normalizedStops.length - 1] ?? draft.name.trim(),
      ruta: {
        type: 'LineString',
        coordinates: routeCoordinates.map(({ latitude, longitude }) => [longitude, latitude]),
      },
    }),
  });

  const responseBody = (await response.json().catch(() => null)) as BackendResponse<BackendRouteResource> | null;

  if (!response.ok || !responseBody?.data) {
    throw new Error(responseBody?.message ?? 'No se pudo guardar la ruta en el backend.');
  }

  return toSavedRoute(responseBody.data, {
    name: draft.name.trim(),
    stops: normalizedStops,
    summary: buildRouteSummary(normalizedStops),
    routeType: draft.routeType,
    distanceKm: preview.distanceKm,
    coordinates: preview.coordinates,
  });
}