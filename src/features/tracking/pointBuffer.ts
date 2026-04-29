/**
 * Offline GPS-point buffer with retry.
 *
 * Tries `react-native-mmkv` first (sync, fast).
 * Falls back to `@react-native-async-storage/async-storage` when MMKV
 * is unavailable (Expo Go without new architecture).
 */
import { uploadPoints, type RunPointInput } from "@/api/runs";

const KEY_RUN_ID = "runfit_currentRunId";
const KEY_POINTS = "runfit_pendingPoints";

interface BufferedPoint {
  ts: number;
  lat: number;
  lng: number;
  accuracyM: number | null;
  speedMps: number;
  altitude: number | null;
}

interface KV {
  get(key: string): string | null;
  set(key: string, value: string): void;
  delete(key: string): void;
  /** Resolves when any pending async writes have flushed to disk. */
  drain(): Promise<void>;
}

let kv: KV | null = null;

function getKV(): KV {
  if (kv) return kv;
  try {
    // Lazy require so MMKV's TurboModule check doesn't run on app boot in Expo Go.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { MMKV } = require("react-native-mmkv") as typeof import("react-native-mmkv");
    const mm = new MMKV({ id: "run-fit-points" });
    kv = {
      get: (k) => mm.getString(k) ?? null,
      set: (k, v) => mm.set(k, v),
      delete: (k) => mm.delete(k),
      drain: () => Promise.resolve(),
    };
    return kv;
  } catch {
    // Fallback: sync wrapper around AsyncStorage with in-memory cache.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const AsyncStorage = require("@react-native-async-storage/async-storage").default as {
      getItem(key: string): Promise<string | null>;
      setItem(key: string, value: string): Promise<void>;
      removeItem(key: string): Promise<void>;
    };
    const cache = new Map<string, string>();
    let pending: Promise<unknown> = Promise.all([
      AsyncStorage.getItem(KEY_RUN_ID).then((v) => { if (v) cache.set(KEY_RUN_ID, v); }).catch(() => {}),
      AsyncStorage.getItem(KEY_POINTS).then((v) => { if (v) cache.set(KEY_POINTS, v); }).catch(() => {}),
    ]);
    function chain(p: Promise<unknown>): void {
      pending = pending.then(() => p).catch(() => {});
    }
    kv = {
      get: (k) => cache.get(k) ?? null,
      set: (k, v) => {
        cache.set(k, v);
        chain(AsyncStorage.setItem(k, v));
      },
      delete: (k) => {
        cache.delete(k);
        chain(AsyncStorage.removeItem(k));
      },
      drain: () => pending.then(() => undefined).catch(() => undefined),
    };
    return kv;
  }
}

class PointBuffer {
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  attachRun(runId: string): void {
    const s = getKV();
    s.set(KEY_RUN_ID, runId);
    s.delete(KEY_POINTS);
    this.startFlushTimer();
  }

  async detachRun(): Promise<void> {
    this.stopFlushTimer();
    await this.flush().catch(() => {});
    const s = getKV();
    s.delete(KEY_RUN_ID);
    await s.drain().catch(() => {});
  }

  push(p: BufferedPoint): void {
    const arr = this.read();
    arr.push(p);
    getKV().set(KEY_POINTS, JSON.stringify(arr));
  }

  pushMany(points: BufferedPoint[]): void {
    if (points.length === 0) return;
    const arr = this.read();
    arr.push(...points);
    getKV().set(KEY_POINTS, JSON.stringify(arr));
  }

  private read(): BufferedPoint[] {
    const raw = getKV().get(KEY_POINTS);
    if (!raw) return [];
    try { return JSON.parse(raw) as BufferedPoint[]; } catch { return []; }
  }

  size(): number {
    return this.read().length;
  }

  private startFlushTimer(): void {
    if (this.flushTimer) return;
    this.flushTimer = setInterval(() => { void this.flush(); }, 15_000);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = null;
  }

  async flush(): Promise<void> {
    if (this.flushing) return;
    const s = getKV();
    const runId = s.get(KEY_RUN_ID);
    if (!runId) return;
    const all = this.read();
    if (all.length === 0) return;

    this.flushing = true;
    try {
      const payload: RunPointInput[] = all.map((p) => ({
        ts: new Date(p.ts).toISOString(),
        lat: p.lat,
        lng: p.lng,
        accuracyM: p.accuracyM ?? undefined,
        speedMps: p.speedMps,
        altitude: p.altitude ?? undefined,
      }));
      await uploadPoints(runId, payload);
      s.delete(KEY_POINTS);
    } catch {
      // keep buffer for retry
    } finally {
      this.flushing = false;
    }
  }
}

export const pointBuffer = new PointBuffer();
