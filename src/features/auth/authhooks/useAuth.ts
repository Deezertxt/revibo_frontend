import { useRouter } from "expo-router";
import { useState } from "react";
import { loginRequest } from "../authservices/loginservice"; // Ajustado a tu estructura

export const useAuth = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (correo: string, contrasena: string) => {
    setLoading(true);
    setError(null);

    try {
      // Llamamos al servicio de autenticación
      const result = await loginRequest(correo, contrasena);

      if (result.success) {
        // Si el login es exitoso, redirigimos a la pantalla principal
        // Expo Router buscará automáticamente la ruta /(tabs)
        router.replace("/");
      } else {
        setError("No se pudo completar el inicio de sesión.");
      }
    } catch (err: any) {
      // Manejo de errores de red o credenciales incorrectas (401, 404, 500)
      const message =
        err.response?.data?.message || "Error de conexión con el servidor";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return {
    handleLogin,
    loading,
    error,
  };
};
