import type { Incident } from '@/features/incidents/types';

const now = Date.now();
const twelveMinutesAgo = new Date(now - 12 * 60 * 1000).toISOString();
const fortyFiveMinutesFromNow = new Date(now + 45 * 60 * 1000).toISOString();

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    title: 'Colision vehicular',
    description:
      'Dos vehiculos colisionaron en la interseccion. Carril derecho bloqueado, se recomienda circular por el carril izquierdo o buscar ruta alterna.',
    type: 'accidente',
    status: 'activo',
    severity: 'alta',
    authority: 'GAMC',
    locationText: 'Av. Ballivian con calle Heroinas, carril derecho bloqueado',
    latitude: -17.3852,
    longitude: -66.1693,
    startAt: twelveMinutesAgo,
    endAt: fortyFiveMinutesFromNow,
    imageUrls: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  {
    id: 'inc-2',
    title: 'Bloqueo por obra en Av. Blanco Galindo',
    description: 'Intervencion vial en interseccion principal.',
    type: 'bloqueo',
    status: 'activo',
    severity: 'media',
    authority: 'ABC',
    locationText: 'Av. Blanco Galindo km 4, sentido oeste-este',
    latitude: -17.397,
    longitude: -66.1876,
    startAt: '2026-04-16T09:00:00.000Z',
  },
  {
    id: 'inc-3',
    title: 'Mantenimiento semaforo en zona Recoleta',
    description: 'Trabajo tecnico programado durante la manana.',
    type: 'mantenimiento',
    status: 'activo',
    severity: 'baja',
    authority: 'Transito',
    locationText: 'Plaza Recoleta, interseccion principal',
    latitude: -17.3767,
    longitude: -66.1575,
    startAt: '2026-04-16T09:35:00.000Z',
    endAt: '2026-04-16T11:05:00.000Z',
    imageUrls: [
      'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1000&q=80',
    ],
  },
  {
    id: 'inc-4',
    title: 'Accidente menor resuelto',
    description: 'Via normalizada por agentes de transito.',
    type: 'accidente',
    status: 'resuelto',
    severity: 'media',
    authority: 'Transito',
    locationText: 'Puente Cobija, lado sur',
    latitude: -17.4021,
    longitude: -66.1748,
    startAt: '2026-04-15T22:10:00.000Z',
    endAt: '2026-04-15T23:00:00.000Z',
  },
  {
    id: 'inc-5',
    title: 'Bloqueo archivado',
    description: 'Evento historico, no activo.',
    type: 'bloqueo',
    status: 'archivado',
    severity: 'baja',
    authority: 'GAMC',
    locationText: 'Ruta a Sacaba, ingreso antiguo',
    latitude: -17.4092,
    longitude: -66.1436,
    startAt: '2026-04-14T19:30:00.000Z',
  },
];
