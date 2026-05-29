import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRoutesStore } from '@/features/rutas/store/rutasStore';
import {
  ROUTE_STOP_COLORS,
  formatRouteDistance,
  type RouteDraft,
  type SavedRoute,
} from '@/features/rutas/types';
import { getAuthSession } from '@/shared/store/authStore';

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

export default function RutasScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<SearchParams>();
  const session = getAuthSession();

  const routes = useRoutesStore((state) => state.routes);
  const isLoading = useRoutesStore((state) => state.isLoading);
  const loadRoutes = useRoutesStore((state) => state.loadRoutes);
  const createRoute = useRoutesStore((state) => state.createRoute);
  const updateRoute = useRoutesStore((state) => state.updateRoute);
  const deleteRoute = useRoutesStore((state) => state.deleteRoute);

  useEffect(() => {
    void loadRoutes().catch(() => undefined);
  }, [loadRoutes]);

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

  const canCreateRoutes = Boolean(session.isRegistered && session.accessToken);

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
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>NAVEGACIÓN</Text>
        <Text style={styles.headerTitle}>Rutas</Text>
        <Text style={styles.headerSubtitle}>Gestioná y creá tus rutas</Text>
      </View>

      <ScrollView
        style={styles.body}
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
  const [stops, setStops] = useState<string[]>(['', '', '']);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (route) {
      setName(route.name);
      setStops(
        route.stops.length >= 3
          ? route.stops
          : [...route.stops, ...Array(3 - route.stops.length).fill('')],
      );
      return;
    }

    setName('');
    setStops(['', '', '']);
  }, [route]);

  const canSave =
    name.trim().length > 0 &&
    stops[0]?.trim().length > 0 &&
    stops[stops.length - 1]?.trim().length > 0;

  const updateStop = (index: number, value: string) => {
    setStops((currentStops) =>
      currentStops.map((stop, stopIndex) => (stopIndex === index ? value : stop)),
    );
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
        stops,
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo guardar la ruta.');
    } finally {
      setSaving(false);
    }
  };

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

          <FieldLabel text="Paradas" />
          <View style={styles.stopsGroup}>
            {stops.map((stop, index) => (
              <RouteStopRow
                key={`stop-${index}`}
                index={index}
                value={stop}
                isFirst={index === 0}
                isLast={index === stops.length - 1}
                onChange={(value) => updateStop(index, value)}
                onRemove={
                  index > 1 && index < stops.length - 1 ? () => removeStop(index) : undefined
                }
                placeholder={getStopPlaceholder(index, stops.length)}
              />
            ))}
          </View>

          <Pressable onPress={addStop} style={styles.addStopButton}>
            <MaterialIcons name="add" size={18} color="#5B3FD9" />
            <Text style={styles.addStopButtonText}>Agregar parada</Text>
          </Pressable>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <Pressable
            onPress={handleSave}
            disabled={!canSave || saving}
            style={({ pressed }) => [
              styles.simpleSaveButton,
              !canSave && styles.simpleSaveButtonDisabled,
              pressed && !(!canSave || saving) && styles.simpleSaveButtonPressed,
            ]}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.simpleSaveButtonText}>
                Guardar Ruta
              </Text>
            )}
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
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
  isFirst,
  isLast,
  onChange,
  onRemove,
  placeholder,
}: {
  index: number;
  value: string;
  isFirst: boolean;
  isLast: boolean;
  onChange: (value: string) => void;
  onRemove?: () => void;
  placeholder: string;
}) {
  const badgeLabel = isFirst ? 'A' : isLast ? 'B' : String(index);
  const badgeColor =
    isFirst
      ? ROUTE_STOP_COLORS.origin
      : isLast
        ? ROUTE_STOP_COLORS.destination
        : index === 1
          ? ROUTE_STOP_COLORS.middle
          : ROUTE_STOP_COLORS.extra;

  return (
    <View style={styles.stopRow}>
      <View style={[styles.stopBadge, { backgroundColor: badgeColor }]}>
        <Text style={styles.stopBadgeText}>{badgeLabel}</Text>
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
  stopsGroup: {
    gap: 8,
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
  simpleSaveButton: {
    marginTop: 10,
    marginHorizontal: 20,
    marginBottom: 30,
    height: 55,
    borderRadius: 14,
    backgroundColor: PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
  },
  simpleSaveButtonDisabled: {
    backgroundColor: '#AA9CE9',
    opacity: 1,
  },
  simpleSaveButtonPressed: {
    opacity: 0.9,
  },
  simpleSaveButtonText: {
    color: '#5B3FD9',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  saveButtonContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
  },
  saveButtonIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonCopy: {
    flex: 1,
    gap: 2,
  },
  saveButtonTitle: {
    color: '#5B3FD9',
    fontSize: 16,
    fontWeight: '900',
  },
  saveButtonSubtitle: {
    color: '#ECE8FF',
    fontSize: 12,
    fontWeight: '600',
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

