import api from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";

// Interfaz robusta basada en tus respuestas de Laravel
interface LoginResponse {
  message: string;
  access_token: string;
  // Usamos el signo ? por si alguno de estos campos no viene siempre
  user: {
    id_usuario: string;
    nombre: string;
    correo: string;
    rol: string | null;
    id_institucion?: string | null;
  };
}

export const loginRequest = async (correo: string, contrasena: string) => {
  try {
    // 1. Petición al endpoint (ya tiene el /api/v1 configurado en api.ts)
    const response = await api.post<LoginResponse>("/login", {
      correo,
      contrasena,
    });

    const { access_token, user } = response.data;

    // 2. Guardar en Zustand
    // IMPORTANTE: Revisa que en authStore.ts el orden sea (token, user)
    useAuthStore.getState().setAuth(access_token, user);

    return { success: true, user };
  } catch (error: any) {
    // Extraemos el mensaje de error que viene desde Laravel (ej: "Credenciales incorrectas")
    const errorMsg =
      error.response?.data?.message || "Error al conectar con el servidor";

    console.error("Error en loginRequest:", errorMsg);

    // Lanzamos un error con el mensaje de Laravel para que el UI lo muestre
    throw new Error(errorMsg);
  }
};
