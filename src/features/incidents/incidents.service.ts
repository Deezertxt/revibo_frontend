import NetInfo from '@react-native-community/netinfo';

import { MOCK_INCIDENTS } from '@/features/incidents/mock-data';
import type { Incident } from '@/features/incidents/types';

export class ConnectivityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConnectivityError';
  }
}

export async function fetchActiveIncidents(): Promise<Incident[]> {
  const netState = await NetInfo.fetch();

  if (!netState.isConnected || netState.isInternetReachable === false) {
    throw new ConnectivityError('Sin conexion a internet. Mostrando mapa sin reportes.');
  }

  // Simulate backend response while HU-1 uses local mock data.
  return MOCK_INCIDENTS.filter((incident) => incident.status === 'activo');
}

export async function fetchIncidentDetailById(id: string): Promise<Incident> {
  const netState = await NetInfo.fetch();

  if (!netState.isConnected || netState.isInternetReachable === false) {
    throw new ConnectivityError('Sin conexion. No se pudo cargar el detalle del reporte.');
  }

  // Simulate backend latency while keeping UX under 1.5s.
  await new Promise((resolve) => setTimeout(resolve, 250));

  const incident = MOCK_INCIDENTS.find((item) => item.id === id);

  if (!incident) {
    throw new Error('No se encontro el reporte solicitado.');
  }

  return incident;
}

export function getIncidentById(id: string): Incident | undefined {
  return MOCK_INCIDENTS.find((incident) => incident.id === id);
}
