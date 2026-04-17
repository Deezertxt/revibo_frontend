import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context"; // Importante
import "../../global.css";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          // Eliminamos contentStyle para que no interfiera con tus diseños
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="auth" />
        <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
