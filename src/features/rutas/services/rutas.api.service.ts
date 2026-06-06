import { buildRoutePreview } from '@/features/rutas/services/rutas.service';
import { summarizeRouteMarkers, type RouteCoordinate, type RouteDraft, type SavedRoute } from '@/features/rutas/types';
import { useAuthStore } from '@/shared/store/useAuthStore';

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

function deriveMarkerCoordinates(coordinates: RouteCoordinate[]): RouteCoordinate[] {
  if (coordinates.length <= 2) {
    return coordinates;
  }

  const middleIndex = Math.floor(coordinates.length / 2);
  const markers = [coordinates[0], coordinates[middleIndex], coordinates[coordinates.length - 1]];

  return markers.filter((coordinate, index, all) => {
    const previousIndex = all.findIndex(
      (candidate) => candidate.latitude === coordinate.latitude && candidate.longitude === coordinate.longitude,
    );

    return previousIndex === index;
  });
}

function toSavedRoute(resource: BackendRouteResource, fallback: Partial<SavedRoute> = {}): SavedRoute {
  const origin = resource.nombre_origen?.trim() || 'Origen';
  const destination = resource.nombre_destino?.trim() || 'Destino';
  const geometry = parseGeometry(resource.geom_ruta ?? resource.geom_Json);
  const coordinates = geometry.length > 0 ? toCoordinates(geometry) : fallback.coordinates ?? [];
  const markerCoordinates = fallback.markerCoordinates?.length
    ? fallback.markerCoordinates
    : deriveMarkerCoordinates(coordinates);
  const createdAt = fallback.createdAt ?? new Date().toISOString();
  const updatedAt = fallback.updatedAt ?? createdAt;

  return {
    id: resource.id_ruta,
    name: resource.nombre?.trim() || fallback.name || `${origin} → ${destination}`,
    summary: fallback.summary ?? summarizeRouteMarkers(markerCoordinates),
    routeType: fallback.routeType ?? 'alternativa',
    distanceKm: Number(resource.distancia_km ?? fallback.distanceKm ?? 0),
    markerCoordinates,
    coordinates,
    createdAt,
    updatedAt,
  };
}

export async function loadRoutesFromBackend(
  token: string,
  currentRoutes: SavedRoute[] = [],
): Promise<SavedRoute[]> {
  const userId = useAuthStore.getState().user?.id_usuario;

  if (!userId) {
    return currentRoutes;
  }

  const response = await fetch(`${API_URL}/rutas`, {
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
  const userId = useAuthStore.getState().user?.id_usuario;

  if (!userId) {
    throw new Error('Necesitas iniciar sesión para guardar una ruta.');
  }

  const routeCoordinates = preview.coordinates.length > 1
    ? preview.coordinates
    : preview.coordinates.length === 1
      ? [preview.coordinates[0], preview.coordinates[0]]
      : [];

  if (routeCoordinates.length < 2) {
    throw new Error('No se pudo calcular la geometría de la ruta.');
  }

  const originCoordinate = routeCoordinates[0];
  const destinationCoordinate = routeCoordinates[routeCoordinates.length - 1];

  const response = await fetch(`${API_URL}/rutas`, {
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
      origen_nombre: 'Marcador inicial',
      destino_nombre: 'Marcador final',
      origen_lat: originCoordinate.latitude,
      origen_lng: originCoordinate.longitude,
      destino_lat: destinationCoordinate.latitude,
      destino_lng: destinationCoordinate.longitude,
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
    summary: summarizeRouteMarkers(draft.markerCoordinates),
    routeType: draft.routeType,
    distanceKm: preview.distanceKm,
    markerCoordinates: draft.markerCoordinates,
    coordinates: preview.coordinates,
  });
}

export async function updateRouteOnBackend(
  token: string,
  routeId: string,
  draft: RouteDraft,
  preview: Awaited<ReturnType<typeof buildRoutePreview>>,
  fallbackRoute?: SavedRoute,
): Promise<SavedRoute> {
  const userId = useAuthStore.getState().user?.id_usuario;

  if (!userId) {
    throw new Error('Necesitas iniciar sesión para actualizar una ruta.');
  }

  const routeCoordinates = preview.coordinates.length > 1
    ? preview.coordinates
    : preview.coordinates.length === 1
      ? [preview.coordinates[0], preview.coordinates[0]]
      : [];

  if (routeCoordinates.length < 2) {
    throw new Error('No se pudo calcular la geometría de la ruta.');
  }

  const originCoordinate = routeCoordinates[0];
  const destinationCoordinate = routeCoordinates[routeCoordinates.length - 1];

  const response = await fetch(`${API_URL}/rutas/${routeId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      nombre: draft.name.trim(),
      distancia: Math.max(1, Math.round(preview.distanceKm)),
      tiempo: Math.max(1, Math.round((preview.distanceKm / 40) * 3600)),
      origen_nombre: 'Marcador inicial',
      destino_nombre: 'Marcador final',
      origen_lat: originCoordinate.latitude,
      origen_lng: originCoordinate.longitude,
      destino_lat: destinationCoordinate.latitude,
      destino_lng: destinationCoordinate.longitude,
      ruta: {
        type: 'LineString',
        coordinates: routeCoordinates.map(({ latitude, longitude }) => [longitude, latitude]),
      },
    }),
  });

  const responseBody = (await response.json().catch(() => null)) as BackendResponse<BackendRouteResource> | null;

  if (!response.ok || !responseBody?.data) {
    throw new Error(responseBody?.message ?? 'No se pudo actualizar la ruta en el backend.');
  }

  return toSavedRoute(responseBody.data, {
    id: routeId,
    name: draft.name.trim(),
    summary: summarizeRouteMarkers(draft.markerCoordinates),
    routeType: draft.routeType,
    distanceKm: preview.distanceKm,
    markerCoordinates: draft.markerCoordinates,
    coordinates: preview.coordinates,
    createdAt: fallbackRoute?.createdAt,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteRouteOnBackend(token: string, routeId: string): Promise<void> {
  const response = await fetch(`${API_URL}/rutas/${routeId}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const responseBody = (await response.json().catch(() => null)) as BackendResponse<null> | null;

  if (!response.ok) {
    throw new Error(responseBody?.message ?? 'No se pudo eliminar la ruta en el backend.');
  }
}