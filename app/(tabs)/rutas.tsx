import { StyleSheet } from 'react-native';

import { ThemedText } from '@/shared/components/themed-text';
import { ThemedView } from '@/shared/components/themed-view';

export default function RutasScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Rutas</ThemedText>
      <ThemedText>Espacio reservado para HU futuras.</ThemedText>
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
