import { useEffect } from "react";
import { useAuthStore } from "@/shared/store/useAuthStore";
import { useDeviceStore } from "@/shared/store/useDeviceStore";

const API_URL_LINK =
  "https://revibo-backend.onrender.com/api/v1/device-token/link";

/**
 * Hook responsable de:
 * 1. Detectar cambios en el estado de autenticación
 * 2. Cuando el usuario inicia sesión:
 *    - Obtener el Expo Push Token del store
 *    - Enviar el token + access token al backend
 *    - Backend asocia el device_token con el id_usuario
 *
 * Se ejecuta automáticamente cuando cambia accessToken
 */
export const useLinkDeviceToUser = () => {
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const expoPushToken = useDeviceStore((state) => state.expoPushToken);

  useEffect(() => {
    // Si no hay access token o no hay usuario, no hacer nada
    if (!accessToken || !user || !expoPushToken) {
      return;
    }

    const linkDeviceToUser = async () => {
      try {
        console.log(
          `🔗 Enlazando dispositivo con usuario: ${user.id_usuario}`
        );

        const response = await fetch(API_URL_LINK, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            token: expoPushToken,
            id_usuario: user.id_usuario,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          console.log(
            "✓ Dispositivo enlazado correctamente con usuario:",
            data
          );
        } else {
          console.log(
            "⚠️ Error al enlazar dispositivo con usuario:",
            data.message
          );
        }
      } catch (error) {
        console.log("❌ Error enlazando dispositivo con usuario:", error);
      }
    };

    linkDeviceToUser();

    // Se dispara cada vez que accessToken cambia (login)
  }, [accessToken, user, expoPushToken]);
};
