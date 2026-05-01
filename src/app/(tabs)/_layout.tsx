import { HapticTab } from "@/shared/components/haptic-tab";
import { getAuthSession } from "@/shared/store/authStore";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE = "#5B3FD9";
const INACTIVE = "#B7B4C4";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();

  const [rolActual, setRolActual] = useState<string | null | undefined>(
    undefined,
  );

  useEffect(() => {
    const session = getAuthSession();
    setRolActual(session.rol);
  }, [pathname]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          height: 62 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 10),
          borderTopWidth: 0,
          backgroundColor: "#FFFFFF",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Mapa",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="map" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="alertas"
        options={{
          title: "Alertas",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="notifications-none" size={24} color={color} />
          ),
        }}
      />

      {/* 3. REGISTRAR REPORTE 
      <Tabs.Screen
        name="crear-reporte"
        options={{
          title: "Reportar",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="add-business" size={24} color={color} />
          ),
          // Corregido con el path completo para evitar error de tipos
          href:
            rolActual === "admin" || rolActual === "moderador"
              ? "/(tabs)/crear-reporte"
              : null,
        }}
      />*/}

      <Tabs.Screen
        name="rutas"
        options={{
          title: "Rutas",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="alt-route" size={24} color={color} />
          ),
        }}
      />

      {/* 5. ADMIN */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color }) => (
            <MaterialIcons
              name="admin-panel-settings"
              size={24}
              color={color}
            />
          ),
          // Corregido con el path completo para evitar error de tipos
          href: rolActual === "admin" ? "/(tabs)/admin" : null,
        }}
      />

      <Tabs.Screen
        name="perfil"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person-outline" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
