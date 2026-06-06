import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchActiveIncidents } from '@/features/incidents/incidents.service';
import {
  INCIDENT_TYPE_COLORS,
  INCIDENT_TYPE_LABELS,
} from '@/features/incidents/types';
import { useAlertsStore, type AlertFilter, type AlertItem } from '@/shared/store/alertsStore';

const PRIMARY = '#5B3FD9';
const SURFACE = '#F6F2FF';

export default function AlertasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const alerts = useAlertsStore((state) => state.alerts);
  const selectedFilter = useAlertsStore((state) => state.selectedFilter);
  const setSelectedFilter = useAlertsStore((state) => state.setSelectedFilter);
  const syncFromIncidents = useAlertsStore((state) => state.syncFromIncidents);
  const openAlertOnMap = useAlertsStore((state) => state.openAlertOnMap);
  const markAllAsRead = useAlertsStore((state) => state.markAllAsRead);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadAlerts = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const incidents = await fetchActiveIncidents();
      let userLocation: { latitude: number; longitude: number } | null = null;

      const locationPermission = await Location.requestForegroundPermissionsAsync();

      if (locationPermission.status === 'granted') {
        const currentPosition = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        userLocation = {
          latitude: currentPosition.coords.latitude,
          longitude: currentPosition.coords.longitude,
        };
      }

      syncFromIncidents(incidents, userLocation);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'No fue posible cargar las alertas.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alerts.length === 0) {
      loadAlerts();
    } else {
      setLoading(false);
    }
  }, []);

  const filteredAlerts = useMemo(() => {
    if (selectedFilter === 'todas') {
      return alerts;
    }

    return alerts.filter((alert) => alert.kind === selectedFilter);
  }, [alerts, selectedFilter]);

  const counts = useMemo(
    () => ({
      todas: alerts.length,
      programados: alerts.filter((alert) => alert.kind === 'programado').length,
      cercania: alerts.filter((alert) => alert.kind === 'cercania').length,
    }),
    [alerts],
  );

  const unreadCount = useMemo(
    () => filteredAlerts.filter((alert) => alert.unread).length,
    [filteredAlerts],
  );

  const reviewedCount = filteredAlerts.length - unreadCount;

  const unreadAlerts = useMemo(
    () => filteredAlerts.filter((alert) => alert.unread),
    [filteredAlerts],
  );

  const reviewedAlerts = useMemo(
    () => filteredAlerts.filter((alert) => !alert.unread),
    [filteredAlerts],
  );

  return (
    <View style={[styles.screen, { paddingTop: insets.top, backgroundColor: PRIMARY }]}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.kicker}>Centro de notificaciones</Text>
          <Text style={styles.title}>Alertas</Text>
          <Text style={styles.subtitle}>Toca para ir al reporte</Text>
          
        </View>

        <View style={styles.headerChipsRow}>
          <Pressable style={[styles.headerStatChip, styles.chipSmall]}>
            <View style={styles.headerStatInnerRow}>
              <View style={[styles.headerStatDot, { backgroundColor: '#FFD94D' }]} />
              <Text style={styles.headerStatText}>{unreadCount} activas</Text>
            </View>
          </Pressable>

          <Pressable style={[styles.headerStatChip, styles.headerStatChipSoft, styles.chipSmall]}>
            <View style={styles.headerStatInnerRow}>
              <View style={[styles.headerStatDot, { backgroundColor: '#D8D0FF' }]} />
              <Text style={styles.headerStatText}>{reviewedCount} revisadas</Text>
            </View>
          </Pressable>

          <Pressable onPress={markAllAsRead} style={({ pressed }) => [styles.headerStatChip, styles.markAllAsChip, styles.chipLarge, pressed && styles.pressed]}>
            <MaterialIcons style={styles.chipIcon} name="done-all" size={14} color="#FFFFFF" />
            <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.headerStatText, { lineHeight: 18 }]}>Marcar todo</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.content, { backgroundColor: SURFACE }] }>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {([
            ['todas', 'Todas', counts.todas],
            ['programados', 'Programados', counts.programados],
            ['cercania', 'Cercanía', counts.cercania],
          ] as Array<[AlertFilter, string, number]>).map(([filter, label, count]) => (
            <FilterChip
              key={filter}
              label={label}
              count={count}
              active={selectedFilter === filter}
              onPress={() => setSelectedFilter(filter)}
            />
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={PRIMARY} />
            <Text style={styles.centerStateText}>Cargando historial...</Text>
          </View>
        ) : errorMessage ? (
          <View style={styles.centerState}>
            <MaterialIcons name="error-outline" size={34} color={PRIMARY} />
            <Text style={styles.centerStateTitle}>No se pudo cargar</Text>
            <Text style={styles.centerStateText}>{errorMessage}</Text>
            <Pressable onPress={loadAlerts} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : filteredAlerts.length === 0 ? (
          <View style={styles.centerState}>
            <MaterialIcons name="notifications-none" size={34} color={PRIMARY} />
            <Text style={styles.centerStateTitle}>Sin alertas</Text>
            <Text style={styles.centerStateText}>
              Cuando lleguen nuevos reportes, apareceran aqui.
            </Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
          >
            {unreadAlerts.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Nuevas</Text>
                {unreadAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onPress={() => {
                      openAlertOnMap(alert.id);
                      router.replace('/(tabs)');
                    }}
                  />
                ))}
              </>
            ) : null}

            {reviewedAlerts.length > 0 ? (
              <>
                <Text style={styles.sectionTitle}>Anteriores</Text>
                {reviewedAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onPress={() => {
                      openAlertOnMap(alert.id);
                      router.replace('/(tabs)');
                    }}
                  />
                ))}
              </>
            ) : null}
          </ScrollView>
        )}
      </View>
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
      style={[styles.filterChip, active ? styles.filterChipActive : styles.filterChipInactive]}
    >
      <Text style={[styles.filterChipLabel, active ? styles.filterChipLabelActive : styles.filterChipLabelInactive]}>
        {label}
      </Text>
      <Text style={[styles.filterChipCount, active ? styles.filterChipLabelActive : styles.filterChipLabelInactive]}>
        {count}
      </Text>
    </Pressable>
  );
}

