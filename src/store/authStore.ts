import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// Definimos qué datos tiene el usuario según tu API
interface User {
  id_usuario: string;
  nombre: string;
  correo: string;
  rol: string | null;
}

interface AuthState {
  user: User | null;
  access_token: string | null;
  // Acciones para cambiar el estado
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      access_token: null,

      setAuth: (token, user) =>
        set({
          access_token: token,
          user: user,
        }),

      logout: () =>
        set({
          access_token: null,
          user: null,
        }),
    }),
    {
      name: "revibo-auth-storage", // Nombre para guardar en el teléfono
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
