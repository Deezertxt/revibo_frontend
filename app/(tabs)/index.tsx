import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ConnectivityError,
  fetchActiveIncidents,
} from '@/features/incidents/incidents.service';
import {
  INCIDENT_TYPE_COLORS,
  INCIDENT_TYPE_LABELS,
  Incident,
  IncidentType,
} from '@/features/incidents/types';

const PRIMARY = '#5B3FD9';
const LOCATION_FAB_BOTTOM_OFFSET = 8;

const DEFAULT_REGION: Region = {
  latitude: -17.3935,
  longitude: -66.157,
  latitudeDelta: 0.08,
  longitudeDelta: 0.08,
};

type IncidentFilter = 'todos' | IncidentType;

export default function MapHomeScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const insets = useSafeAreaInsets();

  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<IncidentFilter>('todos');
  const [userCoordinate, setUserCoordinate] = useState<{ latitude: number; longitude: number } | null>(
    null
  );
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [centeringUser, setCenteringUser] = useState(false);
  const hasAppliedInitialFitRef = useRef(false);

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

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;

    const loadMapData = async () => {
      setLoading(true);
      setInfoMessage(null);

      try {
        const [activeIncidents, locationPermission] = await Promise.all([
          fetchActiveIncidents(),
          Location.requestForegroundPermissionsAsync(),
        ]);

        setIncidents(activeIncidents);

        if (locationPermission.status === 'granted') {
          const position = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          setUserCoordinate({
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
        }
      } catch (error) {
        if (error instanceof ConnectivityError) {
          setInfoMessage(error.message);
          setIncidents([]);
        } else {
          setInfoMessage('No fue posible cargar los reportes en este momento.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadMapData();

    return () => {
      locationSubscription?.remove();
    };
  }, []);

  const incidentCounts = useMemo(() => {
    return incidents.reduce(
      (accumulator, incident) => {
        accumulator[incident.type] += 1;
        return accumulator;
      },
      {
        accidente: 0,
        bloqueo: 0,
        mantenimiento: 0,
      }
    );
  }, [incidents]);

  const filteredIncidents = useMemo(() => {
    if (selectedFilter === 'todos') {
      return incidents;
    }

    return incidents.filter((incident) => incident.type === selectedFilter);
  }, [incidents, selectedFilter]);

  useEffect(() => {
    if (!incidents.length || hasAppliedInitialFitRef.current || !mapRef.current) {
      return;
    }

    hasAppliedInitialFitRef.current = true;

    mapRef.current.fitToCoordinates(
      incidents.map((incident) => ({
        latitude: incident.latitude,
        longitude: incident.longitude,
      })),
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
      filteredIncidents.map((incident) => ({
        latitude: incident.latitude,
        longitude: incident.longitude,
      })),
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

  return (
    <View style={styles.container}>
      <View style={[styles.topPanel, { paddingTop: insets.top + 12 }]}>
        <TextInput
          editable={false}
          placeholder="Buscar direccion o destino..."
          placeholderTextColor="#D6D0FF"
          style={styles.searchInput}
        />

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
          <FilterChip
            label={INCIDENT_TYPE_LABELS.accidente}
            count={incidentCounts.accidente}
            active={selectedFilter === 'accidente'}
            onPress={() => setSelectedFilter('accidente')}
          />
          <FilterChip
            label={INCIDENT_TYPE_LABELS.bloqueo}
            count={incidentCounts.bloqueo}
            active={selectedFilter === 'bloqueo'}
            onPress={() => setSelectedFilter('bloqueo')}
          />
          <FilterChip
            label={INCIDENT_TYPE_LABELS.mantenimiento}
            count={incidentCounts.mantenimiento}
            active={selectedFilter === 'mantenimiento'}
            onPress={() => setSelectedFilter('mantenimiento')}
          />
        </ScrollView>
      </View>

      <MapView
        ref={mapRef}
        initialRegion={DEFAULT_REGION}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton={false}
        followsUserLocation={false}
        scrollEnabled
        zoomEnabled
        rotateEnabled
        pitchEnabled>
        {filteredIncidents.map((incident) => (
          <Marker
            key={incident.id}
            coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
            pinColor={INCIDENT_TYPE_COLORS[incident.type]}
            title={incident.title}
            description={incident.description}
            onPress={() =>
              router.push({
                pathname: '/report/[id]',
                params: { id: incident.id },
              })
            }
          />
        ))}
      </MapView>

      <Pressable
        onPress={centerToUserLocation}
        style={[styles.locationFab, { bottom: insets.bottom + LOCATION_FAB_BOTTOM_OFFSET }]}
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
        <View pointerEvents="none" style={[styles.infoBanner, { bottom: insets.bottom + 94 }]}>
          <Text style={styles.infoText}>{infoMessage}</Text>
        </View>
      ) : null}
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
});
