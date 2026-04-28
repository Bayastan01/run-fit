import { create } from "zustand";
import { getJSON, setJSON } from "@/lib/storage";

const KEY = "privacy.v1";

export interface PrivacyZone {
  centerLat: number;
  centerLng: number;
  radiusM: number;
}

interface PrivacyStored {
  zones: PrivacyZone[];
  ghostMode: boolean;
}

interface PrivacyState extends PrivacyStored {
  isInside: (lat: number, lng: number) => boolean;
  addZone: (z: PrivacyZone) => Promise<void>;
  removeZone: (idx: number) => Promise<void>;
  setGhostMode: (v: boolean) => Promise<void>;
  hydrate: () => Promise<void>;
}

const DEFAULT: PrivacyStored = { zones: [], ghostMode: false };

function distanceM(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const usePrivacy = create<PrivacyState>((set, get) => ({
  ...DEFAULT,

  hydrate: async () => {
    const stored = await getJSON<PrivacyStored>(KEY);
    if (stored) set(stored);
  },

  isInside: (lat, lng) => {
    return get().zones.some((z) => distanceM(lat, lng, z.centerLat, z.centerLng) <= z.radiusM);
  },

  addZone: async (z) => {
    const zones = [...get().zones, z];
    await setJSON(KEY, { zones, ghostMode: get().ghostMode });
    set({ zones });
  },

  removeZone: async (idx) => {
    const zones = get().zones.filter((_, i) => i !== idx);
    await setJSON(KEY, { zones, ghostMode: get().ghostMode });
    set({ zones });
  },

  setGhostMode: async (v) => {
    await setJSON(KEY, { zones: get().zones, ghostMode: v });
    set({ ghostMode: v });
  },
}));
