import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import RegisterAutoridadScreen from '@/features/auth/screens/RegisterAutoridadScreen';
import { useAuthStore } from '@/shared/store/useAuthStore';
import {
  deleteAutoridad,
  deleteReporte,
  getAllAutoridades,
  getAllReportes,
  type Autoridad,
  type Reporte,
} from '../services/admin.service';

const PRIMARY = '#5B3FD9';
const ACCENT = '#7C63E8';
const SURFACE = '#F6F2FF';

type Tab = 'reportes' | 'autoridades';

export default function AdminScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const token = useAuthStore((state) => state.getAccessToken());
  const user = useAuthStore((state) => state.user);

  const [activeTab, setActiveTab] = useState<Tab>('reportes');
  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [autoridades, setAutoridades] = useState<Autoridad[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);

  const loadReportes = async () => {
    if (!token) {
      setErrorMessage('No estás autenticado.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await getAllReportes(token);
      setReportes(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron cargar los reportes.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reportes' && reportes.length === 0 && !loading) {
      loadReportes();
    } else if (activeTab === 'autoridades' && autoridades.length === 0 && !loading) {
      loadAutoridades();
    }
  }, [activeTab]);

  const loadAutoridades = async () => {
    if (!token) {
      setErrorMessage('No estás autenticado.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await getAllAutoridades(token);
      //console.log("autoridades", data);
      setAutoridades(data);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudieron cargar las autoridades.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReporte = (id: string, titulo: string) => {
    Alert.alert(
      'Eliminar reporte',
      `¿Estás seguro de que deseas eliminar el reporte "${titulo}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;

            setDeleting(id);

            try {
              await deleteReporte(id, token);
              setReportes((prev) => prev.filter((r) => r.id_reporte !== id));
              Alert.alert('Éxito', 'Reporte eliminado correctamente.');
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'No se pudo eliminar el reporte.';
              Alert.alert('Error', message);
            } finally {
              setDeleting(null);
            }
          },
        },
      ],
    );
  };

  const handleCenterOnReporte = (reporte: Reporte) => {
    if (!reporte.geom) {
      Alert.alert('Sin ubicación', 'Este reporte no tiene ubicación registrada.');
      return;
    }

    try {
      const coordinates = reporte.geom.coordinates;
      let lat: number;
      let lng: number;

      if (reporte.geom.type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
        // GeoJSON Point: [lng, lat]
        [lng, lat] = coordinates as [number, number];
      } else {
        Alert.alert('Formato inválido', 'No se pudo procesar la ubicación del reporte.');
        return;
      }

      router.push({
        pathname: '/(tabs)',
        params: { lat: lat.toString(), lng: lng.toString() },
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la ubicación del reporte.');
    }
  };

  const handleDeleteAutoridad = (id: string, nombre: string) => {
    Alert.alert(
      'Eliminar autoridad',
      `¿Estás seguro de que deseas eliminar la autoridad "${nombre}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;

            setDeleting(id);

            try {
              await deleteAutoridad(id, token);
              setAutoridades((prev) => prev.filter((a) => a.id_autoridad !== id));
              Alert.alert('Éxito', 'Autoridad eliminada correctamente.');
            } catch (error) {
              const message =
                error instanceof Error ? error.message : 'No se pudo eliminar la autoridad.';
              Alert.alert('Error', message);
            } finally {
              setDeleting(null);
            }
          },
        },
      ],
    );
  };

  const handleSelectTab = (tab: Tab) => {
    if (showRegisterForm) {
      setShowRegisterForm(false);
    }
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.kicker}>Panel de administración</Text>
        <Text style={styles.title}>Administrador</Text>
        {user && <Text style={styles.userInfo}>Conectado como: {user.nombre}</Text>}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <Pressable
          onPress={() => handleSelectTab('reportes')}
          style={[styles.tab, activeTab === 'reportes' && styles.tabActive]}
        >
          <Text style={[styles.tabLabel, activeTab === 'reportes' && styles.tabLabelActive]}>
            Reportes
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleSelectTab('autoridades')}
          style={[styles.tab, activeTab === 'autoridades' && styles.tabActive]}
        >
          <Text style={[styles.tabLabel, activeTab === 'autoridades' && styles.tabLabelActive]}>
            Autoridades
          </Text>
        </Pressable>

        {activeTab === 'reportes' && !loading && (
          <Pressable
            onPress={loadReportes}
            style={styles.refreshButton}
            disabled={loading}
          >
            <MaterialIcons name="refresh" size={18} color="#fff" />
          </Pressable>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'reportes' && (
          <>
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={styles.loaderText}>Cargando reportes...</Text>
              </View>
            ) : errorMessage ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={40} color={PRIMARY} />
                <Text style={styles.errorText}>{errorMessage}</Text>
                <Pressable
                  onPress={loadReportes}
                  style={[styles.button, styles.buttonSmall]}
                >
                  <Text style={styles.buttonText}>Reintentar</Text>
                </Pressable>
              </View>
            ) : reportes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialIcons name="assignment-turned-in" size={40} color={PRIMARY} />
                <Text style={styles.emptyText}>No hay reportes registrados</Text>
              </View>
            ) : (
              <FlatList
                data={reportes}
                keyExtractor={(item) => item.id_reporte}
                renderItem={({ item }) => (
                  <ReporteCard
                    reporte={item}
                    onCenterMap={() => handleCenterOnReporte(item)}
                    onDelete={() => handleDeleteReporte(item.id_reporte, item.titulo)}
                    isDeleting={deleting === item.id_reporte}
                  />
                )}
                contentContainerStyle={styles.listContent}
              />
            )}
          </>
        )}

        {activeTab === 'autoridades' && (
          <>
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={PRIMARY} />
                <Text style={styles.loaderText}>Cargando autoridades...</Text>
              </View>
            ) : errorMessage ? (
              <View style={styles.errorContainer}>
                <MaterialIcons name="error-outline" size={40} color={PRIMARY} />
                <Text style={styles.errorText}>{errorMessage}</Text>
                <Pressable
                  onPress={loadAutoridades}
                  style={[styles.button, styles.buttonSmall]}
                >
                  <Text style={styles.buttonText}>Reintentar</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Pressable
                  onPress={() => setShowRegisterForm(true)}
                  style={({ pressed }) => [
                    styles.createButton,
                    pressed && styles.createButtonPressed,
                  ]}
                >
                  <MaterialIcons name="person-add" size={18} color="#fff" />
                  <Text style={styles.createButtonText}>Nueva Autoridad</Text>
                </Pressable>

                {autoridades.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <MaterialIcons name="people-outline" size={40} color={PRIMARY} />
                    <Text style={styles.emptyText}>No hay autoridades registradas</Text>
                  </View>
                ) : (
                  <FlatList
                    data={autoridades}
                    keyExtractor={(item) => item.id_autoridad}
                    renderItem={({ item }) => (
                      <AutoridadCard
                        autoridad={item}
                        onDelete={() =>
                          handleDeleteAutoridad(item.id_autoridad, item.nombre)
                        }
                        isDeleting={deleting === item.id_autoridad}
                      />
                    )}
                    contentContainerStyle={styles.listContent}
                  />
                )}
              </>
            )}
          </>
        )}
      </View>

      <Modal
        visible={showRegisterForm}
        animationType="slide"
        onRequestClose={() => setShowRegisterForm(false)}
      >
        <View style={{ flex: 1 }}>
          <RegisterAutoridadScreen />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function AutoridadCard({
  autoridad,
  onDelete,
  isDeleting,
}: {
  autoridad: Autoridad;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <MaterialIcons name="person" size={24} color={ACCENT} />
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle}>{autoridad.nombre}</Text>
          <Text style={styles.cardMeta}>{autoridad.cargo}</Text>
        </View>
      </View>

      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="mail-outline" size={14} color={PRIMARY} />
          <Text style={styles.detailText} numberOfLines={1}>
            {autoridad.correo}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <MaterialIcons name="business" size={14} color={PRIMARY} />
          <Text style={styles.detailText}>
            {autoridad.institucion?.nombre ?? 'Sin institución'}
          </Text>
        </View>
      </View>

      <Pressable
        style={[styles.actionButton, styles.actionButtonDanger]}
        onPress={onDelete}
        disabled={isDeleting}
        android_ripple={{ color: '#8B0000' }}
      >
        {isDeleting ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <>
            <MaterialIcons name="delete-outline" size={16} color="#FFF" />
            <Text style={styles.actionButtonText}>Eliminar</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

function ReporteCard({
  reporte,
  onCenterMap,
  onDelete,
  isDeleting,
}: {
  reporte: Reporte;
  onCenterMap: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const getSeverityColor = (severity: string) => {
    const colorMap: { [key: string]: string } = {
      bajo: '#FFD94D',
      medio: '#FF8C4D',
      alto: '#FF4763',
    };
    return colorMap[severity] || PRIMARY;
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.severityBadge,
            { backgroundColor: getSeverityColor(reporte.gravedad_reporte) },
          ]}
        >
          <Text style={styles.severityText}>
            {reporte.gravedad_reporte.charAt(0).toUpperCase() +
              reporte.gravedad_reporte.slice(1)}
          </Text>
        </View>
        <View style={styles.cardTitleBlock}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {reporte.titulo}
          </Text>
          <Text style={styles.cardMeta}>{reporte.institucion || 'Sin institución'}</Text>
        </View>
      </View>

      <Text style={styles.cardDescription} numberOfLines={2}>
        {reporte.descripcion}
      </Text>

      <View style={styles.cardFooter}>
        <View style={styles.typeChip}>
          <Text style={styles.typeChipText}>{reporte.tipo_reporte}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onCenterMap}
          style={[styles.actionButton, styles.actionButtonPrimary]}
          android_ripple={{ color: '#4A37A0' }}
        >
          <MaterialIcons name="my-location" size={16} color="#FFF" />
          <Text style={styles.actionButtonText}>Centrar</Text>
        </Pressable>

        <Pressable
          style={[styles.actionButton, styles.actionButtonDanger]}
          onPress={onDelete}
          disabled={isDeleting}
          android_ripple={{ color: '#8B0000' }}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <>
              <MaterialIcons name="delete-outline" size={16} color="#FFF" />
              <Text style={styles.actionButtonText}>Resolver</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: PRIMARY,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  kicker: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 4,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userInfo: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    padding: 4,
    alignItems: 'center',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  tabLabelActive: {
    color: PRIMARY,
  },
  refreshButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 16,
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    color: '#666',
    fontSize: 16,
  },
  button: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonSmall: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  severityText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  cardTitleBlock: {
    flex: 1,
  },
  cardTitle: {
    color: '#1E1E2E',
    fontWeight: '700',
    fontSize: 16,
    marginBottom: 4,
  },
  cardMeta: {
    color: '#888',
    fontSize: 12,
  },
  cardDescription: {
    color: '#555',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  cardFooter: {
    marginBottom: 12,
  },
  typeChip: {
    backgroundColor: `${ACCENT}22`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  typeChipText: {
    color: ACCENT,
    fontWeight: '600',
    fontSize: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonPrimary: {
    backgroundColor: PRIMARY,
  },
  actionButtonDanger: {
    backgroundColor: '#E53935',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  createButton: {
    backgroundColor: ACCENT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 16,
  },
  createButtonPressed: {
    opacity: 0.8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${ACCENT}22`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetails: {
    marginVertical: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    color: '#666',
    fontSize: 12,
    flex: 1,
  },

});
