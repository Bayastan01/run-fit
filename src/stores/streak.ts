import { create } from "zustand";
import { getJSON, setJSON } from "@/lib/storage";

const KEY = "streak.v1";

interface StreakStored {
  lastActiveDay: string | null;
  current: number;
  best: number;
  totalDays: number;
}

interface StreakState extends StreakStored {
  multiplier: number;
  ranToday: boolean;
  atRisk: boolean;
  recordRun: () => Promise<void>;
  refresh: () => void;
  hydrate: () => Promise<void>;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86_400_000);
}

function computeMultiplier(current: number): number {
  return 1 + Math.min(0.5, current * 0.05);
}

function isAtRisk(lastActive: string | null): boolean {
  if (!lastActive) return false;
  const today = todayISO();
  if (lastActive === today) return false;
  if (dayDiff(lastActive, today) === 1) {
    const hour = new Date().getHours();
    return hour >= 18;
  }
  return false;
}

export const useStreak = create<StreakState>((set, get) => ({
  lastActiveDay: null,
  current: 0,
  best: 0,
  totalDays: 0,
  multiplier: 1,
  ranToday: false,
  atRisk: false,

  hydrate: async () => {
    const stored = await getJSON<StreakStored>(KEY);
    if (!stored) return;

    const today = todayISO();
    let { lastActiveDay, current, best, totalDays } = stored;
    if (lastActiveDay && lastActiveDay !== today) {
      const gap = dayDiff(lastActiveDay, today);
      if (gap > 1) current = 0;
    }
    const ranToday = lastActiveDay === today;
    set({
      lastActiveDay, current, best, totalDays,
      multiplier: computeMultiplier(current),
      ranToday,
      atRisk: isAtRisk(lastActiveDay),
    });
  },

  recordRun: async () => {
    const today = todayISO();
    const prev = get();
    if (prev.lastActiveDay === today) return;

    let next = prev.current;
    if (prev.lastActiveDay && dayDiff(prev.lastActiveDay, today) === 1) {
      next = prev.current + 1;
    } else {
      next = 1;
    }
    const best = Math.max(prev.best, next);
    const totalDays = prev.totalDays + 1;

    const stored: StreakStored = { lastActiveDay: today, current: next, best, totalDays };
    await setJSON(KEY, stored);
    set({
      lastActiveDay: today, current: next, best, totalDays,
      multiplier: computeMultiplier(next),
      ranToday: true,
      atRisk: false,
    });
  },

  refresh: () => {
    const s = get();
    set({ atRisk: isAtRisk(s.lastActiveDay) });
  },
}));
