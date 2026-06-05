export type RouteType = 'carretera_nueva' | 'carretera_antigua' | 'alternativa';

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type SavedRoute = {
  id: string;
  name: string;
  summary: string;
  routeType: RouteType;
  distanceKm: number;
  markerCoordinates: RouteCoordinate[];
  coordinates: RouteCoordinate[];
  createdAt: string;
  updatedAt: string;
};

export type RouteDraft = {
  name: string;
  routeType: RouteType;
  markerCoordinates: RouteCoordinate[];
};

export const ROUTE_STOP_COLORS = {
  origin: '#5B3FD9',
  middle: '#D97706',
  destination: '#0E9F6E',
  extra: '#7C3AED',
} as const;

export function summarizeRouteMarkers(markerCoordinates: RouteCoordinate[]): string {
  const markerCount = markerCoordinates.length;

  if (markerCount === 0) {
    return 'Sin marcadores';
  }

  return `${markerCount} marcador${markerCount === 1 ? '' : 'es'}`;
}

export function formatRouteDistance(distanceKm: number): string {
  return `${Math.round(distanceKm)} km`;
}
