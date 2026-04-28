import { create } from "zustand";
import { getJSON, setJSON } from "@/lib/storage";

const KEY = "quest.v1";

interface QuestStored {
  firstRunCompleted: boolean;
  firstStreetCaptured: boolean;
  lastBannerShown: number | null;
}

interface QuestState extends QuestStored {
  showWowAnimation: boolean;
  hydrate: () => Promise<void>;
  markFirstRun: () => Promise<void>;
  markFirstCapture: () => Promise<void>;
  triggerWow: () => void;
  dismissWow: () => void;
}

const DEFAULT: QuestStored = {
  firstRunCompleted: false,
  firstStreetCaptured: false,
  lastBannerShown: null,
};

export const useQuest = create<QuestState>((set, get) => ({
  ...DEFAULT,
  showWowAnimation: false,

  hydrate: async () => {
    const stored = await getJSON<QuestStored>(KEY);
    if (stored) set(stored);
  },

  markFirstRun: async () => {
    if (get().firstRunCompleted) return;
    const next: QuestStored = { ...get(), firstRunCompleted: true };
    await setJSON(KEY, next);
    set(next);
  },

  markFirstCapture: async () => {
    if (get().firstStreetCaptured) return;
    const next: QuestStored = { ...get(), firstStreetCaptured: true };
    await setJSON(KEY, next);
    set({ ...next, showWowAnimation: true });
  },

  triggerWow: () => set({ showWowAnimation: true }),
  dismissWow: () => set({ showWowAnimation: false }),
}));
