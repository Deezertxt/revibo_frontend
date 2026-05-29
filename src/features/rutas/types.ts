export type RouteType = 'carretera_nueva' | 'carretera_antigua' | 'alternativa';

export type RouteCoordinate = {
  latitude: number;
  longitude: number;
};

export type SavedRoute = {
  id: string;
  name: string;
  stops: string[];
  summary: string;
  routeType: RouteType;
  distanceKm: number;
  coordinates: RouteCoordinate[];
  createdAt: string;
  updatedAt: string;
};

export type RouteDraft = {
  name: string;
  stops: string[];
  routeType: RouteType;
};

export const ROUTE_STOP_COLORS = {
  origin: '#5B3FD9',
  middle: '#D97706',
  destination: '#0E9F6E',
  extra: '#7C3AED',
} as const;

export function normalizeRouteStops(stops: string[]): string[] {
  return stops.map((stop) => stop.trim()).filter((stop) => stop.length > 0);
}

export function buildRouteSummary(stops: string[]): string {
  return normalizeRouteStops(stops).join(' · ');
}

export function formatRouteDistance(distanceKm: number): string {
  return `${Math.round(distanceKm)} km`;
}
