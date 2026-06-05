import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildRoutePreview } from '@/features/rutas/services/rutas.service';
import { useRoutesStore } from '@/features/rutas/store/rutasStore';
import {
  ROUTE_STOP_COLORS,
  formatRouteDistance,
  type RouteCoordinate,
  type RouteDraft,
  type SavedRoute,
} from '@/features/rutas/types';
import { useAuthStore } from '@/shared/store/useAuthStore';

type ScreenMode = 'list' | 'create' | 'edit';

type SearchParams = {
  mode?: string | string[];
  routeId?: string | string[];
  incidentId?: string | string[];
  incidentLat?: string | string[];
  incidentLng?: string | string[];
};

const PRIMARY = '#5B3FD9';
const BACKGROUND = '#F4F1FF';
const SURFACE = '#FFFFFF';
const TEXT_MAIN = '#2F2B3A';
const TEXT_MUTED = '#7D7891';
const DEFAULT_MAP_REGION: Region = {
  latitude: -17.3935,
  longitude: -66.157,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

const DEFAULT_MAP_COORDINATE: RouteCoordinate = {
  latitude: DEFAULT_MAP_REGION.latitude,
  longitude: DEFAULT_MAP_REGION.longitude,
};

export default function RutasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<SearchParams>();
  const accessToken = useAuthStore((state) => state.accessToken);
  const userId = useAuthStore((state) => state.user?.id_usuario);

  const routes = useRoutesStore((state) => state.routes);
  const isLoading = useRoutesStore((state) => state.isLoading);
  const loadRoutes = useRoutesStore((state) => state.loadRoutes);
  const createRoute = useRoutesStore((state) => state.createRoute);
  const updateRoute = useRoutesStore((state) => state.updateRoute);
  const deleteRoute = useRoutesStore((state) => state.deleteRoute);

  useEffect(() => {
    if (!accessToken || !userId) {
      return;
    }

    void loadRoutes().catch(() => undefined);
  }, [accessToken, loadRoutes, userId]);

  const routeId = firstParam(params.routeId);
  const mode = firstParam(params.mode);
  const incidentId = firstParam(params.incidentId);
  const incidentLat = firstParam(params.incidentLat);
  const incidentLng = firstParam(params.incidentLng);

  const activeRoute = useMemo(
    () => routes.find((route) => route.id === routeId),
    [routeId, routes],
  );

  const screenMode: ScreenMode =
    mode === 'create'
      ? 'create'
      : mode === 'edit' && activeRoute
        ? 'edit'
        : 'list';

  const canCreateRoutes = Boolean(accessToken && userId);

  useEffect(() => {
    if (screenMode === 'create' && !canCreateRoutes) {
      router.replace('/(tabs)/perfil');
    }
  }, [canCreateRoutes, router, screenMode]);

  const openCreateForm = () => {
    if (!canCreateRoutes) {
      router.push('/(tabs)/perfil');
      return;
    }

    router.push({ pathname: '/(tabs)/rutas', params: { mode: 'create' } });
  };

  const openEditForm = (route: SavedRoute) => {
    router.push({
      pathname: '/(tabs)/rutas',
      params: { mode: 'edit', routeId: route.id },
    });
  };

  const handleNavigateRoute = (route: SavedRoute) => {
    useRoutesStore.setState({ selectedRouteId: route.id });

    router.push({
      pathname: '/(tabs)',
      params: { routeId: route.id },
    });
  };

  const handleDeleteRoute = (route: SavedRoute) => {
    Alert.alert(
      'Eliminar ruta',
      `¿Quieres eliminar ${route.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            void deleteRoute(route.id).catch((error) => {
              Alert.alert(
                'No se pudo eliminar',
                error instanceof Error ? error.message : 'Intenta nuevamente.',
              );
            });
          },
        },
      ],
    );
  };

  if (isLoading) {
    return <LoadingScreen topInset={insets.top} />;
  }

  if (screenMode === 'create' || screenMode === 'edit') {
    if (screenMode === 'create' && !canCreateRoutes) {
      return <LoadingScreen topInset={insets.top} />;
    }

    return (
      <RouteFormScreen
        mode={screenMode}
        route={screenMode === 'edit' ? activeRoute : undefined}
        onBack={() => router.replace('/(tabs)/rutas')}
        onSave={async (draft) => {
          if (screenMode === 'edit' && activeRoute) {
            await updateRoute(activeRoute.id, draft);
          } else {
            await createRoute(draft);
          }

          router.replace('/(tabs)/rutas');
        }}
      />
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: PRIMARY }]}> 
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>NAVEGACIÓN</Text>
        <Text style={styles.headerTitle}>Rutas</Text>
        <Text style={styles.headerSubtitle}>Gestioná y creá tus rutas</Text>
      </View>

      <ScrollView
        style={[styles.body, { backgroundColor: SURFACE }]}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: insets.bottom + 18 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={openCreateForm} style={styles.createCard}>
          <View style={styles.createIconWrap}>
            <MaterialIcons name="alt-route" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.createTextWrap}>
            <Text style={styles.createTitle}>Crear ruta personalizada</Text>
            <Text style={styles.createSubtitle}>Definí origen, destino y paradas</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#8A86A3" />
        </Pressable>

        {incidentId ? (
          <View style={styles.contextCard}>
            <Text style={styles.contextLabel}>Contexto activo</Text>
            <Text style={styles.contextTitle}>Ruta sugerida para incidente {incidentId}</Text>
            <Text style={styles.contextSubtitle}>
              Zona excluida: {incidentLat ?? '-'}, {incidentLng ?? '-'}
            </Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rutas guardadas</Text>
          <Text style={styles.sectionCount}>· {routes.length}</Text>
        </View>

        <View style={styles.cardsList}>
          {routes.length === 0 ? (
            <EmptyState onCreate={openCreateForm} />
          ) : (
            routes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                onEdit={() => openEditForm(route)}
                onNavigate={() => handleNavigateRoute(route)}
                onDelete={() => handleDeleteRoute(route)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function RouteFormScreen({
  mode,
  route,
  onBack,
  onSave,
}: {
  mode: ScreenMode;
  route?: SavedRoute;
  onBack: () => void;
  onSave: (draft: RouteDraft) => Promise<void>;
}) {
  const insets = useSafeAreaInsets();
  const isEditMode = mode === 'edit';
  const [name, setName] = useState('');
  const [stops, setStops] = useState<string[]>(['', '']);
  const [externalOriginCoord, setExternalOriginCoord] = useState<RouteCoordinate | null>(null);
  const [externalOriginLabel, setExternalOriginLabel] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (route) {
      setName(route.name);
      setStops(
        route.stops.length >= 2
          ? route.stops
          : [...route.stops, ...Array(2 - route.stops.length).fill('')],
      );
      return;
    }

    setName('');
    setStops(['', '']);
  }, [route]);

  const origin = stops[0] ?? '';
  const destination = stops[stops.length - 1] ?? '';
  const waypoints = stops.slice(1, -1);

  const canSave =
    name.trim().length > 0 &&
    origin.trim().length > 0 &&
    destination.trim().length > 0;

  const updateStop = (index: number, value: string) => {
    setStops((currentStops) =>
      currentStops.map((stop, stopIndex) => (stopIndex === index ? value : stop)),
    );
  };

  const updateOrigin = (value: string) => {
    updateStop(0, value);
  };

  const useMyLocation = async () => {
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        Alert.alert('Permiso denegado', 'Habilitá permiso de ubicación para usar esta función.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coord: RouteCoordinate = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      const label = await reverseGeocodeCoordinate(coord);

      if (label) {
        updateOrigin(label);
      }

      setExternalOriginLabel(label ?? undefined);
      setExternalOriginCoord(coord);
    } catch (err) {
      Alert.alert('No se pudo obtener ubicación', 'Intenta nuevamente.');
    }
  };

  const updateWaypoint = (index: number, value: string) => {
    updateStop(index + 1, value);
  };

  const updateDestination = (value: string) => {
    updateStop(stops.length - 1, value);
  };

  const addStop = () => {
    setStops((currentStops) => [
      ...currentStops.slice(0, -1),
      '',
      currentStops[currentStops.length - 1] ?? '',
    ]);
  };

  const removeStop = (index: number) => {
    setStops((currentStops) => currentStops.filter((_, stopIndex) => stopIndex !== index));
  };

  const handleSave = async () => {
    if (!canSave) {
      setErrorMessage('Completá el nombre, origen y destino.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      await onSave({
        name,
        routeType: 'carretera_nueva',
        stops: stops.map((stop) => stop.trim()).filter((stop) => stop.length > 0),
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la ruta.');
    } finally {
      setSaving(false);
    }
  };

  const routeCoordinates = route?.coordinates ?? [];

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.formScroll, { paddingBottom: insets.bottom + 104 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.formHeader, { paddingTop: insets.top + 10 }]}> 
          <View style={styles.formHeaderTopRow}>
            <Pressable onPress={onBack} style={styles.backIconButton}>
              <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>

            <View style={styles.formHeaderCopy}>
              <Text style={styles.formEyebrow}>RUTAS</Text>
              <Text style={styles.formTitle}>{isEditMode ? 'Editar ruta' : 'Nueva ruta'}</Text>
              <Text style={styles.formSubtitle}>
                {isEditMode ? 'Ajustá los datos de la ruta' : 'Completá los datos'}
              </Text>
            </View>

            <Pressable onPress={onBack} style={styles.backButton}>
              <Text style={styles.backButtonText}>Volver</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.formCard}>
          <FieldLabel text="Nombre de la ruta" />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={isEditMode ? 'Cochabamba → Santa Cruz' : 'Ej: Ruta semanal al trabajo'}
            placeholderTextColor="#8F8F8F"
            style={styles.darkInput}
          />

          <RouteMapEditor
            stops={stops}
            routeCoordinates={routeCoordinates}
            onStopChange={(index, value) => updateStop(index, value)}
            externalOriginCoord={externalOriginCoord}
            externalOriginLabel={externalOriginLabel}
          />

          <FieldLabel text="Origen" />
          <RouteStopRow
            index={0}
            value={origin}
            kind="origin"
            onChange={updateOrigin}
            placeholder="Ingresá el punto de partida"
          />

          <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
            <Pressable onPress={useMyLocation} style={styles.useLocationButton}>
              <MaterialIcons name="my-location" size={16} color={PRIMARY} />
              <Text style={styles.useLocationText}>Usar mi ubicación</Text>
            </Pressable>
          </View>

          <View style={styles.waypointHeaderRow}>
            <FieldLabel text="Paradas intermedias" />
            <Pressable onPress={addStop} style={styles.addWaypointButton}>
              <MaterialIcons name="flag" size={14} color="#5B3FD9" />
              <Text style={styles.addWaypointButtonText}>Agregar banderita</Text>
            </Pressable>
          </View>

          <View style={styles.stopsGroup}>
            {waypoints.length === 0 ? (
              <View style={styles.emptyWaypointsCard}>
                <MaterialIcons name="flag" size={18} color="#5B3FD9" />
                <Text style={styles.emptyWaypointsText}>Podés agregar una o más banderitas para marcar calles o desvíos.</Text>
              </View>
            ) : waypoints.map((stop, index) => (
              <RouteStopRow
                key={`stop-${index}`}
                index={index + 1}
                value={stop}
                kind="waypoint"
                onChange={(value) => updateWaypoint(index, value)}
                onRemove={() => removeStop(index + 1)}
                placeholder={getStopPlaceholder(index + 1, stops.length)}
              />
            ))}
          </View>

          <FieldLabel text="Destino" />
          <RouteStopRow
            index={stops.length - 1}
            value={destination}
            kind="destination"
            onChange={updateDestination}
            placeholder="Ingresá el destino final"
          />

          <Pressable onPress={addStop} style={styles.addStopButton}>
            <MaterialIcons name="add-location-alt" size={18} color="#5B3FD9" />
            <Text style={styles.addStopButtonText}>Agregar otra banderita</Text>
          </Pressable>
          <Pressable
            onPress={handleSave}
            disabled={!canSave || saving}
            style={({ pressed }) => [
              styles.confirmRouteButton,
              !canSave && styles.confirmRouteButtonDisabled,
              pressed && !(!canSave || saving) && styles.confirmRouteButtonPressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color={PRIMARY} />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialIcons name="check" size={18} color={PRIMARY} />
                <Text style={styles.confirmRouteButtonText}>Guardar ruta</Text>
              </View>
            )}
          </Pressable>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <View style={{ marginTop: 8 }}>
            <Pressable onPress={useMyLocation} style={styles.useLocationButtonSecondary}>
              <MaterialIcons name="my-location" size={16} color={PRIMARY} />
              <Text style={styles.useLocationTextSecondary}>Usar mi ubicación como origen</Text>
            </Pressable>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RouteMapEditor({
  stops,
  routeCoordinates,
  onStopChange,
  externalOriginCoord,
  externalOriginLabel,
}: {
  stops: string[];
  routeCoordinates: RouteCoordinate[];
  onStopChange: (index: number, value: string) => void;
  externalOriginCoord?: RouteCoordinate | null;
  externalOriginLabel?: string | undefined;
}) {
  const mapRef = useRef<MapView | null>(null);
  const [markerCoordinates, setMarkerCoordinates] = useState<Array<RouteCoordinate | null>>([]);
  const markerCoordinatesRef = useRef<Array<RouteCoordinate | null>>([]);
  const seededFromRouteRef = useRef(false);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [routePreviewCoordinates, setRoutePreviewCoordinates] = useState<RouteCoordinate[]>([]);
  const [routeDistanceLabel, setRouteDistanceLabel] = useState<string | null>(null);
  

  useEffect(() => {
    markerCoordinatesRef.current = markerCoordinates;
  }, [markerCoordinates]);

  

  useEffect(() => {
    setMarkerCoordinates((current) => {
      const next = [...current];
      const baseCoordinate = next[0] ?? routeCoordinates[0] ?? DEFAULT_MAP_COORDINATE;

      while (next.length < stops.length) {
        const newIndex = next.length;

        if (newIndex === 0) {
          next.push(baseCoordinate ?? null);
          continue;
        }

        const previousCoordinate = next[newIndex - 1] ?? baseCoordinate;
        next.push(previousCoordinate ? offsetCoordinate(previousCoordinate, newIndex) : null);
      }

      if (next.length > stops.length) {
        next.length = stops.length;
      }

      return next;
    });
  }, [routeCoordinates, stops.length]);

  useEffect(() => {
    if (routeCoordinates.length === stops.length && routeCoordinates.length > 0 && !seededFromRouteRef.current) {
      setMarkerCoordinates(routeCoordinates);
      seededFromRouteRef.current = true;
    }
  }, [routeCoordinates, stops.length]);

  

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      const trimmedStops = stops.map((stop) => stop.trim());

      setLoadingPreview(true);

      const resolved = await Promise.all(
        trimmedStops.map(async (stop, index) => {
          if (!stop) {
            return markerCoordinatesRef.current[index] ?? null;
          }

          const coordinate = await geocodeStop(stop);
          return coordinate ?? markerCoordinatesRef.current[index] ?? null;
        }),
      );

      if (cancelled) {
        return;
      }

      setMarkerCoordinates(resolved);
      setLoadingPreview(false);

      const validCoordinates = resolved.filter((coordinate): coordinate is RouteCoordinate => coordinate !== null);

      if (validCoordinates.length >= 2) {
        mapRef.current?.fitToCoordinates(validCoordinates, {
          edgePadding: {
            top: 80,
            right: 60,
            bottom: 80,
            left: 60,
          },
          animated: true,
        });
      }

      if (trimmedStops.some((s) => s.length > 0)) {
        const preview = await buildRoutePreview({
          name: 'ruta temporal',
          routeType: 'carretera_nueva',
          stops,
        });

        if (cancelled) {
          return;
        }

        setRoutePreviewCoordinates(preview.coordinates);
        setRouteDistanceLabel(
          preview.coordinates.length >= 2 ? `${Math.round(preview.distanceKm)} km aprox.` : null,
        );
      } else {
        // Use marker coordinates directly when user hasn't typed stops
        const coords = validCoordinates;
        setRoutePreviewCoordinates(coords);
        setRouteDistanceLabel(coords.length >= 2 ? `${Math.round(computeDistanceKm(coords))} km aprox.` : null);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [stops]);

  // react to external origin set from parent (use my location)
  useEffect(() => {
    if (!externalOriginCoord) return;

    setMarkerCoordinates((current) => {
      const next = [...current];
      while (next.length < Math.max(stops.length, 1)) {
        next.push(null);
      }

      next[0] = externalOriginCoord;
      return next;
    });

    if (externalOriginLabel) {
      onStopChange(0, externalOriginLabel);
    } else {
      (async () => {
        const label = await reverseGeocodeCoordinate(externalOriginCoord);
        if (label) onStopChange(0, label);
      })();
    }
  }, [externalOriginCoord, externalOriginLabel]);

  // when markers move and user hasn't typed stops, update preview polyline
  useEffect(() => {
    const trimmed = stops.map((s) => s.trim());
    if (trimmed.some((s) => s.length > 0)) return; // prefer textual preview

    const visible = markerCoordinates.filter((c): c is RouteCoordinate => c !== null);
    setRoutePreviewCoordinates(visible);
    setRouteDistanceLabel(visible.length >= 2 ? `${Math.round(computeDistanceKm(visible))} km aprox.` : null);
  }, [markerCoordinates]);

  useEffect(() => {
    let cancelled = false;

    markerCoordinates.forEach((coord, index) => {
      if (!coord) return;
      if ((stops[index] ?? '').trim().length > 0) return; // don't overwrite user input

      (async () => {
        const label = await reverseGeocodeCoordinate(coord);
        if (cancelled) return;
        if (label) {
          onStopChange(index, label);
        }
      })();
    });

    return () => {
      cancelled = true;
    };
  }, [markerCoordinates, stops, onStopChange]);

  const visibleCoordinates = markerCoordinates.filter((coordinate): coordinate is RouteCoordinate => coordinate !== null);
  const mapLineCoordinates =
    routePreviewCoordinates.length > 1
      ? routePreviewCoordinates
      : visibleCoordinates.length > 0
        ? visibleCoordinates
        : routeCoordinates;
  const initialRegion = visibleCoordinates[0]
    ? {
        latitude: visibleCoordinates[0].latitude,
        longitude: visibleCoordinates[0].longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      }
    : DEFAULT_MAP_REGION;

  return (
    <View style={styles.mapEditorCard}>
      <View style={styles.mapEditorHeader}>
        <View>
          <Text style={styles.mapEditorTitle}>Mapa de ruta</Text>
          <Text style={styles.mapEditorSubtitle}>Arrastrá las banderitas para ajustar la ruta por calles específicas.</Text>
          {routeDistanceLabel ? <Text style={styles.mapEditorDistance}>{routeDistanceLabel}</Text> : null}
        </View>
        {loadingPreview ? <ActivityIndicator size="small" color={PRIMARY} /> : null}
      </View>

      <View style={styles.mapPreviewWrap}>
        <MapView
          ref={mapRef}
          style={styles.mapPreview}
          initialRegion={initialRegion}
          showsCompass={false}
          showsMyLocationButton={false}
          scrollEnabled
          zoomEnabled
          rotateEnabled={false}
          pitchEnabled={false}
        >
          {mapLineCoordinates.length > 1 ? (
            <Polyline coordinates={mapLineCoordinates} strokeColor={PRIMARY} strokeWidth={4} />
          ) : null}

          {markerCoordinates.map((coordinate, index) => {
            if (!coordinate) {
              return null;
            }

            const kind =
              index === 0 ? 'origin' : index === markerCoordinates.length - 1 ? 'destination' : 'waypoint';

            return (
              <RouteMapPin
                key={`route-pin-${index}`}
                coordinate={coordinate}
                kind={kind}
                index={index}
                onDragEnd={async (nextCoordinate) => {
                  setMarkerCoordinates((current) => {
                    const updated = [...current];
                    updated[index] = nextCoordinate;
                    return updated;
                  });

                  const label = await reverseGeocodeCoordinate(nextCoordinate);
                  if (label) {
                    onStopChange(index, label);
                  }
                }}
              />
            );
          })}
        </MapView>
      </View>
    </View>
  );
  }

function RouteMapPin({
  coordinate,
  kind,
  index,
  onDragEnd,
}: {
  coordinate: RouteCoordinate;
  kind: 'origin' | 'waypoint' | 'destination';
  index: number;
  onDragEnd: (coordinate: RouteCoordinate) => void;
}) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setTracksViewChanges(false);
    }, 180);

    return () => clearTimeout(timer);
  }, []);

  const color =
    kind === 'origin'
      ? ROUTE_STOP_COLORS.origin
      : kind === 'destination'
        ? ROUTE_STOP_COLORS.destination
        : index === 1
          ? ROUTE_STOP_COLORS.middle
          : ROUTE_STOP_COLORS.extra;

  return (
    <Marker
      coordinate={coordinate}
      draggable
      tracksViewChanges={tracksViewChanges}
      onDragEnd={(event) => onDragEnd(event.nativeEvent.coordinate)}
    >
      <View style={[styles.mapPinWrap, { shadowColor: color }]}>
        <View style={[styles.mapPinBody, { backgroundColor: color }]}>
          <MaterialIcons
            name={kind === 'origin' ? 'my-location' : 'flag'}
            size={18}
            color="#FFFFFF"
          />
        </View>
        <View style={[styles.mapPinTail, { borderTopColor: color }]} />
      </View>
    </Marker>
  );
}

function offsetCoordinate(base: RouteCoordinate, index: number): RouteCoordinate {
  const shift = 0.0025 * index;

  return {
    latitude: base.latitude + shift,
    longitude: base.longitude + shift,
  };
}

function computeDistanceKm(coords: RouteCoordinate[]) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  let total = 0;

  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1];
    const b = coords[i];
    const R = 6371; // km
    const dLat = toRad(b.latitude - a.latitude);
    const dLon = toRad(b.longitude - a.longitude);
    const lat1 = toRad(a.latitude);
    const lat2 = toRad(b.latitude);

    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon), Math.sqrt(1 - (sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon)));
    total += R * c;
  }

  return total;
}

async function geocodeStop(stopLabel: string): Promise<RouteCoordinate | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(stopLabel)}`,
    {
      headers: {
        'User-Agent': 'ReviboApp/1.0',
      },
    },
  );

  const payload = (await response.json().catch(() => [])) as Array<{ lat: string; lon: string }>;

  if (!response.ok || !Array.isArray(payload) || payload.length === 0) {
    return null;
  }

  return {
    latitude: Number(payload[0].lat),
    longitude: Number(payload[0].lon),
  };
}

async function reverseGeocodeCoordinate(coordinate: RouteCoordinate): Promise<string | null> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coordinate.latitude}&lon=${coordinate.longitude}&zoom=18`,
    {
      headers: {
        'User-Agent': 'ReviboApp/1.0',
      },
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload) {
    return null;
  }

  const address = payload.address ?? {};

  return (
    address.road ||
    address.neighbourhood ||
    address.suburb ||
    address.city ||
    address.town ||
    payload.display_name ||
    null
  );
}

function RouteCard({
  route,
  onEdit,
  onNavigate,
  onDelete,
}: {
  route: SavedRoute;
  onEdit: () => void;
  onNavigate: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.routeCard}>
      <View style={styles.routeCardTopRow}>
        <View style={[styles.routeCardIcon, { backgroundColor: `${PRIMARY}14` }]}>
          <MaterialIcons name="alt-route" size={22} color={PRIMARY} />
        </View>

        <View style={styles.routeCardBody}>
          <Text style={styles.routeCardTitle}>{route.name}</Text>
          <Text style={styles.routeCardMeta}>{route.stops.length} paradas · {formatRouteDistance(route.distanceKm)}</Text>
        </View>
      </View>

      <View style={styles.routeStopsPreview}>
        <Text style={styles.routeStopsPreviewText}>{route.summary}</Text>
      </View>

      <View style={styles.routeActionsRow}>
        <ActionButton label="Editar" icon="edit" tone="outline" onPress={onEdit} />
        <ActionButton label="Navegar" icon="navigation" tone="navigate" onPress={onNavigate} />
        <ActionButton label="Eliminar" icon="delete-outline" tone="danger" onPress={onDelete} />
      </View>
    </View>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <MaterialIcons name="alt-route" size={30} color={PRIMARY} />
      <Text style={styles.emptyTitle}>Todavía no tenés rutas guardadas</Text>
      <Text style={styles.emptyText}>
        Creá tu primera ruta personalizada para ver tarjetas, editar y navegar.
      </Text>
      <Pressable onPress={onCreate} style={styles.emptyAction}>
        <Text style={styles.emptyActionText}>Crear ruta</Text>
      </Pressable>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  tone,
  onPress,
}: {
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  tone: 'outline' | 'navigate' | 'danger';
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        tone === 'outline' && styles.actionButtonOutline,
        tone === 'navigate' && styles.actionButtonNavigate,
        tone === 'danger' && styles.actionButtonDanger,
        pressed && styles.actionButtonPressed,
      ]}
    >
      <MaterialIcons
        name={icon}
        size={16}
        color={tone === 'danger' ? '#C0392B' : tone === 'navigate' ? '#0E7E5B' : PRIMARY}
      />
      <Text
        numberOfLines={1}
        allowFontScaling={false}
        style={[
          styles.actionButtonText,
          tone === 'outline' && styles.actionButtonTextOutline,
          tone === 'navigate' && styles.actionButtonTextNavigate,
          tone === 'danger' && styles.actionButtonTextDanger,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function LoadingScreen({ topInset }: { topInset: number }) {
  return (
    <View style={[styles.loadingScreen, { paddingTop: topInset }]}>
      <ActivityIndicator size="large" color={PRIMARY} />
      <Text style={styles.loadingText}>Cargando rutas guardadas...</Text>
    </View>
  );
}

function RouteStopRow({
  index,
  value,
  kind,
  onChange,
  onRemove,
  placeholder,
}: {
  index: number;
  value: string;
  kind: 'origin' | 'waypoint' | 'destination';
  onChange: (value: string) => void;
  onRemove?: () => void;
  placeholder: string;
}) {
  const badgeLabel = kind === 'origin' ? 'A' : kind === 'destination' ? 'B' : String(index);
  const badgeColor =
    kind === 'origin'
      ? ROUTE_STOP_COLORS.origin
      : kind === 'destination'
        ? ROUTE_STOP_COLORS.destination
        : index === 1
          ? ROUTE_STOP_COLORS.middle
          : ROUTE_STOP_COLORS.extra;
  const iconName = kind === 'origin' ? 'my-location' : 'flag';

  return (
    <View style={styles.stopRow}>
      <View style={[styles.stopBadge, { backgroundColor: badgeColor }]}>
        <MaterialIcons name={iconName} size={16} color="#FFFFFF" />
      </View>

      <View style={styles.stopInputWrap}>
        <View style={styles.stopInputHeaderRow}>
          <Text style={styles.stopBadgeText}>
            {kind === 'origin' ? 'Origen' : kind === 'destination' ? 'Destino' : `Banderita ${badgeLabel}`}
          </Text>
          {kind === 'waypoint' ? <Text style={styles.stopHintText}>Parada opcional</Text> : null}
        </View>

        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#8F8F8F"
          style={styles.darkInput}
          blurOnSubmit={false}
          returnKeyType="next"
        />
      </View>

      {onRemove ? (
        <Pressable onPress={onRemove} style={styles.removeStopButton}>
          <MaterialIcons name="close" size={16} color="#B45858" />
        </Pressable>
      ) : null}
    </View>
  );
}

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function getStopPlaceholder(index: number, totalStops: number): string {
  if (index === 0) {
    return 'Origen';
  }

  if (index === totalStops - 1) {
    return 'Destino';
  }

  if (index === 1) {
    return 'Parada intermedia (opcional)';
  }

  return 'Parada adicional';
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BACKGROUND,
  },
  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    gap: 4,
  },
  headerEyebrow: {
    color: '#D8D1FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
  },
  headerSubtitle: {
    color: '#F1EDFF',
    fontSize: 14,
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    gap: 12,
  },
  createCard: {
    backgroundColor: SURFACE,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E1F8',
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  createIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTextWrap: {
    flex: 1,
    gap: 2,
  },
  createTitle: {
    color: TEXT_MAIN,
    fontSize: 15,
    fontWeight: '800',
  },
  createSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  contextCard: {
    backgroundColor: '#FFF8E8',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F2D48A',
  },
  contextLabel: {
    color: '#9B6C10',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  contextTitle: {
    color: '#5B4207',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  contextSubtitle: {
    color: '#7A5A18',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 2,
    paddingLeft: 4,
  },
  sectionTitle: {
    color: '#7A7890',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  sectionCount: {
    color: '#7A7890',
    fontSize: 12,
    fontWeight: '700',
  },
  cardsList: {
    gap: 12,
  },
  routeCard: {
    backgroundColor: SURFACE,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E1F8',
    padding: 14,
    shadowColor: '#3E2D96',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
    gap: 10,
  },
  routeCardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  routeCardIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeCardBody: {
    flex: 1,
    gap: 4,
  },
  routeCardTitle: {
    color: TEXT_MAIN,
    fontSize: 16,
    fontWeight: '800',
  },
  routeCardMeta: {
    color: TEXT_MUTED,
    fontSize: 12,
    fontWeight: '600',
  },
  routeStopsPreview: {
    borderTopWidth: 1,
    borderTopColor: '#EEE9FA',
    paddingTop: 10,
  },
  routeStopsPreviewText: {
    color: '#4C4961',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  routeActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEE9FA',
  },
  actionButton: {
    width: '31%',
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D8D2F4',
    backgroundColor: '#F7F4FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 6,
  },
  actionButtonOutline: {
    backgroundColor: '#F7F4FF',
    borderColor: '#CFC5F8',
  },
  actionButtonNavigate: {
    backgroundColor: '#ECF9F4',
    borderColor: '#BFE9DA',
  },
  actionButtonDanger: {
    backgroundColor: '#FFF1F1',
    borderColor: '#F0C7C7',
  },
  actionButtonPressed: {
    opacity: 0.94,
  },
  actionButtonText: {
    color: PRIMARY,
    fontSize: 11,
    fontWeight: '800',
  },
  actionButtonTextOutline: {
    color: PRIMARY,
  },
  actionButtonTextNavigate: {
    color: '#0E7E5B',
  },
  actionButtonTextDanger: {
    color: '#C0392B',
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E1F8',
    backgroundColor: '#FFFFFF',
    padding: 18,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: TEXT_MAIN,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptyText: {
    color: TEXT_MUTED,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyAction: {
    marginTop: 4,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  formScroll: {
    paddingBottom: 20,
  },
  formHeader: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  formHeaderTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  backIconButton: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  formHeaderCopy: {
    flex: 1,
  },
  formEyebrow: {
    color: '#D8D1FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
  },
  formSubtitle: {
    color: '#F1EDFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 12,
    backgroundColor: '#2F1F8A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#1C1159',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  formCard: {
    marginHorizontal: 12,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E7E1F8',
    padding: 14,
    gap: 12,
  },
  fieldLabel: {
    color: TEXT_MAIN,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  darkInput: {
    backgroundColor: '#F7F4FF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D8D0F5',
    minHeight: 46,
    paddingHorizontal: 14,
    color: '#2F2B3A',
    fontSize: 14,
    fontWeight: '600',
  },
  mapEditorCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E7E1F8',
    backgroundColor: '#FAF8FF',
    padding: 12,
    gap: 10,
  },
  mapEditorHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  mapEditorTitle: {
    color: TEXT_MAIN,
    fontSize: 15,
    fontWeight: '900',
  },
  mapEditorSubtitle: {
    color: TEXT_MUTED,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 2,
  },
  mapEditorDistance: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
  },
  mapEditorLocation: {
    color: '#6E6790',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  mapPreviewWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0D8F6',
    backgroundColor: '#EEF0F7',
  },
  mapPreview: {
    width: '100%',
    height: 220,
  },
  mapPinWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  mapPinBody: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  stopsGroup: {
    gap: 8,
  },
  waypointHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  addWaypointButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F4F0FF',
  },
  addWaypointButtonText: {
    color: '#5B3FD9',
    fontSize: 12,
    fontWeight: '800',
  },
  emptyWaypointsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4DDFC',
    backgroundColor: '#FAF8FF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyWaypointsText: {
    flex: 1,
    color: '#5D5970',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stopBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  stopInputWrap: {
    flex: 1,
    gap: 6,
  },
  stopInputHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stopHintText: {
    color: '#8B84A4',
    fontSize: 11,
    fontWeight: '700',
  },
  removeStopButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F9F1F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addStopButton: {
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFC5F8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F7F4FF',
  },
  addStopButtonText: {
    color: '#5B3FD9',
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    marginHorizontal: 16,
    color: '#C0392B',
    fontSize: 13,
    fontWeight: '700',
  },
  saveButton: {
    marginTop: 14,
    marginHorizontal: 12,
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
    shadowColor: '#5B3FD9',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: '#AA9CE9',
    opacity: 1,
  },
  saveButtonSaving: {
    opacity: 0.95,
  },
  saveButtonPressed: {
    opacity: 0.92,
  },
  confirmRouteButton: {
    marginTop: 12,
    alignSelf: 'stretch',
    marginHorizontal: 6,
    minHeight: 56,
    borderRadius: 14,
    backgroundColor: '#F4F0FF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E0D8F6',
    shadowColor: '#D8D0F5',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 3,
  },
  confirmRouteButtonDisabled: {
    backgroundColor: '#F6F4FF',
    opacity: 0.9,
    borderColor: '#EEEAF8',
  },
  confirmRouteButtonPressed: {
    opacity: 0.92,
  },
  confirmRouteButtonText: {
    color: PRIMARY,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  useLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F7F4FF',
    borderWidth: 1,
    borderColor: '#E7E1F8',
  },
  useLocationText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '800',
  },
  useLocationButtonSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#ECF9F4',
    borderWidth: 1,
    borderColor: '#BFE9DA',
  },
  useLocationTextSecondary: {
    color: '#0E7E5B',
    fontSize: 13,
    fontWeight: '800',
  },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: BACKGROUND,
  },
  loadingText: {
    color: TEXT_MUTED,
    fontSize: 14,
    fontWeight: '600',
  },
});

