import { Stack } from "expo-router";

export default function RootLayout() {
  // Quitamos el useEffect de redirección automática.
  // Ahora la app simplemente carga y permite ver lo que hay en (tabs).

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 1. Las pestañas ahora son el acceso principal para todos */}
      <Stack.Screen name="(tabs)" />

      {/* 2. El grupo público queda disponible para cuando lo necesitemos */}
      <Stack.Screen name="(public)" />
    </Stack>
  );
}