function AlertCard({ alert, onPress }: { alert: AlertItem; onPress: () => void }) {
  const kindLabel =
    alert.kind === 'programado' ? 'Programado' : alert.kind === 'cercania' ? 'Cercanía' : 'General';

  return (
    <View style={[styles.card, alert.unread ? styles.cardUnread : styles.cardReviewed]}>
      <View style={styles.cardTopRow}>
        <View style={styles.cardTitleRow}>
          <View style={[styles.iconSquare, { backgroundColor: `${INCIDENT_TYPE_COLORS[alert.incident.type]}22` }]}>
            <MaterialIcons name="notifications" size={16} color={INCIDENT_TYPE_COLORS[alert.incident.type]} />
          </View>
          <View style={styles.cardTextBlock}>
            <Text style={styles.cardTitle}>{alert.title}</Text>
            <Text style={styles.cardMeta}>
              {formatRelativeAlertTime(alert.createdAt)} · {kindLabel}
            </Text>
          </View>
        </View>

        {alert.unread ? <View style={styles.unreadDot} /> : <View style={styles.readDot} />}
      </View>

      <Text style={styles.cardMessage}>{alert.message}</Text>

      <View style={styles.cardPillsRow}>
        <InfoPill label={INCIDENT_TYPE_LABELS[alert.incident.type]} tone="violet" />
        {alert.distanceKm != null ? (
          <InfoPill label={`${alert.distanceKm.toFixed(1)} km`} tone="soft" />
        ) : null}
        {alert.incident.status !== 'activo' ? (
          <InfoPill label={alert.incident.status} tone="muted" />
        ) : null}
      </View>

      <Pressable onPress={onPress} style={styles.cardActionButton} android_ripple={{ color: '#2A1A80' }}>
        <MaterialIcons name="my-location" size={16} color="#FFFFFF" />
        <Text style={styles.cardActionText}>Centrar mapa</Text>
      </Pressable>
    </View>
  );
}

