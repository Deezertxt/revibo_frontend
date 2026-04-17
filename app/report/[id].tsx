import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { getIncidentById } from '@/features/incidents/incidents.service';
import { INCIDENT_TYPE_LABELS } from '@/features/incidents/types';
import { ThemedText } from '@/shared/components/themed-text';
import { ThemedView } from '@/shared/components/themed-view';

export default function IncidentDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const incident = params.id ? getIncidentById(params.id) : undefined;

  if (!incident) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Detalle del reporte' }} />
        <ThemedText type="title">Reporte no encontrado</ThemedText>
        <ThemedText>El reporte solicitado no existe o ya no esta disponible.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Detalle del reporte' }} />
      <ThemedText type="title">{incident.title}</ThemedText>
      <ThemedText>{incident.description}</ThemedText>
      <ThemedText type="defaultSemiBold">Tipo: {INCIDENT_TYPE_LABELS[incident.type]}</ThemedText>
      <ThemedText type="defaultSemiBold">Estado: {incident.status}</ThemedText>
      <ThemedText type="defaultSemiBold">
        Coordenadas: {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
});
