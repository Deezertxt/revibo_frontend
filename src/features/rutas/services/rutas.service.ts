import type { RouteCoordinate, RouteDraft } from '@/features/rutas/types';

function haversineDistanceKm(from: RouteCoordinate, to: RouteCoordinate): number {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const latitude1 = toRadians(from.latitude);
  const latitude2 = toRadians(to.latitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.sin(deltaLongitude / 2) ** 2 * Math.cos(latitude1) * Math.cos(latitude2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

async function getRouteSegment(
  origin: RouteCoordinate,
  destination: RouteCoordinate,
): Promise<{ coordinates: RouteCoordinate[]; distanceKm: number }> {
  const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  const payload = await response.json().catch(() => null);

  if (response.ok && payload?.routes?.length > 0) {
    const route = payload.routes[0];
    const coordinates = (route.geometry.coordinates as number[][]).map((point) => ({
      latitude: point[1],
      longitude: point[0],
    }));

    return {
      coordinates,
      distanceKm: route.distance / 1000,
    };
  }

  return {
    coordinates: [origin, destination],
    distanceKm: haversineDistanceKm(origin, destination),
  };
}

export async function buildRoutePreview(draft: RouteDraft): Promise<{
  coordinates: RouteCoordinate[];
  distanceKm: number;
}> {
  const markerCoordinates = draft.markerCoordinates.filter((coordinate) =>
    Number.isFinite(coordinate.latitude) && Number.isFinite(coordinate.longitude),
  );

  if (markerCoordinates.length < 2) {
    return {
      coordinates: markerCoordinates,
      distanceKm: 0,
    };
  }

  const assembledCoordinates: RouteCoordinate[] = [];
  let totalDistanceKm = 0;

  for (let index = 0; index < markerCoordinates.length - 1; index += 1) {
    const origin = markerCoordinates[index];
    const destination = markerCoordinates[index + 1];
    const segment = await getRouteSegment(origin, destination);

    totalDistanceKm += segment.distanceKm;

    if (assembledCoordinates.length === 0) {
      assembledCoordinates.push(...segment.coordinates);
    } else {
      assembledCoordinates.push(...segment.coordinates.slice(1));
    }
  }

  return {
    coordinates: assembledCoordinates,
    distanceKm: totalDistanceKm,
  };
}
