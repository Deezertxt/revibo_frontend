import { HapticTab } from "@/shared/components/haptic-tab";
import { useAuthStore } from "@/shared/store/useAuthStore";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs, usePathname } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ACTIVE = "#5B3FD9";
const INACTIVE = "#B7B4C4";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const rol = useAuthStore((state) => state.user?.rol);

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
      {/* CREAR REPORTES */}
      <Tabs.Screen
        name="crear_reportes"
        options={{
          title: "Reportar",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="pencil" size={24} color={color} />
          ),

          href:
            rol === "admin" ||
            rol === "autoridad" ||
            rol === "moderador"
              ? "/(tabs)/crear_reportes"
              : (null as any),
        }}
      />

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
          href: rol === "admin" ? "/(tabs)/admin" : null,
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
