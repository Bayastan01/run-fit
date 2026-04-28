import { create } from "zustand";

export interface RunPointDraft {
  ts: number;
  lat: number;
  lng: number;
  accuracyM?: number;
  speedMps?: number;
  altitude?: number;
}

interface ActiveRunState {
  runId: string | null;
  startedAt: number | null;
  isPaused: boolean;
  distanceM: number;
  points: RunPointDraft[];
  start: (runId: string) => void;
  pause: () => void;
  resume: () => void;
  appendPoint: (p: RunPointDraft) => void;
  reset: () => void;
}

export const useActiveRun = create<ActiveRunState>((set) => ({
  runId: null,
  startedAt: null,
  isPaused: false,
  distanceM: 0,
  points: [],
  start: (runId) => set({ runId, startedAt: Date.now(), isPaused: false, distanceM: 0, points: [] }),
  pause: () => set({ isPaused: true }),
  resume: () => set({ isPaused: false }),
  appendPoint: (p) =>
    set((state) => {
      const next = [...state.points, p];
      let distanceM = state.distanceM;
      if (state.points.length > 0) {
        const prev = state.points[state.points.length - 1];
        distanceM += haversineMeters(prev.lat, prev.lng, p.lat, p.lng);
      }
      return { points: next, distanceM };
    }),
  reset: () => set({ runId: null, startedAt: null, isPaused: false, distanceM: 0, points: [] }),
}));

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
