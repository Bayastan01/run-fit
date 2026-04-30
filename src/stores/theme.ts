import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "runfit:theme";

export type ThemeMode = "light" | "dark";

interface ThemeState {
  mode: ThemeMode;
  ready: boolean;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  hydrate: () => Promise<void>;
}

export const useTheme = create<ThemeState>((set, get) => ({
  mode: "dark", // matches existing app design until user toggles
  ready: false,
  setMode: (m) => {
    set({ mode: m });
    void AsyncStorage.setItem(KEY, m);
  },
  toggle: () => {
    const next: ThemeMode = get().mode === "dark" ? "light" : "dark";
    set({ mode: next });
    void AsyncStorage.setItem(KEY, next);
  },
  hydrate: async () => {
    try {
      const v = await AsyncStorage.getItem(KEY);
      if (v === "light" || v === "dark") set({ mode: v });
    } catch {}
    set({ ready: true });
  },
}));

/**
 * Map tile URL to use for the WebView Leaflet maps.
 * - dark mode → CARTO dark_all (current)
 * - light mode → CARTO voyager (neutral, readable, not too bright)
 */
export function tileUrlForTheme(mode: ThemeMode): string {
  return mode === "light"
    ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
}

/** Background colour to use behind the WebView while tiles load. */
export function mapBackgroundForTheme(mode: ThemeMode): string {
  return mode === "light" ? "#f5f5f5" : "#0a0a0a";
}
