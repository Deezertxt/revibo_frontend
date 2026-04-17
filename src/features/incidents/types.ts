export type IncidentType = 'accidente' | 'bloqueo' | 'mantenimiento';
export type IncidentStatus = 'activo' | 'resuelto' | 'archivado';

export type Incident = {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  createdAt: string;
};

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  accidente: 'Accidentes',
  bloqueo: 'Bloqueos',
  mantenimiento: 'Mantenimiento',
};

export const INCIDENT_TYPE_COLORS: Record<IncidentType, string> = {
  accidente: '#E24A4A',
  bloqueo: '#F5A623',
  mantenimiento: '#5DA528',
};
