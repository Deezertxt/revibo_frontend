import { Stack } from "expo-router";
import "../../global.css";

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // Ocultamos el header por defecto para todas las pantallas
        contentStyle: { backgroundColor: "#fff" }, // Color de fondo global
      }}
    >
      {}
      <Stack.Screen name="index" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
    </Stack>
  );
}
