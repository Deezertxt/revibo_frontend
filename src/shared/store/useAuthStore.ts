import { create } from "zustand";

export interface AuthUser {
  id_usuario: string;
  nombre: string;
  correo: string;
  rol?: string;
  estado?: boolean;
}

interface AuthSession {
  isRegistered: boolean;
  accessToken: string | null;
  user: AuthUser | null;
}

interface AuthStore extends AuthSession {
  setSession: (user: AuthUser, accessToken: string) => void;
  logout: () => void;
  getAccessToken: () => string | null;
  isLoggedIn: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  isRegistered: false,
  accessToken: null,
  user: null,

  setSession: (user: AuthUser, accessToken: string) => {
    set({
      isRegistered: true,
      accessToken,
      user,
    });
  },

  logout: () => {
    set({
      isRegistered: false,
      accessToken: null,
      user: null,
    });
  },

  getAccessToken: () => get().accessToken,

  isLoggedIn: () => get().isRegistered && get().accessToken !== null,
}));
