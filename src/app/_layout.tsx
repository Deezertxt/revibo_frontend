import { useLocationSync } from "@/shared/hooks/useLocationSync";
import { useDeviceRegistration } from "@/shared/hooks/useDeviceRegistration";
import { useLinkDeviceToUser } from "@/shared/hooks/useLinkDeviceToUser";
import { Stack } from "expo-router";

export default function RootLayout() {
  // Registrar dispositivo (obtener expo token, ubicación inicial)
  useDeviceRegistration();

  // Sincronizar ubicación periódicamente
  useLocationSync();

  // Enlazar dispositivo con usuario cuando inicia sesión
  useLinkDeviceToUser();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />

      <Stack.Screen name="(public)" />
    </Stack>
  );
}
