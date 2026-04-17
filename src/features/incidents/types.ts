export type IncidentType = 'accidente' | 'bloqueo' | 'mantenimiento';
export type IncidentStatus = 'activo' | 'resuelto' | 'archivado';
export type IncidentSeverity = 'alta' | 'media' | 'baja';
export type IncidentAuthority = 'GAMC' | 'Transito' | 'ABC';

export type Incident = {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: IncidentSeverity;
  authority: IncidentAuthority;
  locationText: string;
  latitude: number;
  longitude: number;
  startAt: string;
  endAt?: string;
  imageUrls?: string[];
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

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  activo: 'Activo',
  resuelto: 'Resuelto',
  archivado: 'Archivado',
};

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
};
