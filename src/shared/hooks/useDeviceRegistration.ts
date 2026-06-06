import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as Location from "expo-location";
import { Double } from "react-native/Libraries/Types/CodegenTypes";
import { useDeviceStore } from "@/shared/store/useDeviceStore";

const API_URL_DEPLOY =
  "https://revibo-backend.onrender.com/api/v1/device-token";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Hook responsable de:
 * 1. Registrar el Expo Push Token
 * 2. Solicitar permisos de notificaciones
 * 3. Solicitar ubicación inicial
 * 4. Enviar token + ubicación al backend como dispositivo anónimo
 * 5. Escuchar notificaciones entrantes
 *
 * Se ejecuta UNA SOLA VEZ al montar el componente.
 * El linking del usuario con el device se hace en useLink DeviceToUser
 */
export function useDeviceRegistration() {
  const notificationListener = useRef<Notifications.Subscription | null>(
    null
  );
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const setExpoPushToken = useDeviceStore((state) => state.setExpoPushToken);
  const setDeviceId = useDeviceStore((state) => state.setDeviceId);

  useEffect(() => {
    if (isInitialized) return;

    const initializeDevice = async () => {
      try {
        // 1. Solicitar permisos de notificaciones
        const { status: notifStatus } =
          await Notifications.getPermissionsAsync();

        let finalNotifStatus = notifStatus;

        if (notifStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalNotifStatus = status;
        }

        if (finalNotifStatus !== "granted") {
          console.log("Permisos de notificación no otorgados");
          return;
        }

        // 2. Solicitar ubicación inicial
        const { status: locStatus } =
          await Location.requestForegroundPermissionsAsync();

        if (locStatus !== "granted") {
          console.log("Permisos de ubicación no otorgados");
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const initialLat = location.coords.latitude;
        const initialLng = location.coords.longitude;

        // 3. Obtener Expo Push Token con reintentos
        let expoPushToken: string | null = null;

        for (let i = 0; i < 5; i++) {
          try {
            const tokenData =
              await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId ??
                            Constants.easConfig?.projectId,
              });
            expoPushToken = tokenData.data;
            break;
          } catch (error) {
            console.log(`Intento ${i + 1} fallido para obtener token`, error);
            await new Promise((resolve) => setTimeout(resolve, 6000));
          }
        }

        if (!expoPushToken) {
          console.log("No se pudo obtener Expo Push Token");
          return;
        }

        console.log("✓ Expo Push Token obtenido:", expoPushToken);

        // 4. Guardar token en store (para usar luego en link device to user)
        setExpoPushToken(expoPushToken);

        // 5. Registrar dispositivo en backend (anónimo)
        const response = await fetch(API_URL_DEPLOY, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: expoPushToken,
            platform: Platform.OS,
            lng: initialLng,
            lat: initialLat,
          }),
        });

        const data = await response.json();

        if (response.ok && data.id_dispositivo) {
          setDeviceId(data.id_dispositivo);
          console.log("✓ Dispositivo registrado:", data);
        } else {
          console.log("Respuesta del backend:", data);
        }

        // 6. Configurar listeners de notificaciones
        notificationListener.current =
          Notifications.addNotificationReceivedListener((notification) => {
            console.log("📬 Notificación recibida:", notification);
          });

        responseListener.current =
          Notifications.addNotificationResponseReceivedListener((response) => {
            console.log("📲 Usuario interactuó con notificación:", response);
          });

        setIsInitialized(true);
      } catch (error) {
        console.log("❌ Error en inicialización del dispositivo:", error);
      }
    };

    initializeDevice();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [isInitialized, setExpoPushToken, setDeviceId]);
}
