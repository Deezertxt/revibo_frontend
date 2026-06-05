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
            <Text style={styles.createSubtitle}>Marcá el recorrido directamente en el mapa</Text>
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
  const [markerCoordinates, setMarkerCoordinates] = useState<RouteCoordinate[]>([
    DEFAULT_MAP_COORDINATE,
    offsetCoordinate(DEFAULT_MAP_COORDINATE, 1),
  ]);
  const [routePreviewCoordinates, setRoutePreviewCoordinates] = useState<RouteCoordinate[]>([]);
  const [routeDistanceLabel, setRouteDistanceLabel] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (route) {
      setName(route.name);
      setMarkerCoordinates(
        route.markerCoordinates.length >= 2
          ? route.markerCoordinates
          : deriveMarkerCoordinates(route.coordinates),
      );
      return;
    }

    setName('');
    setMarkerCoordinates([
      DEFAULT_MAP_COORDINATE,
      offsetCoordinate(DEFAULT_MAP_COORDINATE, 1),
    ]);
  }, [route]);

  useEffect(() => {
    let cancelled = false;

    const timer = setTimeout(async () => {
      if (markerCoordinates.length < 2) {
        if (!cancelled) {
          setRoutePreviewCoordinates(markerCoordinates);
          setRouteDistanceLabel(null);
          setLoadingPreview(false);
        }

        return;
      }

      setLoadingPreview(true);

      const preview = await buildRoutePreview({
        name: 'ruta temporal',
        routeType: 'carretera_nueva',
        markerCoordinates,
      });

      if (cancelled) {
        return;
      }

      setRoutePreviewCoordinates(preview.coordinates);
      setRouteDistanceLabel(
        preview.coordinates.length >= 2 ? `${Math.round(preview.distanceKm)} km aprox.` : null,
      );
      setLoadingPreview(false);
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [markerCoordinates]);

  const canSave = name.trim().length > 0 && markerCoordinates.length >= 2;

  const updateMarkerCoordinate = (index: number, value: RouteCoordinate) => {
    setMarkerCoordinates((currentMarkers) =>
      currentMarkers.map((coordinate, markerIndex) => (markerIndex === index ? value : coordinate)),
    );
  };

  const addMarker = () => {
    setMarkerCoordinates((currentMarkers) => {
      const baseCoordinate = currentMarkers[currentMarkers.length - 1] ?? currentMarkers[0] ?? DEFAULT_MAP_COORDINATE;
      return [...currentMarkers, offsetCoordinate(baseCoordinate, currentMarkers.length || 1)];
    });
  };

  const useMyLocation = async () => {
    try {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted) {
        Alert.alert('Permiso denegado', 'Habilitá permiso de ubicación para usar esta función.');
        return;
      }

      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coord: RouteCoordinate = {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      };

      setMarkerCoordinates((currentMarkers) => {
        if (currentMarkers.length === 0) {
          return [coord, offsetCoordinate(coord, 1)];
        }

        return [coord, ...currentMarkers.slice(1)];
      });
    } catch (err) {
      Alert.alert('No se pudo obtener ubicación', 'Intenta nuevamente.');
    }
  };

  const removeMarker = (index: number) => {
    setMarkerCoordinates((currentMarkers) => currentMarkers.filter((_, markerIndex) => markerIndex !== index));
  };

  const handleSave = async () => {
    if (!canSave) {
      setErrorMessage('Completá el nombre y definí al menos dos marcadores.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    try {
      await onSave({
        name,
        routeType: 'carretera_nueva',
        markerCoordinates: markerCoordinates.filter((coordinate): coordinate is RouteCoordinate => coordinate !== null),
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la ruta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.formScroll, { paddingBottom: insets.bottom + 200 }]}
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
        <View style={[styles.formCard, { paddingBottom: 24 }]}>
          <FieldLabel text="Nombre de la ruta" />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={isEditMode ? 'Ruta principal del centro' : 'Ej: Ruta semanal al trabajo'}
            placeholderTextColor="#8F8F8F"
            style={styles.darkInput}
          />

          <RouteMapEditor
            markerCoordinates={markerCoordinates}
            routePreviewCoordinates={routePreviewCoordinates}
            routeDistanceLabel={routeDistanceLabel}
            loadingPreview={loadingPreview}
            onMarkerMove={updateMarkerCoordinate}
            onAddMarker={addMarker}
            onRemoveMarker={removeMarker}
            onUseMyLocation={useMyLocation}
          />

          <View style={styles.formFooterActions}>
            <Pressable onPress={useMyLocation} style={styles.secondaryFormButton}>
              <MaterialIcons name="my-location" size={16} color={PRIMARY} />
              <Text style={styles.secondaryFormButtonText}>Mi ubicación</Text>
            </Pressable>

            <Pressable onPress={addMarker} style={styles.secondaryFormButton}>
             <MaterialIcons name="add-location-alt" size={16} color={PRIMARY} />
             <Text style={styles.secondaryFormButtonText}>Agregar marcador</Text>
             </Pressable>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!canSave || saving}
            style={{
              marginTop: 12,
              marginHorizontal: 12,
              marginBottom: 8,
              height: 55,
              borderRadius: 12,
              backgroundColor: (!canSave || saving) ? '#8A6CE0' : '#5B37D0',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18, textAlign: 'center' }}>
                Guardar ruta
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function RouteMapEditor({
  markerCoordinates,
  routePreviewCoordinates,
  routeDistanceLabel,
  loadingPreview,
  onMarkerMove,
  onAddMarker,
  onRemoveMarker,
  onUseMyLocation,
}: {
  markerCoordinates: RouteCoordinate[];
  routePreviewCoordinates: RouteCoordinate[];
  routeDistanceLabel: string | null;
  loadingPreview: boolean;
  onMarkerMove: (index: number, value: RouteCoordinate) => void;
  onAddMarker: () => void;
  onRemoveMarker: (index: number) => void;
  onUseMyLocation: () => void;
}) {
  const mapRef = useRef<MapView | null>(null);
  useEffect(() => {
    if (routePreviewCoordinates.length < 2) {
      return;
    }

    mapRef.current?.fitToCoordinates(routePreviewCoordinates, {
      edgePadding: {
        top: 80,
        right: 60,
        bottom: 80,
        left: 60,
      },
      animated: true,
    });
  }, [routePreviewCoordinates]);

  const visibleCoordinates = markerCoordinates;
  const mapLineCoordinates =
    routePreviewCoordinates.length > 1
      ? routePreviewCoordinates
      : visibleCoordinates.length > 0
        ? visibleCoordinates
        : [DEFAULT_MAP_COORDINATE];
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
        <View style={{ flex: 1 }}>
          <Text style={styles.mapEditorTitle}>Mapa de marcadores</Text>
          <Text style={styles.mapEditorSubtitle}>Mueve los marcadores para definir origen, destino y paradas.</Text>
          {routeDistanceLabel ? <Text style={styles.mapEditorDistance}>{routeDistanceLabel}</Text> : null}
        </View>
        {loadingPreview ? (
          <View style={{ width: 24, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={PRIMARY} />
      </View>
      ) : null}
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
            const kind =
              index === 0 ? 'origin' : index === markerCoordinates.length - 1 ? 'destination' : 'waypoint';

            return (
              <RouteMapPin
                key={`route-pin-${index}`}
                coordinate={coordinate}
                kind={kind}
                index={index}
                onDragEnd={(nextCoordinate) => onMarkerMove(index, nextCoordinate)}
              />
            );
          })}
        </MapView>
      </View>

      <View style={styles.markerToolsCard}>
        <View style={styles.markerToolsHeader}>
          <Text style={styles.markerToolsTitle}>Marcadores</Text>
        </View>

        <View style={styles.markerChipsRow}>
          {markerCoordinates.map((coordinate, index) => (
            <View key={`marker-chip-${index}`} style={styles.markerChip}>
              <Text style={styles.markerChipText}>Marcador {index + 1}</Text>
              <Pressable onPress={() => onRemoveMarker(index)} style={styles.markerChipDelete}>
                <MaterialIcons name="close" size={14} color="#A44B4B" />
              </Pressable>
            </View>
          ))}
        </View>
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

function deriveMarkerCoordinates(coordinates: RouteCoordinate[]): RouteCoordinate[] {
  if (coordinates.length <= 2) {
    return coordinates;
  }

  const middleIndex = Math.floor(coordinates.length / 2);
  const selectedCoordinates = [coordinates[0], coordinates[middleIndex], coordinates[coordinates.length - 1]];

  return selectedCoordinates.filter((coordinate, index, allCoordinates) => {
    const firstIndex = allCoordinates.findIndex(
      (candidate) =>
        candidate.latitude === coordinate.latitude && candidate.longitude === coordinate.longitude,
    );

    return firstIndex === index;
  });
}

function offsetCoordinate(base: RouteCoordinate, index: number): RouteCoordinate {
  const shift = 0.0025 * index;

  return {
    latitude: base.latitude + shift,
    longitude: base.longitude + shift,
  };
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
          <Text style={styles.routeCardMeta}>{route.markerCoordinates.length} marcadores · {formatRouteDistance(route.distanceKm)}</Text>
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

function FieldLabel({ text }: { text: string }) {
  return <Text style={styles.fieldLabel}>{text}</Text>;
}

function markerColorForIndex(index: number, totalMarkers: number): string {
  if (index === 0) {
    return ROUTE_STOP_COLORS.origin;
  }

  if (index === totalMarkers - 1) {
    return ROUTE_STOP_COLORS.destination;
  }

  if (index === 1) {
    return ROUTE_STOP_COLORS.middle;
  }

  return ROUTE_STOP_COLORS.extra;
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
    flexGrow: 1,
    paddingTop: 0,
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
    paddingBottom: 24,
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
  formFooterActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryFormButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8D0F5',
    backgroundColor: '#F7F4FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  secondaryFormButtonText: {
    color: PRIMARY,
    fontSize: 13,
    fontWeight: '800',
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
  markerToolsCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4DCF7',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
  },
  markerToolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  markerToolsTitle: {
    color: TEXT_MAIN,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  markerToolsActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 8,
  },
  markerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F4F0FF',
  },
  markerActionButtonText: {
    color: PRIMARY,
    fontSize: 12,
    fontWeight: '800',
  },
  markerChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  markerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#F7F4FF',
    borderWidth: 1,
    borderColor: '#D9D0F7',
  },
  markerChipText: {
    color: TEXT_MAIN,
    fontSize: 12,
    fontWeight: '700',
  },
  markerChipDelete: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFF1F1',
    alignItems: 'center',
    justifyContent: 'center',
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

