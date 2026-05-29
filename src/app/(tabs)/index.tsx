import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const DEFAULT_REGION: Region = {
  latitude: -17.3935,
  longitude: -66.157,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

type IncidentFilter = 'todos' | IncidentType;

type SearchParams = {
  routeId?: string | string[];
};

export default function MapHomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<SearchParams>();
  const mapRef = useRef<MapView | null>(null);
  const insets = useSafeAreaInsets();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<IncidentFilter>('todos');
  const [selectedSeverities, setSelectedSeverities] = useState<Incident['severity'][]>([
    'Critico',
    'Alto',
    'Medio',
    'Bajo',
  ]);
  const [tempSelectedSeverities, setTempSelectedSeverities] = useState<Incident['severity'][]>(selectedSeverities);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Array<any>>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [userCoordinate, setUserCoordinate] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
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
      450
    );
  }, []);

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
    list = list.filter((incident) => selectedSeverities.includes(incident.severity));

    return list;
  }, [incidents, selectedFilter, selectedSeverities]);

  const selectedIncidentProgress = useMemo(() => {
    if (!selectedIncident?.endAt) {
      return null;
    }

    return buildProgress(selectedIncident.startAt, selectedIncident.endAt);
  }, [selectedIncident]);

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

  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    setSelectedIncident(null);

    if (filteredIncidents.length === 0) {
      mapRef.current.animateToRegion(DEFAULT_REGION, 550);
      return;
    }

    if (filteredIncidents.length === 1) {
      const target = filteredIncidents[0];

      mapRef.current.animateToRegion(
        {
          latitude: target.latitude,
          longitude: target.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        550
      );

      return;
    }

    mapRef.current.fitToCoordinates(
      filteredIncidents.flatMap((incident) => incident.mapCoordinates),
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
  }, [selectedFilter, filteredIncidents]);

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

  // Search suggestions (Nominatim) with debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length === 0) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        setLoadingSuggestions(true);
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}&addressdetails=1&limit=6`;

        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            'Accept-Language': 'es',
            'User-Agent': 'Revibo/1.0',
          },
        });

        if (cancelled) return;

        if (!res.ok) {
          setSuggestions([]);
          setLoadingSuggestions(false);
          return;
        }

        const data = await res.json();
        setSuggestions(Array.isArray(data) ? data : []);
      } catch (e) {
        if ((e as any)?.name === 'AbortError') return;
        setSuggestions([]);
      } finally {
        if (!cancelled) setLoadingSuggestions(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <View style={[styles.topPanel, { paddingTop: insets.top + 12 }]}>
        <View style={styles.searchRow}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar calle, avenida o carretera"
            placeholderTextColor="#D6D0FF"
            style={styles.searchInput}
          />
          <Pressable onPress={() => setShowFilterModal(true)} style={styles.filterButton}>
            <MaterialIcons name="filter-list" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}>
          <FilterChip
            label="Todos"
            count={incidents.length}
            active={selectedFilter === 'todos'}
            onPress={() => setSelectedFilter('todos')}
          />
          {INCIDENT_TYPES.map((type) => (
            <FilterChip
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
            ) : (
              suggestions.map((s) => (
                <Pressable
                  key={s.place_id ?? s.osm_id ?? s.lat + s.lon}
                  onPress={() => {
                    const lat = parseFloat(s.lat);
                    const lon = parseFloat(s.lon);
                    mapRef.current?.animateToRegion({ latitude: lat, longitude: lon, latitudeDelta: 0.01, longitudeDelta: 0.01 }, 450);
                    setSuggestions([]);
                    setSearchQuery('');
                  }}
                  style={styles.suggestionRow}>
                  <Text style={styles.suggestionText}>{s.display_name}</Text>
                </Pressable>
              ))
            )}
          </View>
        ) : null}
      </View>


      {showFilterModal ? (
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filtrar incidentes</Text>
              <Pressable onPress={() => { setTempSelectedSeverities(['Critico','Alto','Medio','Bajo']); }}>
                <Text style={styles.clearText}>Limpiar</Text>
              </Pressable>
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
        </View>
      ) : null}

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
              <Marker
                key={incident.id}
                coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
                pinColor={INCIDENT_TYPE_COLORS[incident.type]}
                title={incident.title}
                description={incident.description}
                onPress={() => openIncidentDetail(incident)}
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
              <Marker
                key={`${incident.id}-center`}
                coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
                pinColor={INCIDENT_TYPE_COLORS[incident.type]}
                title={incident.title}
                description={incident.description}
                onPress={() => openIncidentDetail(incident)}
              />
            </Fragment>
          );
        })}
      </MapView>

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
  },
  suggestionText: {
    color: '#2F2B3A',
  },
  filterModalOverlay: {
    position: 'absolute',
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
    borderRadius: 6,
    backgroundColor: '#E7E7EC',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E24A4A',
  },
  descriptionText: {
    color: '#4C4958',
    lineHeight: 22,
    fontSize: 14,
    fontWeight: '600',
  },
  routeButton: {
    borderRadius: 14,
    backgroundColor: PRIMARY,
    minHeight: 52,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
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
