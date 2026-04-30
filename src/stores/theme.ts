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
 * - dark mode → CARTO dark_all (lifted via CSS filter for readability)
 * - light mode → CARTO voyager (neutral, readable in daylight)
 */
export function tileUrlForTheme(mode: ThemeMode): string {
  return mode === "light"
    ? "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
}

/** Background colour behind the WebView while tiles load. */
export function mapBackgroundForTheme(mode: ThemeMode): string {
  return mode === "light" ? "#f5f5f5" : "#1a1d24";
}

/**
 * CSS filter applied to .leaflet-tile in HTML so the dark theme is
 * brighter/more readable than CARTO's near-black dark_all out of the
 * box. Light theme passes through unchanged.
 */
export function tileFilterForTheme(mode: ThemeMode): string {
  return mode === "light"
    ? "none"
    : "brightness(1.45) contrast(0.85) saturate(0.85)";
}
