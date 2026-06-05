import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { RefObject } from 'react';
import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
    ConnectivityError,
    fetchActiveIncidents,
} from '@/features/incidents/incidents.service';
import {
    INCIDENT_SEVERITY_LABELS,
    INCIDENT_STATUS_LABELS,
    INCIDENT_TYPES,
    INCIDENT_TYPE_COLORS,
    INCIDENT_TYPE_LABELS,
    Incident,
    IncidentType,
} from '@/features/incidents/types';
import { getSavedMapRegion, setSavedMapRegion } from '@/features/map/map-view-state';
import { useRoutesStore } from '@/features/rutas/store/rutasStore';
import { useAlertsStore } from '@/shared/store/alertsStore';

const PRIMARY = '#5B3FD9';
const LOCATION_FAB_BOTTOM_OFFSET = 8;
const DEFAULT_SEVERITIES: Incident['severity'][] = [];

const DEFAULT_REGION: Region = {
  latitude: -17.3935,
  longitude: -66.157,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

type IncidentFilter = 'todos' | IncidentType;

type IncidentMarkerConfig = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
};

type IncidentMapMarkerProps = {
  incident: Incident;
  onPress: (incident: Incident) => void;
};

const INCIDENT_MARKER_CONFIG: Record<IncidentType, IncidentMarkerConfig> = {
  accidente_vehicular: { icon: 'alert-circle-outline', label: 'Accidente vehicular' },
  bloqueo: { icon: 'ban-outline', label: 'Bloqueo' },
  mantenimiento: { icon: 'build-outline', label: 'Mantenimiento' },
  cierre_programado: { icon: 'calendar-outline', label: 'Cierre programado' },
  desfile: { icon: 'flag-outline', label: 'Desfile' },
  festividad: { icon: 'wine-outline', label: 'Festividad' },
  feria: { icon: 'storefront-outline', label: 'Feria' },
  marcha: { icon: 'people-outline', label: 'Marcha' },
  incendio: { icon: 'flame-outline', label: 'Incendio' },
  derrumbe: { icon: 'alert-circle-outline', label: 'Derrumbe' },
  deslizamiento: { icon: 'trending-down-outline', label: 'Deslizamiento' },
  inundacion: { icon: 'water-outline', label: 'Inundacion' },
};

const IncidentMapMarker = memo(function IncidentMapMarker({ incident, onPress }: IncidentMapMarkerProps) {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);
  const markerConfig = INCIDENT_MARKER_CONFIG[incident.type];
  const markerColor = INCIDENT_TYPE_COLORS[incident.type];

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setTracksViewChanges(false);
    }, 180);

    return () => {
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <Marker
      coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
      title={incident.title}
      description={incident.description}
      onPress={() => onPress(incident)}
      tracksViewChanges={tracksViewChanges}
    >
      <View style={[styles.incidentMarkerWrap, { shadowColor: markerColor }]}>
        <View style={[styles.incidentMarkerRing, { borderColor: markerColor }]}> 
          <View style={[styles.incidentMarkerCircle, { backgroundColor: markerColor }]}>
            <Ionicons name={markerConfig.icon} size={12} color="#FFFFFF" />
          </View>
        </View>
        <View style={[styles.incidentMarkerDot, { backgroundColor: markerColor }]} />
      </View>
    </Marker>
  );
});

const MemoFilterChip = memo(FilterChip);

type MapCanvasProps = {
  mapRef: RefObject<MapView | null>;
  incidents: Incident[];
  filteredIncidents: Incident[];
  searchPreview?: SearchPreview | null;
  routePreview?: { name: string; distanceKm: number; coordinates: { latitude: number; longitude: number }[] };
  openIncidentDetail: (incident: Incident) => void;
};

const MapCanvas = memo(function MapCanvas({
  mapRef,
  incidents,
  filteredIncidents,
  searchPreview,
  routePreview,
  openIncidentDetail,
}: MapCanvasProps) {
  const restoredRegion = getSavedMapRegion();
  const hasAppliedInitialFitRef = useRef(Boolean(restoredRegion));

  useEffect(() => {
    if (!incidents.length || hasAppliedInitialFitRef.current || !mapRef.current) {
      return;
    }

    hasAppliedInitialFitRef.current = true;

    mapRef.current.fitToCoordinates(
      incidents.flatMap((incident) => incident.mapCoordinates),
      {
        edgePadding: {
          top: 120,
          right: 70,
          bottom: 120,
          left: 70,
        },
        animated: true,
      }
    );
  }, [incidents]);

  return (
    <MapView
      ref={mapRef}
      initialRegion={restoredRegion ?? DEFAULT_REGION}
      style={styles.map}
      showsUserLocation
      showsMyLocationButton={false}
      followsUserLocation={false}
      scrollEnabled
      zoomEnabled
      rotateEnabled
      pitchEnabled
      onRegionChangeComplete={(region) => setSavedMapRegion(region)}>
      {searchPreview?.coordinates.length ? (
        <>
          {searchPreview.coordinates.length > 1 ? (
            <Polyline coordinates={searchPreview.coordinates} strokeColor={PRIMARY} strokeWidth={6} />
          ) : null}

          <Marker
            coordinate={searchPreview.marker}
            pinColor={PRIMARY}
            title={searchPreview.title}
            description={searchPreview.subtitle}
          />
        </>
      ) : null}

      {routePreview?.coordinates.length ? (
        <>
          {routePreview.coordinates.length > 1 ? (
            <Polyline
              coordinates={routePreview.coordinates}
              strokeColor={PRIMARY}
              strokeWidth={5}
            />
          ) : null}

          <Marker
            coordinate={routePreview.coordinates[0]}
            pinColor={PRIMARY}
            title={routePreview.name}
          />

          {routePreview.coordinates.length > 1 ? (
            <Marker
              coordinate={routePreview.coordinates[routePreview.coordinates.length - 1]}
              pinColor={PRIMARY}
              title={`${routePreview.name} · destino`}
            />
          ) : null}
        </>
      ) : null}

      {filteredIncidents.map((incident) => {
        if (incident.geometryType === 'Point') {
          return (
            <IncidentMapMarker
              key={incident.id}
              incident={incident}
              onPress={openIncidentDetail}
            />
          );
        }

        return (
          <Fragment key={incident.id}>
            <Polyline
              key={`${incident.id}-line`}
              coordinates={incident.mapCoordinates}
              strokeColor={INCIDENT_TYPE_COLORS[incident.type]}
              strokeWidth={5}
              tappable
              onPress={() => openIncidentDetail(incident)}
            />
            <IncidentMapMarker
              key={`${incident.id}-center`}
              incident={incident}
              onPress={openIncidentDetail}
            />
          </Fragment>
        );
      })}
    </MapView>
  );
});

