import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchIncidentDetailById } from '@/features/incidents/incidents.service';
import {
    INCIDENT_SEVERITY_LABELS,
    INCIDENT_STATUS_LABELS,
    INCIDENT_TYPE_COLORS,
    INCIDENT_TYPE_LABELS,
    Incident,
    IncidentSeverity,
    IncidentStatus,
} from '@/features/incidents/types';

const PRIMARY = '#5B3FD9';

export default function IncidentDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDetail = useCallback(async () => {
    if (!params.id) {
      setErrorMessage('No se recibio el identificador del reporte.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const detail = await fetchIncidentDetailById(params.id);
      setIncident(detail);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cargar el reporte.';
      setErrorMessage(message);
      setIncident(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const relativeTime = useMemo(() => {
    if (!incident) {
      return '';
    }

    return formatRelativeTime(incident.startAt);
  }, [incident]);

  const progressData = useMemo(() => {
    if (!incident?.endAt) {
      return null;
    }

    return buildProgress(incident.startAt, incident.endAt);
  }, [incident]);

  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ headerShown: false }} />

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.stateText}>Cargando detalle...</Text>
        </View>
      ) : null}

      {!loading && errorMessage ? (
        <View style={styles.centerState}>
          <Text style={styles.errorTitle}>No se pudo cargar el detalle</Text>
          <Text style={styles.stateText}>{errorMessage}</Text>
          <Pressable onPress={loadDetail} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {!loading && !errorMessage && incident ? (
        <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.mapWrapper}>
            <MapView
              style={styles.miniMap}
              initialRegion={{
                latitude: incident.latitude,
                longitude: incident.longitude,
                latitudeDelta: 0.012,
                longitudeDelta: 0.012,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}>
              {incident.geometryType === 'LineString' ? (
                <>
                  <Polyline
                    coordinates={incident.mapCoordinates}
                    strokeColor={INCIDENT_TYPE_COLORS[incident.type]}
                    strokeWidth={5}
                  />
                  <Marker
                    coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
                    pinColor={INCIDENT_TYPE_COLORS[incident.type]}
                  />
                </>
              ) : (
                <Marker
                  coordinate={{ latitude: incident.latitude, longitude: incident.longitude }}
                  pinColor={INCIDENT_TYPE_COLORS[incident.type]}
                />
              )}
            </MapView>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver al mapa"
              onPress={() => router.back()}
              style={[styles.backButton, { top: insets.top + 8 }]}
            >
              <MaterialIcons name="chevron-left" size={22} color="#3B3650" />
            </Pressable>
          </View>

          <View style={styles.contentCard}>
            <View style={styles.titleRow}>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>{INCIDENT_TYPE_LABELS[incident.type]}</Text>
              </View>
              <Text style={styles.relativeText}>{relativeTime}</Text>
            </View>

            <Text style={styles.title}>{incident.title}</Text>

            <View style={styles.locationRow}>
              <View style={[styles.locationDot, { backgroundColor: INCIDENT_TYPE_COLORS[incident.type] }]} />
              <Text style={styles.locationText}>{incident.locationText}</Text>
            </View>

            <View style={styles.chipsRow}>
              <Chip label={INCIDENT_STATUS_LABELS[incident.status]} tone={statusChipStyle(incident.status)} />
              <Chip label={INCIDENT_SEVERITY_LABELS[incident.severity]} tone={severityChipStyle(incident.severity)} />
              <Chip label={incident.authority} tone={{ container: styles.authorityChip, textColor: '#6558C9' }} />
            </View>

            {progressData ? (
              <View style={styles.progressBlock}>
                <Text style={styles.progressLabel}>{progressData.label}</Text>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${progressData.percent}%` }]} />
                </View>
              </View>
            ) : null}

            <Text style={styles.description}>{incident.description}</Text>

            {incident.imageUrls && incident.imageUrls.length > 0 ? (
              <View style={styles.imagesSection}>
                <Text style={styles.sectionTitle}>Imagenes adjuntas</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imagesRow}>
                  {incident.imageUrls.map((imageUrl) => (
                    <Image key={imageUrl} source={{ uri: imageUrl }} style={styles.reportImage} contentFit="cover" />
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {incident.status !== 'resuelto' ? (
              <Pressable
                style={styles.routeButton}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/rutas',
                    params: {
                      incidentId: incident.id,
                      incidentLat: String(incident.latitude),
                      incidentLng: String(incident.longitude),
                    },
                  })
                }>
                <Text style={styles.routeButtonText}>Ver ruta alternativa</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </View>
        </ScrollView>
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

  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function buildProgress(startAt: string, endAt: string) {
  const now = Date.now();
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  const total = Math.max(end - start, 1);
  const elapsed = Math.min(Math.max(now - start, 0), total);
  const percent = Math.round((elapsed / total) * 100);
  const remainingMinutes = Math.max(Math.ceil((end - now) / 60000), 0);

  const label =
    remainingMinutes > 0
      ? `Tiempo estimado: ${remainingMinutes} min restantes`
      : 'Tiempo estimado: finalizado';

  return {
    percent,
    label,
  };
}

type ChipTone = {
  container: object;
  textColor: string;
};

function Chip({ label, tone }: { label: string; tone: ChipTone }) {

  return (
    <View style={[styles.chipBase, tone.container]}>
      <Text style={[styles.chipText, { color: tone.textColor }]}>{label}</Text>
    </View>
  );
}

function statusChipStyle(status: IncidentStatus) {
  if (status === 'resuelto') {
    return { container: styles.statusResolved, textColor: '#3B71B3' };
  }

  if (status === 'archivado') {
    return { container: styles.statusArchived, textColor: '#737182' };
  }

  return { container: styles.statusActive, textColor: '#5F8E2F' };
}

function severityChipStyle(severity: IncidentSeverity) {
  if (severity === 'Critico') {
    return { container: styles.severityHigh, textColor: '#AD7419' };
  }

  if (severity === 'Alto') {
    return { container: styles.severityMedium, textColor: '#9A8B2E' };
  }

  return { container: styles.severityLow, textColor: '#3F7C57' };
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F8',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
  },
  stateText: {
    color: '#5C5A67',
    textAlign: 'center',
  },
  errorTitle: {
    color: '#2D2A38',
    fontWeight: '700',
    fontSize: 18,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  mapWrapper: {
    height: 208,
    backgroundColor: '#DCE2EA',
  },
  miniMap: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    left: 14,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentCard: {
    marginTop: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  title: {
    fontSize: 36,
    color: '#2F2B3A',
    fontWeight: '800',
    lineHeight: 40,
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
  chipBase: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusActive: {
    borderColor: '#66A63D',
    backgroundColor: '#EFF9E9',
  },
  statusResolved: {
    borderColor: '#4A90E2',
    backgroundColor: '#EBF4FF',
  },
  statusArchived: {
    borderColor: '#9A9AAA',
    backgroundColor: '#F3F3F7',
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
  authorityChip: {
    borderColor: '#6F61DD',
    backgroundColor: '#EEEAFE',
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
  description: {
    color: '#4C4958',
    lineHeight: 22,
    fontSize: 14,
    fontWeight: '600',
  },
  imagesSection: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2F2B3A',
  },
  imagesRow: {
    gap: 10,
    paddingRight: 16,
  },
  reportImage: {
    width: 210,
    height: 130,
    borderRadius: 12,
    backgroundColor: '#E8E8EE',
  },
  routeButton: {
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    minHeight: 52,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  routeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
