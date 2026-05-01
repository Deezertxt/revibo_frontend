import { Stack } from "expo-router";

export default function PublicLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Solo las pantallas que no requieren sesión */}
      <Stack.Screen name="login" />
      <Stack.Screen name="registro" />
    </Stack>
  );
}
