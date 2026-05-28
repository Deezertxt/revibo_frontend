import { useLocationSync } from "@/shared/hooks/useLocationSync";
import { usePushNotifications } from "@/shared/notifications/usePushNotifications";
import { Stack } from "expo-router";

export default function RootLayout() {
  usePushNotifications();
  useLocationSync();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />

      <Stack.Screen name="(public)" />
    </Stack>
  );
}
