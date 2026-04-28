import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Persistent KV storage. Uses AsyncStorage so it works in both Expo Go
 * (no TurboModules) and dev-client builds. When we move to dev-client we
 * can swap implementation for MMKV without touching call sites.
 *
 * API:
 *   - getJSON<T>(key): returns Promise<T | null>
 *   - setJSON<T>(key, value): fire-and-forget; returns Promise<void>
 *   - getString / setString / remove: same shape
 */

const PREFIX = "runfit:";

function k(key: string): string { return PREFIX + key; }

export async function getJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(k(key));
    if (raw == null) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(k(key), JSON.stringify(value));
  } catch {}
}

export async function getString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(k(key));
  } catch {
    return null;
  }
}

export async function setString(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(k(key), value);
  } catch {}
}

export async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(k(key));
  } catch {}
}
