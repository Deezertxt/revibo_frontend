import { create } from 'zustand';

import {
  createRouteOnBackend,
  deleteRouteOnBackend,
  loadRoutesFromBackend,
  updateRouteOnBackend,
} from '@/features/rutas/services/rutas.api.service';
import {
  buildRoutePreview,
} from '@/features/rutas/services/rutas.service';
import {
  type RouteDraft,
  type SavedRoute,
} from '@/features/rutas/types';
import { getAccessToken } from '@/shared/store/authStore';

type RoutesState = {
  routes: SavedRoute[];
  selectedRouteId: string | null;
  isLoading: boolean;
  loadRoutes: () => Promise<void>;
  setSelectedRouteId: (routeId: string | null) => void;
  resetRoutes: () => void;
  createRoute: (draft: RouteDraft) => Promise<SavedRoute>;
  updateRoute: (routeId: string, draft: RouteDraft) => Promise<SavedRoute>;
  deleteRoute: (routeId: string) => Promise<void>;
  getRouteById: (routeId: string) => SavedRoute | undefined;
};

export const useRoutesStore = create<RoutesState>((set, get) => ({
  routes: [],
  selectedRouteId: null,
  isLoading: false,
  loadRoutes: async () => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    set({ isLoading: true });

    try {
      const backendRoutes = await loadRoutesFromBackend(token, get().routes);

      set({ routes: backendRoutes });
    } finally {
      set({ isLoading: false });
    }
  },
  setSelectedRouteId: (routeId) => set({ selectedRouteId: routeId }),
  resetRoutes: () =>
    set({
      routes: [],
      selectedRouteId: null,
      isLoading: false,
    }),
  createRoute: async (draft) => {
    const preview = await buildRoutePreview(draft);
    const token = getAccessToken();

    if (!token) {
      throw new Error('Necesitas iniciar sesión para guardar una ruta.');
    }

    const storedRoute = await createRouteOnBackend(token, draft, preview);

    set((state) => ({
      routes: [storedRoute, ...state.routes],
      selectedRouteId: storedRoute.id,
    }));

    return storedRoute;
  },
  updateRoute: async (routeId, draft) => {
    const token = getAccessToken();

    if (!token) {
      throw new Error('Necesitas iniciar sesión para actualizar una ruta.');
    }

    const preview = await buildRoutePreview(draft);
    const currentRoute = get().routes.find((route) => route.id === routeId);

    if (!currentRoute) {
      throw new Error('La ruta que quieres editar ya no existe.');
    }

    const updatedRoute = await updateRouteOnBackend(token, routeId, draft, preview, currentRoute);

    set((state) => ({
      routes: state.routes.map((route) => (route.id === routeId ? updatedRoute : route)),
    }));

    return updatedRoute;
  },
  deleteRoute: async (routeId) => {
    const token = getAccessToken();

    if (!token) {
      throw new Error('Necesitas iniciar sesión para eliminar una ruta.');
    }

    await deleteRouteOnBackend(token, routeId);

    set((state) => ({
      routes: state.routes.filter((route) => route.id !== routeId),
      selectedRouteId: state.selectedRouteId === routeId ? null : state.selectedRouteId,
    }));
  },
  getRouteById: (routeId) => get().routes.find((route) => route.id === routeId),
}));
