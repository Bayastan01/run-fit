export type TerritoryStatus = "owned" | "contested" | "high-value" | "expiring";
export type TerritoryOwner = "user" | "other";

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Territory {
  id: number;
  ownerName: string;
  ownerAvatar: string;
  owner: TerritoryOwner;
  color: string;
  earnings: number;
  status: TerritoryStatus;
  timeRemaining: string;
  /** Closed loop in geo coords. */
  polygon: LatLng[];
  /** Centroid for label placement. */
  center: LatLng;
  pendingAmount?: number;
  attacks?: number;
  isKingZone?: boolean;
}

/** Fallback центр карты, если у пользователя ещё нет геолокации (Парк Победы, Москва). */
export const FALLBACK_CENTER: LatLng = { latitude: 55.7325, longitude: 37.5106 };

/** Backwards-compat alias used in older code paths. */
export const MAP_CENTER: LatLng = FALLBACK_CENTER;

/**
 * Каждая территория — описывается как набор офсетов в градусах от любого центра.
 * Это позволяет регенерировать территории вокруг текущего положения пользователя.
 */
interface TerritoryTemplate {
  id: number;
  ownerName: string;
  ownerAvatar: string;
  owner: TerritoryOwner;
  color: string;
  earnings: number;
  status: TerritoryStatus;
  timeRemaining: string;
  pendingAmount?: number;
  attacks?: number;
  isKingZone?: boolean;
  /** Polygon offsets [latOff, lngOff]. */
  polygonOffsets: [number, number][];
  centerOffset: [number, number];
}

const TEMPLATES: TerritoryTemplate[] = [
  {
    id: 1, ownerName: "Ты", ownerAvatar: "⚡", owner: "user", color: "#00ff88",
    earnings: 4.20, status: "owned", timeRemaining: "18ч 24м",
    polygonOffsets: [[ 0.0020,-0.0040],[ 0.0026,-0.0020],[ 0.0008,-0.0010],[ 0.0002,-0.0030]],
    centerOffset:    [ 0.0014,-0.0025],
  },
  {
    id: 2, ownerName: "Ты", ownerAvatar: "⚡", owner: "user", color: "#00ff88",
    earnings: 8.50, status: "high-value", timeRemaining: "5ч 12м", pendingAmount: 12.40, isKingZone: true,
    polygonOffsets: [[ 0.0030, 0.0010],[ 0.0036, 0.0040],[ 0.0018, 0.0046],[ 0.0012, 0.0016]],
    centerOffset:    [ 0.0024, 0.0028],
  },
  {
    id: 3, ownerName: "Ты", ownerAvatar: "⚡", owner: "user", color: "#00ff88",
    earnings: 1.95, status: "contested", timeRemaining: "2ч 45м", attacks: 3,
    polygonOffsets: [[-0.0006,-0.0008],[ 0.0000, 0.0014],[-0.0018, 0.0020],[-0.0024,-0.0002]],
    centerOffset:    [-0.0012, 0.0006],
  },
  {
    id: 4, ownerName: "Ты", ownerAvatar: "⚡", owner: "user", color: "#00ff88",
    earnings: 2.80, status: "expiring", timeRemaining: "0ч 47м",
    polygonOffsets: [[-0.0008, 0.0030],[-0.0002, 0.0050],[-0.0020, 0.0056],[-0.0026, 0.0036]],
    centerOffset:    [-0.0014, 0.0043],
  },
  {
    id: 5, ownerName: "Алекс", ownerAvatar: "🏃", owner: "other", color: "#6366f1",
    earnings: 5.40, status: "high-value", timeRemaining: "12ч 30м",
    polygonOffsets: [[-0.0026,-0.0048],[-0.0020,-0.0028],[-0.0038,-0.0022],[-0.0044,-0.0042]],
    centerOffset:    [-0.0032,-0.0035],
  },
  {
    id: 6, ownerName: "Сара", ownerAvatar: "🏃‍♀️", owner: "other", color: "#8b5cf6",
    earnings: 3.75, status: "owned", timeRemaining: "9ч 15м",
    polygonOffsets: [[ 0.0040,-0.0024],[ 0.0046,-0.0004],[ 0.0028, 0.0002],[ 0.0022,-0.0018]],
    centerOffset:    [ 0.0034,-0.0011],
  },
];

const PATH_OFFSETS: [number, number][] = [
  [ 0.0008,-0.0050],
  [ 0.0014,-0.0044],
  [ 0.0018,-0.0038],
  [ 0.0022,-0.0028],
  [ 0.0024,-0.0018],
  [ 0.0026,-0.0010],
];

function applyOffset(center: LatLng, [latOff, lngOff]: [number, number]): LatLng {
  return { latitude: center.latitude + latOff, longitude: center.longitude + lngOff };
}

/** Generate territories anchored to a real-world center (e.g. user's GPS). */
export function generateTerritories(center: LatLng): Territory[] {
  return TEMPLATES.map((t) => ({
    id: t.id,
    ownerName: t.ownerName,
    ownerAvatar: t.ownerAvatar,
    owner: t.owner,
    color: t.color,
    earnings: t.earnings,
    status: t.status,
    timeRemaining: t.timeRemaining,
    pendingAmount: t.pendingAmount,
    attacks: t.attacks,
    isKingZone: t.isKingZone,
    polygon: t.polygonOffsets.map((o) => applyOffset(center, o)),
    center:  applyOffset(center, t.centerOffset),
  }));
}

export function generatePath(center: LatLng): LatLng[] {
  return PATH_OFFSETS.map((o) => applyOffset(center, o));
}

/** Default territories around the fallback center (used for design/preview). */
export const MOCK_TERRITORIES: Territory[] = generateTerritories(FALLBACK_CENTER);
export const SAMPLE_PATH: LatLng[] = generatePath(FALLBACK_CENTER);
