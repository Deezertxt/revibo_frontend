import { useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/shared/components/themed-text';
import { ThemedView } from '@/shared/components/themed-view';

export default function RutasScreen() {
  const params = useLocalSearchParams<{
    incidentId?: string;
    incidentLat?: string;
    incidentLng?: string;
  }>();

  const hasIncidentContext = Boolean(params.incidentId && params.incidentLat && params.incidentLng);

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Rutas</ThemedText>
      {hasIncidentContext ? (
        <>
          <ThemedText>
            Generando alternativa para evitar el incidente {params.incidentId}.
          </ThemedText>
          <ThemedText type="defaultSemiBold">
            Zona excluida: {params.incidentLat}, {params.incidentLng}
          </ThemedText>
        </>
      ) : (
        <ThemedText>Espacio reservado para HU futuras.</ThemedText>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
  },
});
