import { ThemedText } from '@/shared/components/themed-text';
import { ThemedView } from '@/shared/components/themed-view';
import { getAuthSession } from '@/shared/store/authStore';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';

export default function PerfilScreen() {
  const router = useRouter();
  const session = getAuthSession();

  useFocusEffect(
    useCallback(() => {
      if (!session.isRegistered) {
        router.push('/registro');
      }
    }, [router, session.isRegistered])
  );

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Perfil</ThemedText>
      <ThemedText>Sesión activa con backend real.</ThemedText>
      <ThemedText type="defaultSemiBold">Usuario: {session.name ?? 'Sin nombre'}</ThemedText>
      <ThemedText>Email: {session.email ?? 'Sin correo'}</ThemedText>
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