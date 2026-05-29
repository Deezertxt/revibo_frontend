import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { useDeviceStore } from "@/shared/store/useDeviceStore";
import { useAuthStore } from "@/shared/store/useAuthStore";

const API_URL_SYNC =
  "https://revibo-backend.onrender.com/api/v1/device-token/sync";

/**
 * Hook responsable de:
 * 1. Activar watchPositionAsync para tracking continuo
 * 2. Sincronizar ubicación periódicamente al backend
 * 3. Enviar el token push en cada actualización
 * 4. Incluir Authorization header si el usuario está logueado
 *
 * NO vuelve a obtener el Expo Push Token (lo obtiene del store)
 * NO reinicia el watcher a menos que sea necesario
 * Usa useRef para el authToken para evitar rerenders
 */
export const useLocationSync = () => {
  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const authTokenRef = useRef<string | null>(null);
  const expoPushTokenRef = useRef<string | null>(null);

  // Selecciona solo el token de push que necesita
  const expoPushToken = useDeviceStore((state) => state.expoPushToken);

  // Selecciona solo el accessToken que necesita
  const accessToken = useAuthStore((state) => state.accessToken);

  // Actualiza las referencias cuando cambian (sin disparar efectos)
  useEffect(() => {
    authTokenRef.current = accessToken;
  }, [accessToken]);

  useEffect(() => {
    expoPushTokenRef.current = expoPushToken;
  }, [expoPushToken]);

  // Inicia el watcher de ubicación UNA SOLA VEZ
  useEffect(() => {
    let isMounted = true;

    const startTracking = async () => {
      try {
        const { status } =
          await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          console.log("❌ Permiso de ubicación denegado");
          return;
        }

        console.log("📍 Iniciando sincronización de ubicación...");

        subscriptionRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10 * 60 * 1000, // 10 minutos
            distanceInterval: 1000, // 1 km
          },
          async (location) => {
            if (!isMounted) return;

            try {
              const token = expoPushTokenRef.current;
              const authToken = authTokenRef.current;

              if (!token) {
                console.log(
                  "⚠️ Expo Push Token no disponible aún, saltando sync"
                );
                return;
              }

              console.log("📍 Nueva ubicación:", {
                lat: location.coords.latitude,
                lng: location.coords.longitude,
              });

              const headers: Record<string, string> = {
                "Content-Type": "application/json",
              };

              // Añadir Authorization si el usuario está logueado
              if (authToken) {
                headers.Authorization = `Bearer ${authToken}`;
              }

              const response = await fetch(API_URL_SYNC, {
                method: "POST",
                headers,
                body: JSON.stringify({
                  token,
                  lng: location.coords.longitude,
                  lat: location.coords.latitude,
                }),
              });

              const data = await response.json();

              if (response.ok) {
                console.log("✓ Ubicación sincronizada:", {
                  logged_in: !!authToken,
                });
              } else {
                console.log("⚠️ Error en sync:", data);
              }
            } catch (error) {
              console.log("❌ Error sincronizando ubicación:", error);
            }
          }
        );
      } catch (error) {
        console.log("❌ Error iniciando tracking:", error);
      }
    };

    startTracking();

    return () => {
      isMounted = false;
      console.log("🛑 Deteniendo sincronización de ubicación...");
      subscriptionRef.current?.remove();
    };
  }, []); // ✓ Vacío: se ejecuta una sola vez
};