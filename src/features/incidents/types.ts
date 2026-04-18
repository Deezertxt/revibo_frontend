export const INCIDENT_TYPES = [
  'bloqueo',
  'marcha',
  'mantenimiento',
  'cierre_programado',
  'desfile',
  'festividad',
  'feria',
  'accidente_vehicular',
  'incendio',
  'derrumbe',
  'deslizamiento',
  'inundacion',
] as const;

export type IncidentType = (typeof INCIDENT_TYPES)[number];
export type IncidentStatus = 'activo' | 'resuelto' | 'archivado';
export type IncidentSeverity = 'Bajo' | 'Medio' | 'Alto' | 'Critico';
export type IncidentAuthority = string;

export type IncidentGeometryType = 'Point' | 'LineString';

export type IncidentCoordinate = {
  latitude: number;
  longitude: number;
};

export type Incident = {
  id: string;
  title: string;
  description: string;
  type: IncidentType;
  status: IncidentStatus;
  severity: IncidentSeverity;
  authority: IncidentAuthority;
  locationText: string;
  geometryType: IncidentGeometryType;
  mapCoordinates: IncidentCoordinate[];
  latitude: number;
  longitude: number;
  startAt: string;
  endAt?: string;
  imageUrls?: string[];
};

export const INCIDENT_TYPE_LABELS: Record<IncidentType, string> = {
  bloqueo: 'Bloqueo',
  marcha: 'Marcha',
  mantenimiento: 'Mantenimiento',
  cierre_programado: 'Cierre Programado',
  desfile: 'Desfile',
  festividad: 'Festividad',
  feria: 'Feria',
  accidente_vehicular: 'Accidente Vehicular',
  incendio: 'Incendio',
  derrumbe: 'Derrumbe',
  deslizamiento: 'Deslizamiento',
  inundacion: 'Inundacion',
};

export const INCIDENT_TYPE_COLORS: Record<IncidentType, string> = {
  accidente_vehicular: '#E24A4A',
  bloqueo: '#F5A623',
  mantenimiento: '#5DA528',
  marcha: '#9B59B6',
  cierre_programado: '#2E86DE',
  desfile: '#D35400',
  festividad: '#E84393',
  feria: '#16A085',
  incendio: '#C0392B',
  derrumbe: '#6E4F32',
  deslizamiento: '#8E6E53',
  inundacion: '#2980B9',
};

export const INCIDENT_STATUS_LABELS: Record<IncidentStatus, string> = {
  activo: 'Activo',
  resuelto: 'Resuelto',
  archivado: 'Archivado',
};

export const INCIDENT_SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  Bajo: 'Bajo',
  Medio: 'Medio',
  Alto: 'Alto',
  Critico: 'Critico',
};
