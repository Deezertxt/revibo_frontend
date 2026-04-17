import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/shared/components/haptic-tab';
const ACTIVE = '#5B3FD9';
const INACTIVE = '#B7B4C4';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

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
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="map" size={22} color={color} style={{ opacity: focused ? 1 : 0.85 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="alertas"
        options={{
          title: 'Alertas',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name="notifications-none"
              size={22}
              color={color}
              style={{ opacity: focused ? 1 : 0.85 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rutas"
        options={{
          title: 'Rutas',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name="alt-route"
              size={22}
              color={color}
              style={{ opacity: focused ? 1 : 0.85 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Admin',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons
              name="admin-panel-settings"
              size={22}
              color={color}
              style={{ opacity: focused ? 1 : 0.85 }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <MaterialIcons name="person-outline" size={22} color={color} style={{ opacity: focused ? 1 : 0.85 }} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
