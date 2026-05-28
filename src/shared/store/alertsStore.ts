import { create } from "zustand";

import {
    INCIDENT_TYPES,
    type Incident,
    type IncidentSeverity,
    type IncidentType,
} from "@/features/incidents/types";

export type AlertFilter = "todas" | "programados" | "cercania";

export type AlertKind = "general" | "programado" | "cercania";

export type AlertItem = {
  id: string;
  incidentId: string;
  title: string;
  message: string;
  createdAt: string;
  kind: AlertKind;
  unread: boolean;
  incident: Incident;
  distanceKm?: number;
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

type NotificationPayload = {
  incidentId?: string;
  title?: string;
  body?: string;
  type?: IncidentType;
  severity?: IncidentSeverity;
  status?: Incident["status"];
  authority?: string;
  locationText?: string;
  geometryType?: Incident["geometryType"];
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  startAt?: string;
  endAt?: string;
};

type AlertsState = {
  alerts: AlertItem[];
  selectedAlertId: string | null;
  selectedFilter: AlertFilter;
  syncFromIncidents: (
    incidents: Incident[],
    userLocation?: Coordinate | null,
  ) => void;
  registerNotification: (payload: NotificationPayload) => void;
  setSelectedFilter: (filter: AlertFilter) => void;
  openAlertOnMap: (id: string) => void;
  markAlertAsRead: (id: string) => void;
  markAllAsRead: () => void;
  consumeSelectedAlert: () => void;
};

const ALERT_BASE_RADIUS_KM = 2.5;
const LINE_ALERT_BASE_RADIUS_KM = 5;

function isIncidentType(value: string): value is IncidentType {
  return INCIDENT_TYPES.includes(value as IncidentType);
}

function toNumber(value: number | string | undefined): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = Number(value);

    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return undefined;
}

function formatShortDateTime(dateIso: string): string {
  const date = new Date(dateIso);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");

  return `${day}/${month} ${hour}:${minute}`;
}

