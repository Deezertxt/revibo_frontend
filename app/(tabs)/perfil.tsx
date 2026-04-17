import { ThemedText } from '@/shared/components/themed-text';
import { ThemedView } from '@/shared/components/themed-view';
import { getIsRegistered } from '@/shared/store/authStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';

export default function PerfilScreen() {
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (!getIsRegistered()) {
        router.push('/registro');
      }
    }, [])
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Perfil</ThemedText>
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