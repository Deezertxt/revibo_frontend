import { Platform } from 'react-native';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ? `${process.env.EXPO_PUBLIC_API_URL.trim()}/api/v1`
  : 'https://revibo-backend.onrender.com/api/v1';

const API_URL = BASE_URL.replace(/\/$/, '');

export type Reporte = {
  id_reporte: string;
  titulo: string;
  descripcion: string;
  institucion?: string;
  tipo_reporte: string;
  gravedad_reporte: string;
  estado: boolean;
  fecha_inicio: string;
  fecha_fin?: string | null;
  geom: {
    type: string;
    coordinates: number[] | number[][];
  } | null;
  imagenes?: string[];
};

export type Autoridad = {
  id_autoridad: string;
  nombre: string;
  correo: string;
  cargo: string;
  institucion:
    | {
        id_institucion: string;
        nombre: string;
        descripcion?: string;
      }
    | null;
  created_at?: string;
  updated_at?: string;
};

type ApiListResponse<T> = {
  message: string;
  data: T[];
};

type ApiResponse<T> = {
  message: string;
  data: T;
};

export async function getAllReportes(token: string): Promise<Reporte[]> {
  const response = await fetch(`${API_URL}/reporte`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json().catch(() => null)) as ApiListResponse<Reporte> | null;

  if (!response.ok) {
    const message = data?.message ?? 'No se pudieron cargar los reportes.';
    throw new Error(message);
  }

  return data?.data ?? [];
}

export async function deleteReporte(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/reporte/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    const message = data?.message ?? 'No se pudo eliminar el reporte.';
    throw new Error(message);
  }
}

export async function getAllAutoridades(token: string): Promise<Autoridad[]> {
  const response = await fetch(`${API_URL}/autoridad`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  const data = (await response.json().catch(() => null)) as ApiListResponse<Autoridad> | null;

  if (!response.ok) {
    const message = data?.message ?? 'No se pudieron cargar las autoridades.';
    throw new Error(message);
  }

  return data?.data ?? [];
}

export async function deleteAutoridad(id: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/autoridad/${id}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    const message = data?.message ?? 'No se pudo eliminar la autoridad.';
    throw new Error(message);
  }
}