function calculateDistanceKm(from: Coordinate, to: Coordinate): number {
  const earthRadiusKm = 6371;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLatitude = toRadians(to.latitude - from.latitude);
  const deltaLongitude = toRadians(to.longitude - from.longitude);
  const latitude1 = toRadians(from.latitude);
  const latitude2 = toRadians(to.latitude);

  const a =
    Math.sin(deltaLatitude / 2) ** 2 +
    Math.sin(deltaLongitude / 2) ** 2 * Math.cos(latitude1) * Math.cos(latitude2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

function getIncidentReachRadiusKm(incident: Incident): number {
  const severityMultiplier: Record<IncidentSeverity, number> = {
    Bajo: 1,
    Medio: 1.15,
    Alto: 1.35,
    Critico: 1.65,
  };

  const baseRadius =
    incident.geometryType === "LineString"
      ? LINE_ALERT_BASE_RADIUS_KM
      : ALERT_BASE_RADIUS_KM;

  return baseRadius * severityMultiplier[incident.severity];
}

function getNearestCoordinateDistanceKm(
  incident: Incident,
  coordinate: Coordinate,
): number | undefined {
  if (incident.mapCoordinates.length === 0) {
    return undefined;
  }

  return incident.mapCoordinates.reduce((nearestDistance, point) => {
    const currentDistance = calculateDistanceKm(coordinate, point);

    if (nearestDistance == null) {
      return currentDistance;
    }

    return Math.min(nearestDistance, currentDistance);
  }, undefined as number | undefined);
}

function buildAlertItem(
  incident: Incident,
  previousAlert: AlertItem | undefined,
  userLocation?: Coordinate | null,
): AlertItem {
  const now = Date.now();
  const startTime = new Date(incident.startAt).getTime();
  const isScheduledClosure =
    incident.type === "cierre_programado" && startTime > now;

  const distanceKm =
    userLocation != null
      ? getNearestCoordinateDistanceKm(incident, userLocation)
      : undefined;
  const reachKm = getIncidentReachRadiusKm(incident);
  const isNearby = distanceKm != null && distanceKm <= reachKm;

  const kind: AlertKind = isScheduledClosure
    ? "programado"
    : isNearby
      ? "cercania"
      : "general";

  const message = isScheduledClosure
    ? `Programado para ${formatShortDateTime(incident.startAt)}.`
    : isNearby && distanceKm != null
      ? `A ${distanceKm.toFixed(1)} km de tu ubicacion.`
      : incident.endAt
        ? `Vigente hasta ${formatShortDateTime(incident.endAt)}.`
        : "Reporte activo.";

  return {
    id: incident.id,
    incidentId: incident.id,
    title: incident.title,
    message,
    createdAt: incident.startAt,
    kind,
    unread: previousAlert?.unread ?? true,
    incident,
    distanceKm,
  };
}

function buildIncidentFromNotification(
  payload: NotificationPayload,
): Incident | null {
  const latitude = toNumber(payload.latitude ?? payload.lat);
  const longitude = toNumber(payload.longitude ?? payload.lng);

  if (latitude == null || longitude == null) {
    return null;
  }

  const type =
    payload.type && isIncidentType(payload.type)
      ? payload.type
      : "bloqueo";

  return {
    id: payload.incidentId ?? `notification-${Date.now()}`,
    title: payload.title ?? "Nueva alerta",
    description: payload.body ?? payload.title ?? "Se genero una notificacion.",
    type,
    status: payload.status ?? "activo",
    severity: payload.severity ?? "Medio",
    authority: payload.authority ?? "Sistema",
    locationText: payload.locationText ?? payload.title ?? "Ubicacion notificada",
    geometryType: payload.geometryType ?? "Point",
    mapCoordinates: [{ latitude, longitude }],
    latitude,
    longitude,
    startAt: payload.startAt ?? new Date().toISOString(),
    endAt: payload.endAt,
    imageUrls: [],
  };
}

export const useAlertsStore = create<AlertsState>((set) => ({
  alerts: [],
  selectedAlertId: null,
  selectedFilter: "todas",
  syncFromIncidents: (incidents, userLocation) =>
    set((state) => {
      const previousByIncidentId = new Map(
        state.alerts.map((alert) => [alert.incidentId, alert]),
      );
      const incidentIds = new Set(incidents.map((incident) => incident.id));
      const preservedAlerts = state.alerts.filter(
        (alert) => !incidentIds.has(alert.incidentId),
      );

      const incidentAlerts = incidents
          .map((incident) =>
            buildAlertItem(
              incident,
              previousByIncidentId.get(incident.id),
              userLocation,
            ),
          )
          .sort(
            (firstAlert, secondAlert) =>
              new Date(secondAlert.createdAt).getTime() -
              new Date(firstAlert.createdAt).getTime(),
          );

      return {
        alerts: [...incidentAlerts, ...preservedAlerts].sort(
          (firstAlert, secondAlert) =>
            new Date(secondAlert.createdAt).getTime() -
            new Date(firstAlert.createdAt).getTime(),
        ),
      };
    }),
  registerNotification: (payload) => {
    const incident = buildIncidentFromNotification(payload);

    if (!incident) {
      return;
    }

    set((state) => {
      const previousAlert = state.alerts.find(
        (alert) => alert.incidentId === incident.id,
      );

      const nextAlert = buildAlertItem(incident, previousAlert, null);
      const nextAlerts = [
        nextAlert,
        ...state.alerts.filter((alert) => alert.incidentId !== incident.id),
      ].sort(
        (firstAlert, secondAlert) =>
          new Date(secondAlert.createdAt).getTime() -
          new Date(firstAlert.createdAt).getTime(),
      );

      return {
        alerts: nextAlerts,
      };
    });
  },
  setSelectedFilter: (filter) => set({ selectedFilter: filter }),
  openAlertOnMap: (id) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === id ? { ...alert, unread: false } : alert,
      ),
      selectedAlertId: id,
    })),
  markAlertAsRead: (id) =>
    set((state) => ({
      alerts: state.alerts.map((alert) =>
        alert.id === id ? { ...alert, unread: false } : alert,
      ),
    })),
  markAllAsRead: () =>
    set((state) => ({
      alerts: state.alerts.map((alert) => ({ ...alert, unread: false })),
    })),
  consumeSelectedAlert: () => set({ selectedAlertId: null }),
}));
