import { Platform } from 'react-native';

type Institucion = {
  id_institucion: string;
  nombre: string;
  descripcion?: string;
};

type CreateAutoridadPayload = {
  nombre: string;
  correo: string;
  cargo: string;
  contrasena: string;
  confirmacion_contrasena: string;
  id_institucion: string;
};

type ApiResponse<T> = {
  message: string;
  data?: T;
};

const LOCAL_API_URL =
  Platform.OS === 'android'
    ? 'http://192.168.1.12:8000/api/v1'
    : 'http://localhost:8000/api/v1';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL.trim()}/api/v1`
  : 'https://revibo-backend.onrender.com/api/v1';

const API_URL = BASE_URL.replace(/\/$/, '');

export async function getInstituciones(token: string): Promise<Institucion[]> {
  const response = await fetch(`${API_URL}/institucion`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const responseBody = (await response.json().catch(() => null)) as ApiResponse<Institucion[]> | null;

  if (!response.ok) {
    const message = responseBody?.message ?? 'No se pudieron cargar las instituciones.';
    throw new Error(message);
  }

  return responseBody?.data ?? [];
}

export async function createAutoridad(
  payload: CreateAutoridadPayload,
  token: string,
): Promise<void> {
    console.log("datos", payload);
  const response = await fetch(`${API_URL}/autoridad`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const responseBody = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

  if (!response.ok) {
    const message = responseBody?.message ?? 'Error al crear la autoridad.';
    throw new Error(message);
  }
}
