import { create } from 'zustand';

import {
    buildRoutePreview,
    type RouteDraft,
} from '@/features/rutas/services/rutas.service';
import {
    buildRouteSummary,
    type SavedRoute,
} from '@/features/rutas/types';

type RoutesState = {
  routes: SavedRoute[];
  selectedRouteId: string | null;
  setSelectedRouteId: (routeId: string | null) => void;
  createRoute: (draft: RouteDraft) => Promise<SavedRoute>;
  updateRoute: (routeId: string, draft: RouteDraft) => Promise<SavedRoute | null>;
  deleteRoute: (routeId: string) => void;
  getRouteById: (routeId: string) => SavedRoute | undefined;
};

const now = new Date().toISOString();

const seedRoutes: SavedRoute[] = [
  {
    id: 'route-cocha-scz',
    name: 'Cochabamba → Santa Cruz',
    stops: ['Cochabamba', 'Paracti', 'Corani', 'Santa Cruz'],
    summary: 'Cochabamba · Paracti · Corani · Santa Cruz',
    routeType: 'carretera_nueva',
    distanceKm: 478,
    coordinates: [
      { latitude: -17.3895, longitude: -66.1568 },
      { latitude: -17.45, longitude: -65.45 },
      { latitude: -17.73, longitude: -64.31 },
      { latitude: -17.7833, longitude: -63.1821 },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'route-cocha-lpz',
    name: 'Cochabamba → La Paz',
    stops: ['Cochabamba', 'Caracollo', 'La Paz'],
    summary: 'Cochabamba · Caracollo · La Paz',
    routeType: 'carretera_antigua',
    distanceKm: 392,
    coordinates: [
      { latitude: -17.3895, longitude: -66.1568 },
      { latitude: -17.665, longitude: -66.35 },
      { latitude: -16.4897, longitude: -68.1193 },
    ],
    createdAt: now,
    updatedAt: now,
  },
];

export const useRoutesStore = create<RoutesState>((set, get) => ({
  routes: seedRoutes,
  selectedRouteId: null,
  setSelectedRouteId: (routeId) => set({ selectedRouteId: routeId }),
  createRoute: async (draft) => {
    const preview = await buildRoutePreview(draft);
    const currentDate = new Date().toISOString();
    const routeId = `route-${Date.now()}`;
    const storedRoute: SavedRoute = {
      id: routeId,
      name: draft.name.trim(),
      stops: draft.stops.map((stop) => stop.trim()).filter((stop) => stop.length > 0),
      summary: buildRouteSummary(draft.stops),
      routeType: draft.routeType,
      distanceKm: preview.distanceKm,
      coordinates: preview.coordinates,
      createdAt: currentDate,
      updatedAt: currentDate,
    };

    set((state) => ({
      routes: [storedRoute, ...state.routes],
      selectedRouteId: routeId,
    }));

    return storedRoute;
  },
  updateRoute: async (routeId, draft) => {
    const preview = await buildRoutePreview(draft);
    const currentDate = new Date().toISOString();
    let updatedRoute: SavedRoute | null = null;

    set((state) => ({
      routes: state.routes.map((route) => {
        if (route.id !== routeId) {
          return route;
        }

        updatedRoute = {
          ...route,
          name: draft.name.trim(),
          stops: draft.stops.map((stop) => stop.trim()).filter((stop) => stop.length > 0),
          summary: buildRouteSummary(draft.stops),
          routeType: draft.routeType,
          distanceKm: preview.distanceKm,
          coordinates: preview.coordinates,
          updatedAt: currentDate,
        };

        return updatedRoute;
      }),
    }));

    return updatedRoute;
  },
  deleteRoute: (routeId) =>
    set((state) => ({
      routes: state.routes.filter((route) => route.id !== routeId),
      selectedRouteId: state.selectedRouteId === routeId ? null : state.selectedRouteId,
    })),
  getRouteById: (routeId) => get().routes.find((route) => route.id === routeId),
}));