function InfoPill({ label, tone }: { label: string; tone: 'violet' | 'soft' | 'muted' }) {
  return (
    <View
      style={[
        styles.infoPill,
        tone === 'violet'
          ? styles.infoPillViolet
          : tone === 'soft'
            ? styles.infoPillSoft
            : styles.infoPillMuted,
      ]}
    >
      <Text
        style={[
          styles.infoPillText,
          tone === 'violet'
            ? styles.infoPillTextViolet
            : tone === 'soft'
              ? styles.infoPillTextSoft
              : styles.infoPillTextMuted,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

function formatRelativeAlertTime(dateIso: string): string {
  const targetTime = new Date(dateIso).getTime();
  const elapsedMs = Date.now() - targetTime;
  const minutes = Math.floor(Math.abs(elapsedMs) / 60000);

  if (elapsedMs < 0) {
    if (minutes < 60) {
      return `en ${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `en ${hours} h`;
    }

    const days = Math.floor(hours / 24);
    return `en ${days} d`;
  }

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: SURFACE,
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
  headerCopy: {
    gap: 4,
  },
  kicker: {
    color: '#D9D2FF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: '#F1EDFF',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  headerStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -2,
  },
  headerStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
    minWidth: 130,
    justifyContent: 'center',
    flexWrap: 'nowrap',
  },
  headerStatChipSoft: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  headerStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerStatText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    minWidth: 0,
  },
  markAllButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  markAllText: {
    color: PRIMARY,
    fontWeight: '700',
  },
  headerRowTop: {
    marginTop: 6,
  },
  headerChipsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: -12,
  },
  chipSmall: {
    flex: 0.9,
    minWidth: 110,
  },
  chipLarge: {
    flex: 1.6,
    minWidth: 160,
  },
  chipEqual: {
    flex: 1,
  },
  headerStatInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  markAllButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    // match chips exactly
    shadowColor: 'transparent',
  },
  markAllTextCompact: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  markAllAsChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 36,
    minWidth: 130,
    justifyContent: 'center',
    flexWrap: 'nowrap',
    shadowColor: 'transparent',
  },
  chipIcon: {
    marginRight: 6,
  },
  content: {
    flex: 1,
    paddingTop: 6,
  },
  filtersRow: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 10,
    flexDirection: 'row'
  },
  filterChip: {
    width: 110,
    height: 40,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  filterChipActive: {
    backgroundColor: PRIMARY,
  },
  filterChipInactive: {
    backgroundColor: '#FFFFFF',
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
    color: '#FFFFFF',
  },
  filterChipLabelInactive: {
    color: PRIMARY,
  },
  
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 28,
    gap: 10,
  },
  centerStateTitle: {
    color: '#2F2B3A',
    fontSize: 18,
    fontWeight: '800',
  },
  centerStateText: {
    color: '#615C74',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 4,
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sectionTitle: {
    color: '#8C859F',
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 4,
    marginBottom: -2,
    paddingLeft: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#EEE8FF',
    shadowColor: '#4E3ABF',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    elevation: 3,
  },
  cardUnread: {
    borderColor: '#D5C9FF',
    backgroundColor: '#FCFBFF',
  },
  cardReviewed: {
    borderColor: '#EAE6F4',
    backgroundColor: '#F8F6FD',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    flex: 1,
  },
  iconSquare: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  cardTextBlock: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    color: '#2F2B3A',
    fontSize: 16,
    fontWeight: '800',
  },
  cardMeta: {
    color: '#746F86',
    fontSize: 12,
    fontWeight: '600',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F7A400',
    marginTop: 4,
  },
  readDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#5B3FD9',
    marginTop: 5,
    opacity: 0.85,
  },
  cardMessage: {
    color: '#4F4A61',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  cardPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  infoPillViolet: {
    backgroundColor: '#EEEAFE',
  },
  infoPillSoft: {
    backgroundColor: '#F3F0FF',
  },
  infoPillMuted: {
    backgroundColor: '#F3EFFA',
  },
  infoPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  infoPillTextViolet: {
    color: '#6558C9',
  },
  infoPillTextSoft: {
    color: '#6A5ADC',
  },
  infoPillTextMuted: {
    color: '#7A728C',
  },
  cardActionRow: {
    display: 'none',
  },
  cardActionButton: {
    marginTop: 2,
    width: '100%',
    minHeight: 44,
    borderRadius: 12,
    backgroundColor: '#25156F',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#170E4A',
    shadowColor: '#170E4A',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 2,
  },
  cardActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.99 }],
  },
});
