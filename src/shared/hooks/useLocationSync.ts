import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import Constants from "expo-constants";

const API_URL_DEPLOY =
  "https://revibo-backend.onrender.com/api/v1/device-token/sync";

export const useLocationSync = (authToken?: string) => {
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          console.log("Permiso de ubicación denegado");
          return;
        }

        console.log("Iniciando location sync...");

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,

            // PARA TESTING ↓↓↓
            timeInterval: 10 * 60 * 1000,
            distanceInterval: 1000,
          },
          async (location) => {
            try {
              console.log(
                "Nueva ubicación detectada:",
                location.coords.latitude,
                location.coords.longitude
              );

              const tokenData =
                await Notifications.getExpoPushTokenAsync({
                  projectId:
                    Constants.expoConfig?.extra?.eas?.projectId,
                });

              const token = tokenData.data;

              const response = await fetch(API_URL_DEPLOY, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(authToken
                    ? {
                        Authorization: `Bearer ${authToken}`,
                      }
                    : {}),
                },
                body: JSON.stringify({
                  token,
                  lng: location.coords.longitude,
                  lat: location.coords.latitude,
                }),
              });

              const data = await response.json();

              console.log("Sync exitoso:", data);

            } catch (error) {
              console.log("Error sincronizando ubicación", error);
            }
          }
        );
      } catch (error) {
        console.log("Error iniciando tracking", error);
      }
    };

    startTracking();

    return () => {
      console.log("Removiendo location subscription...");
      subscription?.remove();
    };
  }, [authToken]);
};