type SearchParams = {
  routeId?: string | string[];
  lat?: string;
  lng?: string;
};

type NominatimSuggestion = {
  place_id?: number;
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  class?: string;
  type?: string;
  importance?: number;
  geojson?: {
    type?: string;
    coordinates?: unknown;
  } | null;
  address?: {
    road?: string;
    pedestrian?: string;
    cycleway?: string;
    footway?: string;
    junction?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    municipality?: string;
    county?: string;
    department?: string;
    state?: string;
    region?: string;
    country?: string;
  };
};

type SearchSuggestion = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  subtitle: string;
  raw: NominatimSuggestion;
};

type SearchPreview = {
  title: string;
  subtitle: string;
  marker: { latitude: number; longitude: number };
  coordinates: Array<{ latitude: number; longitude: number }>;
  kind: 'point' | 'line';
};

type SearchArea = {
  city?: string;
  department?: string;
};

export default function MapHomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<SearchParams>();
  const mapRef = useRef<MapView | null>(null);
  const insets = useSafeAreaInsets();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<IncidentFilter>('todos');
  const [selectedSeverities, setSelectedSeverities] = useState<Incident['severity'][]>(DEFAULT_SEVERITIES);
  const [tempSelectedSeverities, setTempSelectedSeverities] = useState<Incident['severity'][]>(DEFAULT_SEVERITIES);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [userCoordinate, setUserCoordinate] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [userSearchArea, setUserSearchArea] = useState<SearchArea | null>(null);
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(null);
  const [selectedSearchPreview, setSelectedSearchPreview] = useState<SearchPreview | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [centeringUser, setCenteringUser] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const restoredRegion = getSavedMapRegion();
  const hasAppliedInitialFitRef = useRef(Boolean(restoredRegion));
  const handleTouchStartY = useRef<number | null>(null);
  const syncAlertsFromIncidents = useAlertsStore(
    (state) => state.syncFromIncidents,
  );
  const alerts = useAlertsStore((state) => state.alerts);
  const selectedAlertId = useAlertsStore((state) => state.selectedAlertId);
  const consumeSelectedAlert = useAlertsStore(
    (state) => state.consumeSelectedAlert,
  );
  const routeId = firstParam(params.routeId);
  const routePreview = useRoutesStore((state) =>
    routeId ? state.routes.find((route) => route.id === routeId) : undefined,
  );

  const openFilterModal = () => {
    setTempSelectedSeverities(selectedSeverities);
    setShowFilterModal(true);
  };

  const handleClearFilters = () => {
    setSelectedSeverities(DEFAULT_SEVERITIES);
    setTempSelectedSeverities(DEFAULT_SEVERITIES);
  };

  const clearRoutePreview = () => {
    useRoutesStore.setState({ selectedRouteId: null });
    router.replace('/(tabs)');
  };

  const closeIncidentDetail = () => {
    setSelectedIncident(null);
    setSheetExpanded(false);
  };

  const handleSheetTouchStart = (pageY: number) => {
    handleTouchStartY.current = pageY;
  };

  const handleSheetTouchEnd = (pageY: number) => {
    if (handleTouchStartY.current == null) {
      return;
    }

    const dragDistance = handleTouchStartY.current - pageY;
    handleTouchStartY.current = null;

    // Arriba: expandir
    if (dragDistance > 25) {
      setSheetExpanded(true);
      return;
    }

    // Abajo: contraer o cerrar
    if (dragDistance < -25) {
      if (sheetExpanded) {
        setSheetExpanded(false);
      } else {
        closeIncidentDetail();
      }
    }
  };

  const centerToUserLocation = async () => {
    if (!mapRef.current) {
      return;
    }

    setCenteringUser(true);

    try {
      let coordinate = userCoordinate;

      if (!coordinate) {
        const permission = await Location.requestForegroundPermissionsAsync();

        if (permission.status !== 'granted') {
          setInfoMessage('Activa el permiso de ubicacion para centrar tu posicion.');
          return;
        }

        const current = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        coordinate = {
          latitude: current.coords.latitude,
          longitude: current.coords.longitude,
        };

        setUserCoordinate(coordinate);
        void resolveSearchArea(coordinate.latitude, coordinate.longitude)
          .then((area) => setUserSearchArea(area))
          .catch(() => undefined);
      }

      mapRef.current.animateToRegion(
        {
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        450
      );
    } catch {
      setInfoMessage('No se pudo obtener tu ubicacion ahora. Intenta nuevamente.');
    } finally {
      setCenteringUser(false);
    }
  };

  const openIncidentDetail = useCallback((incident: Incident) => {
    setSheetExpanded(false);
    setSelectedIncident(incident);

    mapRef.current?.animateToRegion(
      {
        latitude: incident.latitude - 0.004,
        longitude: incident.longitude,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      320
    );
  }, []);

  const handleSelectSuggestion = useCallback((suggestion: SearchSuggestion) => {
    const geometryCoordinates = extractSuggestionCoordinates(suggestion.raw);
    const preview: SearchPreview = {
      title: suggestion.title,
      subtitle: suggestion.subtitle,
      marker: {
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
      },
      coordinates: geometryCoordinates.length > 0 ? geometryCoordinates : [{ latitude: suggestion.latitude, longitude: suggestion.longitude }],
      kind: geometryCoordinates.length > 1 ? 'line' : 'point',
    };

    setSelectedSearchPreview(preview);

    if (preview.kind === 'line' && preview.coordinates.length > 1) {
      mapRef.current?.fitToCoordinates(preview.coordinates, {
        edgePadding: {
          top: 120,
          right: 80,
          bottom: 160,
          left: 80,
        },
        animated: true,
      });
    } else {
      mapRef.current?.animateCamera(
        {
          center: preview.marker,
          zoom: 16.5,
          heading: 0,
          pitch: 0,
        },
        { duration: 450 },
      );
    }

    setSearchQuery(suggestion.title);
    setSuggestions([]);
    setSearchErrorMessage(null);
  }, []);

  const handleSearchQueryChange = useCallback((value: string) => {
    setSearchQuery(value);

    if (selectedSearchPreview && value !== selectedSearchPreview.title) {
      setSelectedSearchPreview(null);
    }
  }, [selectedSearchPreview]);

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    let cancelled = false;

    const loadMapData = async () => {
      setLoading(true);
      setInfoMessage(null);

      try {
        const activeIncidents = await fetchActiveIncidents();

        if (cancelled) {
          return;
        }

        setIncidents(activeIncidents);
        syncAlertsFromIncidents(activeIncidents, null);

        const locationPermission = await Location.requestForegroundPermissionsAsync();

        if (cancelled || locationPermission.status !== 'granted') {
          return;
        }

        try {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          if (cancelled) {
            return;
          }

          setUserCoordinate({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          void resolveSearchArea(position.coords.latitude, position.coords.longitude)
            .then((area) => setUserSearchArea(area))
            .catch(() => undefined);

          syncAlertsFromIncidents(activeIncidents, {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });

          locationSubscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.Balanced,
              timeInterval: 4000,
              distanceInterval: 5,
            },
            ({ coords }) => {
              setUserCoordinate({
                latitude: coords.latitude,
                longitude: coords.longitude,
              });
            }
          );
        } catch {
          if (!cancelled) {
            setInfoMessage('No se pudo obtener tu ubicacion ahora. Intenta nuevamente.');
          }
        }
      } catch (error) {
        if (error instanceof ConnectivityError) {
          setInfoMessage(error.message);
          setIncidents([]);
        } else {
          setInfoMessage(error instanceof Error ? error.message : 'No fue posible cargar los reportes en este momento.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadMapData();

    return () => {
      cancelled = true;
      locationSubscription?.remove();
    };
  }, []);

  const incidentCounts = useMemo(() => {
    const initialCounts = INCIDENT_TYPES.reduce((accumulator, type) => {
      accumulator[type] = 0;
      return accumulator;
    }, {} as Record<IncidentType, number>);

    return incidents.reduce(
      (accumulator, incident) => {
        accumulator[incident.type] += 1;
        return accumulator;
      },
      initialCounts
    );
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    // filter by type
    let list =
      selectedFilter === 'todos' ? incidents : incidents.filter((incident) => incident.type === selectedFilter);

    // filter by selected severities
    if (selectedSeverities.length > 0) {
      list = list.filter((incident) => selectedSeverities.includes(incident.severity));
    }

    return list;
  }, [incidents, selectedFilter, selectedSeverities]);

  const selectedIncidentProgress = useMemo(() => {
    if (!selectedIncident?.endAt) {
      return null;
    }

    return buildProgress(selectedIncident.startAt, selectedIncident.endAt);
  }, [selectedIncident]);

  useEffect(() => {
    if (!mapRef.current || !routePreview || routePreview.coordinates.length === 0) {
      return;
    }

    if (routePreview.coordinates.length === 1) {
      const onlyPoint = routePreview.coordinates[0];

      mapRef.current.animateToRegion(
        {
          latitude: onlyPoint.latitude,
          longitude: onlyPoint.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        },
        450,
      );
      return;
    }

    mapRef.current.fitToCoordinates(routePreview.coordinates, {
      edgePadding: {
        top: 140,
        right: 70,
        bottom: 170,
        left: 70,
      },
      animated: true,
    });
  }, [routePreview]);

  useEffect(() => {
    if (!selectedAlertId) {
      return;
    }

    const alertIncident =
      alerts.find((alert) => alert.id === selectedAlertId)?.incident ??
      incidents.find((incident) => incident.id === selectedAlertId);

    if (!alertIncident) {
      return;
    }

    openIncidentDetail(alertIncident);
    consumeSelectedAlert();
  }, [consumeSelectedAlert, incidents, openIncidentDetail, selectedAlertId]);

  // Center on coordinates from params (used by admin to center on reports)
  useEffect(() => {
    const lat = params.lat ? parseFloat(params.lat as string) : null;
    const lng = params.lng ? parseFloat(params.lng as string) : null;

    if (!lat || !lng || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    mapRef.current?.animateToRegion(
      {
        latitude: lat - 0.004,
        longitude: lng,
        latitudeDelta: 0.012,
        longitudeDelta: 0.012,
      },
      450
    );
  }, [params.lat, params.lng]);

  // Search suggestions (Nominatim) with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      setSearchErrorMessage(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const buildSearchUrl = (mode: 'nearby' | 'city' | 'department' | 'fallback') => {
      const params = new URLSearchParams({
        format: 'jsonv2',
        q: searchQuery,
        addressdetails: '1',
        limit: '10',
        countrycodes: 'bo',
        'accept-language': 'es',
        polygon_geojson: '1',
      });

      if (mode === 'nearby' && userCoordinate) {
        const latitudeSpan = 0.55;
        const longitudeSpan = 0.7;
        const left = userCoordinate.longitude - longitudeSpan;
        const right = userCoordinate.longitude + longitudeSpan;
        const top = userCoordinate.latitude + latitudeSpan;
        const bottom = userCoordinate.latitude - latitudeSpan;

        params.set('viewbox', `${left},${top},${right},${bottom}`);
        params.set('bounded', '1');
      }

      if (mode === 'city' && userSearchArea?.city) {
        params.set('city', userSearchArea.city);
      }

      if (mode === 'department' && userSearchArea?.department) {
        params.set('state', userSearchArea.department);
      }

      return `https://nominatim.openstreetmap.org/search?${params.toString()}`;
    };

    const mergeUniqueSuggestions = (current: NominatimSuggestion[], next: NominatimSuggestion[]) => {
      const seen = new Set(current.map((item) => `${item.place_id ?? item.osm_id ?? `${item.lat}-${item.lon}`}`));

      return [
        ...current,
        ...next.filter((item) => {
          const key = `${item.place_id ?? item.osm_id ?? `${item.lat}-${item.lon}`}`;
          if (seen.has(key)) {
            return false;
          }

          seen.add(key);
          return true;
        }),
      ];
    };

    const toSuggestion = (item: NominatimSuggestion): SearchSuggestion => {
      const latitude = Number(item.lat);
      const longitude = Number(item.lon);
      const formatted = formatNominatimSuggestion(item);

      return {
        id: `${item.place_id ?? item.osm_id ?? `${item.lat}-${item.lon}`}`,
        latitude,
        longitude,
        title: formatted.title,
        subtitle: formatted.subtitle,
        raw: item,
      };
    };

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        setSearchErrorMessage(null);

        const fetchSuggestions = async (mode: 'nearby' | 'city' | 'department' | 'fallback') => {
          const res = await fetch(buildSearchUrl(mode), {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
              'Accept-Language': 'es',
              'User-Agent': 'Revibo/1.0',
            },
          });

          if (!res.ok) {
            return [] as NominatimSuggestion[];
          }

          const data = (await res.json().catch(() => [])) as NominatimSuggestion[];
          return normalizeNominatimPayload(data);
        };

        const collectedResults: NominatimSuggestion[] = [];

        if (userCoordinate) {
          const nearbyResults = await fetchSuggestions('nearby');
          collectedResults.push(...nearbyResults);
        }

        if (collectedResults.length < 10 && userSearchArea?.city) {
          const cityResults = await fetchSuggestions('city');
          collectedResults.splice(0, collectedResults.length, ...mergeUniqueSuggestions(collectedResults, cityResults));
        }

        if (collectedResults.length < 10 && userSearchArea?.department) {
          const departmentResults = await fetchSuggestions('department');
          collectedResults.splice(0, collectedResults.length, ...mergeUniqueSuggestions(collectedResults, departmentResults));
        }

        if (collectedResults.length < 10) {
          const BoliviaResults = await fetchSuggestions('fallback');
          collectedResults.splice(0, collectedResults.length, ...mergeUniqueSuggestions(collectedResults, BoliviaResults));
        }

        if (cancelled) return;

        const rankedSuggestions = rankNominatimSuggestions(collectedResults, searchQuery, userCoordinate).slice(0, 10);

        if (rankedSuggestions.length === 0) {
          setSearchErrorMessage('No encontramos coincidencias en Bolivia.');
        }

        setSuggestions(rankedSuggestions.map(toSuggestion));
      } catch (e) {
        if ((e as any)?.name === 'AbortError') return;
        setSuggestions([]);
        setSearchErrorMessage('No se pudo buscar ubicaciones. Verifica tu conexión e intenta nuevamente.');
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery, userCoordinate, userSearchArea]);

  return (
    <View style={styles.container}>
      <View style={[styles.topPanel, { paddingTop: insets.top + 12 }]}>
        <View style={styles.searchRow}>
          <TextInput
            value={searchQuery}
            onChangeText={handleSearchQueryChange}
            placeholder="Buscar calle, avenida o carretera"
            placeholderTextColor="#D6D0FF"
            style={styles.searchInput}
          />
          <Pressable onPress={openFilterModal} style={styles.filterButton}>
            <MaterialIcons name="filter-list" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}>
          <MemoFilterChip
            label="Todos"
            count={incidents.length}
            active={selectedFilter === 'todos'}
            onPress={() => setSelectedFilter('todos')}
          />
          {INCIDENT_TYPES.map((type) => (
            <MemoFilterChip
              key={type}
              label={INCIDENT_TYPE_LABELS[type]}
              count={incidentCounts[type]}
              active={selectedFilter === type}
              onPress={() => setSelectedFilter(type)}
            />
          ))}
        </ScrollView>
        {searchQuery.length > 0 ? (
          <View style={styles.suggestionsBoxInline}>
            {loadingSuggestions ? (
              <View style={styles.suggestionRow}><ActivityIndicator size="small" color="#6F61DD" /></View>
            ) : searchErrorMessage ? (
              <View style={styles.emptySuggestionState}>
                <Text style={styles.emptySuggestionTitle}>Sin resultados</Text>
                <Text style={styles.emptySuggestionSubtitle}>{searchErrorMessage}</Text>
              </View>
            ) : (
              <>
                {suggestions.map((s) => (
                  <Pressable
                    key={s.id}
                    onPress={() => handleSelectSuggestion(s)}
                    style={styles.suggestionRow}>
                    <View style={styles.suggestionMainRow}>
                      <Text style={styles.suggestionTitle} numberOfLines={1}>{s.title}</Text>
                      <Text style={styles.suggestionType}>{formatSuggestionKind(s.raw)}</Text>
                    </View>
                    <Text style={styles.suggestionSubtitle} numberOfLines={2}>{s.subtitle}</Text>
                  </Pressable>
                ))}
                {suggestions.length === 0 ? (
                  <View style={styles.emptySuggestionState}>
                    <Text style={styles.emptySuggestionTitle}>Escribe para buscar</Text>
                    <Text style={styles.emptySuggestionSubtitle}>
                      Buscamos calles, avenidas, carreteras, barrios e intersecciones en Bolivia.
                    </Text>
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : null}
      </View>


      {showFilterModal ? (
        <Pressable style={styles.filterModalOverlay} onPress={() => setShowFilterModal(false)}>
          <View style={styles.filterModal} onStartShouldSetResponder={() => true}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filtrar incidentes</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Pressable onPress={handleClearFilters}>
                  <Text style={styles.clearText}>Limpiar</Text>
                </Pressable>
                <Pressable onPress={() => setShowFilterModal(false)}>
                  <MaterialIcons name="close" size={20} color="#2F2B3A" />
                </Pressable>
              </View>
            </View>

            <Text style={styles.filterSectionTitle}>GRAVEDAD</Text>
            <View style={styles.filterSeverityRow}>
              {(['Critico','Alto','Medio','Bajo'] as Incident['severity'][]).map((sev) => (
                <Pressable
                  key={sev}
                  onPress={() => {
                    setTempSelectedSeverities((prev) =>
                      prev.includes(sev) ? prev.filter((p) => p !== sev) : [...prev, sev]
                    );
                  }}
                  style={[
                    styles.severitySelectChip,
                    tempSelectedSeverities.includes(sev) ? styles.severitySelectChipActive : undefined,
                  ]}>
                  <Text style={styles.severitySelectText}>{INCIDENT_SEVERITY_LABELS[sev]}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable
              style={styles.applyFiltersButton}
              onPress={() => {
                setSelectedSeverities(tempSelectedSeverities);
                setShowFilterModal(false);
              }}>
              <Text style={styles.applyFiltersText}>Aplicar filtros</Text>
            </Pressable>
          </View>
        </Pressable>
      ) : null}

      <MapCanvas
        mapRef={mapRef}
        incidents={incidents}
        filteredIncidents={filteredIncidents}
        searchPreview={selectedSearchPreview}
        routePreview={routePreview ? {
          name: routePreview.name,
          distanceKm: routePreview.distanceKm,
          coordinates: routePreview.coordinates,
        } : undefined}
        openIncidentDetail={openIncidentDetail}
      />

      {routePreview ? (
        <View style={[styles.routePreviewBanner, { top: insets.top + 112 }]}>
          <View style={styles.routePreviewBadge}>
            <MaterialIcons name="alt-route" size={14} color="#FFFFFF" />
          </View>
          <View style={styles.routePreviewTextBlock}>
            <Text style={styles.routePreviewTitle}>{routePreview.name}</Text>
            <Text style={styles.routePreviewSubtitle}>{Math.round(routePreview.distanceKm)} km</Text>
          </View>
          <Pressable
            onPress={clearRoutePreview}
            style={styles.routePreviewCloseButton}
            accessibilityRole="button"
            accessibilityLabel="Cerrar navegación de ruta">
            <MaterialIcons name="close" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      ) : null}

      <Pressable
        onPress={centerToUserLocation}
        style={[
          styles.locationFab,
          {
            bottom: insets.bottom + (selectedIncident ? 320 : LOCATION_FAB_BOTTOM_OFFSET),
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Ir a mi ubicacion">
        {centeringUser ? (
          <ActivityIndicator size="small" color={PRIMARY} />
        ) : (
          <MaterialIcons name="my-location" size={22} color={PRIMARY} />
        )}
      </Pressable>

      {loading ? (
        <View pointerEvents="none" style={[styles.loadingOverlay, { top: insets.top + 106 }]}>
          <ActivityIndicator size="small" color={PRIMARY} />
          <Text style={styles.loadingText}>Cargando mapa...</Text>
        </View>
      ) : null}

      {infoMessage ? (
        <View
          pointerEvents="none"
          style={[styles.infoBanner, { bottom: insets.bottom + (selectedIncident ? 330 : 94) }]}>
          <Text style={styles.infoText}>{infoMessage}</Text>
        </View>
      ) : null}

      {selectedIncident ? (
        <>
          <Pressable
            style={styles.sheetOverlay}
            onPress={closeIncidentDetail}
          />
          <View
            style={[
              styles.detailSheet,
              {
                maxHeight: sheetExpanded ? '90%' : '50%',
                paddingBottom: insets.bottom + 10,
              },
            ]}>
          <Pressable
            hitSlop={8}
            onTouchStart={(event) => handleSheetTouchStart(event.nativeEvent.pageY)}
            onTouchEnd={(event) => handleSheetTouchEnd(event.nativeEvent.pageY)}
            style={styles.sheetHandle}>
            <View style={styles.sheetHandleBar} />
          </Pressable>
          <ScrollView
            scrollEnabled
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={styles.detailSheetContent}>
            <View style={styles.sheetHeaderRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{INCIDENT_TYPE_LABELS[selectedIncident.type]}</Text>
              </View>
              <Text style={styles.relativeText}>{formatRelativeTime(selectedIncident.startAt)}</Text>
            </View>

            <Text style={styles.sheetTitle}>{selectedIncident.title}</Text>

            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: INCIDENT_TYPE_COLORS[selectedIncident.type] }]} />
              <Text style={styles.locationText}>{selectedIncident.locationText}</Text>
            </View>

            <View style={styles.chipsRow}>
              <StatusChip text={INCIDENT_STATUS_LABELS[selectedIncident.status]} />
              <SeverityChip text={INCIDENT_SEVERITY_LABELS[selectedIncident.severity]} severity={selectedIncident.severity} />
              <AuthorityChip text={selectedIncident.authority} />
            </View>

            {selectedIncidentProgress ? (
              <View style={styles.progressBlock}>
                <Text style={styles.progressLabel}>{selectedIncidentProgress.label}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${selectedIncidentProgress.percent}%` }]} />
                </View>
              </View>
            ) : null}

            <Text style={styles.descriptionText}>{selectedIncident.description}</Text>

            {selectedIncident.imageUrls && selectedIncident.imageUrls.length > 0 ? (
              <View style={styles.imagesSection}>
                <Text style={styles.imagesTitle}>Imagenes adjuntas</Text>
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.imagesRow}>
                  {selectedIncident.imageUrls.map((imageUrl) => (
                    <Image key={imageUrl} source={{ uri: imageUrl }} style={styles.reportImage} contentFit="cover" />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {selectedIncident.status !== 'resuelto' ? (
              <Pressable
                style={styles.routeButton}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/rutas',
                    params: {
                      incidentId: selectedIncident.id,
                      incidentLat: String(selectedIncident.latitude),
                      incidentLng: String(selectedIncident.longitude),
                    },
                  })
                }>
                <Text style={styles.routeButtonText}>Ver ruta</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            ) : (
              <Pressable style={[styles.routeButton, styles.routeButtonDisabled]} disabled>
                <Text style={styles.routeButtonText}>Reporte resuelto</Text>
              </Pressable>
            )}

            <Pressable onPress={closeIncidentDetail} style={styles.closeSheetButton}>
              <Text style={styles.closeSheetText}>Cerrar</Text>
            </Pressable>
          </ScrollView>
        </View>
        </>
      ) : null}
    </View>
  );
}

function formatRelativeTime(dateIso: string): string {
  const elapsedMs = Date.now() - new Date(dateIso).getTime();
  const minutes = Math.floor(elapsedMs / 60000);

  if (minutes < 1) {
    return 'hace menos de 1 min';
  }

  if (minutes < 60) {
    return `hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `hace ${hours} h`;
  }

  return `hace ${Math.floor(hours / 24)} d`;
}

function buildProgress(startAt: string, endAt: string) {
  const now = Date.now();
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const total = Math.max(end - start, 1);
  const elapsed = Math.min(Math.max(now - start, 0), total);
  const percent = Math.round((elapsed / total) * 100);
  const remainingMinutes = Math.max(Math.ceil((end - now) / 60000), 0);

  return {
    percent,
    label:
      remainingMinutes > 0
        ? `Tiempo estimado: ${remainingMinutes} min restantes`
        : 'Tiempo estimado: finalizado',
  };
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeNominatimPayload(payload: unknown): NominatimSuggestion[] {
  if (!Array.isArray(payload)) {
    return [];
  }

  return payload.filter((item): item is NominatimSuggestion => {
    if (!item || typeof item !== 'object') {
      return false;
    }

    const candidate = item as Partial<NominatimSuggestion>;
    return (
      typeof candidate.lat === 'string' &&
      typeof candidate.lon === 'string' &&
      typeof candidate.display_name === 'string'
    );
  });
}

async function resolveSearchArea(latitude: number, longitude: number): Promise<SearchArea | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=es`,
      {
        headers: {
          Accept: 'application/json',
          'Accept-Language': 'es',
          'User-Agent': 'Revibo/1.0',
        },
      },
    );

    const payload = await response.json().catch(() => null);
    const address = payload?.address ?? {};

    if (!response.ok || !payload || typeof payload !== 'object') {
      return null;
    }

    const city = address.city || address.town || address.municipality || address.county || address.suburb;
    const department = address.state || address.region || address.county;

    return city || department
      ? {
          city,
          department,
        }
      : null;
  } catch {
    return null;
  }
}

function extractSuggestionCoordinates(suggestion: NominatimSuggestion): Array<{ latitude: number; longitude: number }> {
  const geojson = suggestion.geojson;

  if (!geojson || !geojson.type || geojson.coordinates == null) {
    return [];
  }

  const toPoint = (pair: unknown): { latitude: number; longitude: number } | null => {
    if (!Array.isArray(pair) || pair.length < 2) {
      return null;
    }

    const longitude = Number(pair[0]);
    const latitude = Number(pair[1]);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    return { latitude, longitude };
  };

  const extractLine = (line: unknown): Array<{ latitude: number; longitude: number }> => {
    if (!Array.isArray(line)) {
      return [];
    }

    return line.map(toPoint).filter((point): point is { latitude: number; longitude: number } => point !== null);
  };

  if (geojson.type === 'Point') {
    const point = toPoint(geojson.coordinates);
    return point ? [point] : [];
  }

  if (geojson.type === 'LineString') {
    return extractLine(geojson.coordinates);
  }

  if (geojson.type === 'MultiLineString' && Array.isArray(geojson.coordinates) && geojson.coordinates.length > 0) {
    return extractLine(geojson.coordinates[0]);
  }

  if (geojson.type === 'Polygon' && Array.isArray(geojson.coordinates) && geojson.coordinates.length > 0) {
    return extractLine(geojson.coordinates[0]);
  }

  if (geojson.type === 'MultiPolygon' && Array.isArray(geojson.coordinates) && geojson.coordinates.length > 0) {
    const firstPolygon = geojson.coordinates[0];
    if (Array.isArray(firstPolygon) && firstPolygon.length > 0) {
      return extractLine(firstPolygon[0]);
    }
  }

  return [];
}

function formatFallbackLocation(displayName: string): string {
  const parts = displayName.split(',').map((part) => part.trim()).filter(Boolean);

  if (parts.length === 0) {
    return 'Bolivia';
  }

  if (parts.length === 1) {
    return `${parts[0]}, Bolivia`;
  }

  return `${parts.slice(1, 3).join(' · ')}, Bolivia`;
}

function formatRoadName(address: NonNullable<NominatimSuggestion['address']>): string | null {
  const road = address.road || address.pedestrian || address.cycleway || address.footway;
  if (!road) {
    return address.junction ? `Intersección ${address.junction}` : null;
  }

  if (address.house_number) {
    return `${road} ${address.house_number}`;
  }

  return road;
}

function formatNominatimSuggestion(suggestion: NominatimSuggestion): { title: string; subtitle: string } {
  const address = suggestion.address ?? {};
  const roadLabel = formatRoadName(address);
  const locality = [
    address.suburb,
    address.neighbourhood,
    address.city,
    address.town,
    address.municipality,
    address.county,
    address.department,
    address.state,
  ].filter((part): part is string => Boolean(part));

  if (roadLabel) {
    return {
      title: roadLabel,
      subtitle: locality.join(' · ') || formatFallbackLocation(suggestion.display_name),
    };
  }

  if (suggestion.type === 'junction' || address.junction) {
    const junctionLabel = address.junction ? `Intersección ${address.junction}` : 'Intersección';

    return {
      title: junctionLabel,
      subtitle: locality.join(' · ') || formatFallbackLocation(suggestion.display_name),
    };
  }

  if (suggestion.class === 'highway') {
    return {
      title: suggestion.display_name.split(',')[0] || suggestion.display_name,
      subtitle: locality.join(' · ') || formatFallbackLocation(suggestion.display_name),
    };
  }

  return {
    title: suggestion.display_name.split(',')[0] || suggestion.display_name,
    subtitle: locality.join(' · ') || formatFallbackLocation(suggestion.display_name),
  };
}

function formatSuggestionKind(suggestion: NominatimSuggestion): string {
  const address = suggestion.address ?? {};
  const road = address.road || address.pedestrian || address.cycleway || address.footway;
  const normalizedType = normalizeSearchText(suggestion.type ?? '');

  if (address.junction || suggestion.type === 'junction') {
    return 'Intersección';
  }

  if (road) {
    const normalizedRoad = normalizeSearchText(road);

    if (
      normalizedType.includes('motorway') ||
      normalizedType.includes('trunk') ||
      normalizedRoad.includes('autopista')
    ) {
      return 'Autopista';
    }

    if (
      normalizedType.includes('primary') ||
      normalizedType.includes('secondary') ||
      normalizedType.includes('tertiary') ||
      normalizedType.includes('road') ||
      normalizedRoad.includes('carretera')
    ) {
      return 'Carretera';
    }

    if (normalizedRoad.includes('avenida') || normalizedRoad.includes('av.')) {
      return 'Avenida';
    }

    return 'Calle';
  }

  if (suggestion.class === 'highway') {
    return 'Carretera';
  }

  return 'Ubicación';
}

function rankNominatimSuggestions(
  suggestions: NominatimSuggestion[],
  query: string,
  userCoordinate: { latitude: number; longitude: number } | null,
): NominatimSuggestion[] {
  const normalizedQuery = normalizeSearchText(query);

  const scoreSuggestion = (suggestion: NominatimSuggestion): number => {
    const address = suggestion.address ?? {};
    const display = normalizeSearchText(suggestion.display_name);
    const road = normalizeSearchText(address.road || address.pedestrian || address.cycleway || address.footway || '');
    const junction = normalizeSearchText(address.junction || '');
    const city = normalizeSearchText(address.city || address.town || address.municipality || address.department || address.state || '');

    let score = 0;

    if (display.includes(normalizedQuery)) score += 120;
    if (road.includes(normalizedQuery)) score += 150;
    if (junction.includes(normalizedQuery)) score += 140;
    if (city.includes(normalizedQuery)) score += 40;

    if (suggestion.class === 'highway') score += 30;
    if (suggestion.type === 'junction') score += 60;

    if (userCoordinate) {
      const lat = Number(suggestion.lat);
      const lon = Number(suggestion.lon);
      const distance = Number.isFinite(lat) && Number.isFinite(lon)
        ? haversineDistanceKm(userCoordinate.latitude, userCoordinate.longitude, lat, lon)
        : 9999;

      score += Math.max(0, 180 - distance * 8);
    }

    score += Number.isFinite(suggestion.importance ?? NaN) ? (suggestion.importance ?? 0) * 18 : 0;

    return score;
  };

  return [...suggestions].sort((a, b) => scoreSuggestion(b) - scoreSuggestion(a));
}

function haversineDistanceKm(latA: number, lonA: number, latB: number, lonB: number): number {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLatitude = toRadians(latB - latA);
  const deltaLongitude = toRadians(lonB - lonA);
  const latitude1 = toRadians(latA);
  const latitude2 = toRadians(latB);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.sin(deltaLongitude / 2) ** 2 * Math.cos(latitude1) * Math.cos(latitude2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function StatusChip({ text }: { text: string }) {
  return (
    <View style={styles.statusChip}>
      <Text style={styles.statusChipText}>{text}</Text>
    </View>
  );
}

function SeverityChip({ text, severity }: { text: string; severity: Incident['severity'] }) {
  const severityStyle =
    severity === 'Critico'
      ? styles.severityHigh
      : severity === 'Alto'
      ? styles.severityMedium
      : styles.severityLow;

  return (
    <View style={[styles.severityChip, severityStyle]}>
      <Text style={styles.severityChipText}>{text}</Text>
    </View>
  );
}

function AuthorityChip({ text }: { text: string }) {
  return (
    <View style={styles.authorityChip}>
      <Text style={styles.authorityChipText}>{text}</Text>
    </View>
  );
}

type FilterChipProps = {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
};

function FilterChip({ label, count, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipInactive]}>
      <Text style={[styles.filterChipLabel, active ? styles.filterChipLabelActive : styles.filterChipLabelInactive]}>
        {label}
      </Text>
      <Text style={[styles.filterChipCount, active ? styles.filterChipLabelActive : styles.filterChipLabelInactive]}>
        {count}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EDE9FF',
  },
  topPanel: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 12,
    gap: 12,
  },
  searchInput: {
    height: 40,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingRight: 56,
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.14)',
    color: '#FFFFFF',
    fontSize: 14,
  },
  filtersContent: {
    gap: 8,
    paddingRight: 12,
  },
  filterChip: {
    minWidth: 84,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#FFFFFF',
  },
  filterChipInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  filterChipLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipCount: {
    fontSize: 13,
    fontWeight: '700',
  },
  filterChipLabelActive: {
    color: PRIMARY,
  },
  filterChipLabelInactive: {
    color: '#F4F0FF',
  },
  incidentMarkerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 3,
    paddingTop: 0,
    paddingHorizontal: 0,
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  incidentMarkerRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentMarkerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentMarkerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: -2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
  },
  filterButton: {
    width: 42,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    position: 'absolute',
    right: 6,
    top: 0,
  },
  suggestionsBox: {
    position: 'absolute',
    left: 14,
    right: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    zIndex: 30,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  suggestionsBoxInline: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    zIndex: 30,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  suggestionRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0EEF8',
    gap: 4,
  },
  suggestionMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  suggestionTitle: {
    color: '#2F2B3A',
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
  },
  suggestionType: {
    color: '#6F61DD',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionSubtitle: {
    color: '#7D7891',
    fontSize: 12,
  emptySuggestionState: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    gap: 4,
  },
  emptySuggestionTitle: {
    color: '#2F2B3A',
    fontSize: 13,
    fontWeight: '800',
  },
  emptySuggestionSubtitle: {
    color: '#7D7891',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 40,
  },
  filterModal: {
    width: '92%',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2F2B3A',
  },
  clearText: {
    color: '#6F61DD',
    fontWeight: '700',
  },
  filterSectionTitle: {
    color: '#4C4958',
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 8,
  },
  filterSeverityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  severitySelectChip: {
    backgroundColor: '#F4F0FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  severitySelectChipActive: {
    backgroundColor: 'rgba(91,63,217,0.12)',
    borderWidth: 1,
    borderColor: '#6F61DD',
  },
  severitySelectText: {
    color: '#2F2B3A',
    fontWeight: '700',
  },
  applyFiltersButton: {
    marginTop: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#6F61DD',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  applyFiltersText: {
    color: '#6F61DD',
    fontWeight: '800',
  },
  map: {
    flex: 1,
  },
  locationFab: {
    position: 'absolute',
    right: 16,
    bottom: 92,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 3,
    },
    elevation: 5,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 112,
    left: 14,
    right: 14,
    borderRadius: 10,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  loadingText: {
    color: '#2E2B39',
    fontWeight: '600',
  },
  infoBanner: {
    position: 'absolute',
    bottom: 18,
    left: 14,
    right: 14,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(20, 20, 28, 0.82)',
  },
  infoText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  routePreviewBanner: {
    position: 'absolute',
    left: 14,
    right: 14,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(91, 63, 217, 0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#2E1E82',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 4,
  },
  routePreviewBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routePreviewTextBlock: {
    flex: 1,
  },
  routePreviewTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  routePreviewSubtitle: {
    color: '#E8E3FF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  searchPreviewBanner: {
    position: 'absolute',
    left: 14,
    right: 14,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.94)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.24,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 6,
  },
  searchPreviewBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routePreviewCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  detailSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    minHeight: 280,
    maxHeight: '50%',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
  },
  detailSheetContent: {
    gap: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 64,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  sheetHandleBar: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#D8D4E0',
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    borderRadius: 12,
    backgroundColor: '#FDE8E8',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    color: '#D05353',
    fontWeight: '700',
    fontSize: 12,
  },
  relativeText: {
    color: '#78748A',
    fontSize: 12,
    fontWeight: '600',
  },
  sheetTitle: {
    fontSize: 34,
    lineHeight: 38,
    color: '#2F2B3A',
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
  },
  locationText: {
    flex: 1,
    color: '#565469',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#66A63D',
    backgroundColor: '#EFF9E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusChipText: {
    color: '#5F8E2F',
    fontSize: 12,
    fontWeight: '700',
  },
  severityChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  severityHigh: {
    borderColor: '#E0A33C',
    backgroundColor: '#FEF2DE',
  },
  severityMedium: {
    borderColor: '#D7C758',
    backgroundColor: '#FCF8E0',
  },
  severityLow: {
    borderColor: '#5EA679',
    backgroundColor: '#E9F8EE',
  },
  severityChipText: {
    color: '#AD7419',
    fontSize: 12,
    fontWeight: '700',
  },
  authorityChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#6F61DD',
    backgroundColor: '#EEEAFE',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  authorityChipText: {
    color: '#6558C9',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBlock: {
    gap: 6,
  },
  progressLabel: {
    color: '#7C788A',
    fontSize: 13,
    fontWeight: '600',
  },
  progressTrack: {
    width: '100%',
    height: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(91, 63, 217, 0.12)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: PRIMARY,
  },
  routeButtonDisabled: {
    opacity: 0.55,
  },
  routeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  imagesSection: {
    gap: 8,
  },
  imagesTitle: {
    color: '#2F2B3A',
    fontWeight: '700',
    fontSize: 15,
  },
  imagesRow: {
    gap: 10,
    paddingRight: 8,
  },
  reportImage: {
    width: 190,
    height: 120,
    borderRadius: 12,
    backgroundColor: '#ECECF2',
  },
  closeSheetButton: {
    alignSelf: 'center',
    paddingVertical: 4,
  },
  closeSheetText: {
    color: '#6F61DD',
    fontWeight: '700',
  },
});
