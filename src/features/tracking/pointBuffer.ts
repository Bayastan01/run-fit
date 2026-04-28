import { MMKV } from "react-native-mmkv";
import { uploadPoints, type RunPointInput } from "@/api/runs";

const storage = new MMKV({ id: "run-fit-points" });

const KEY_RUN_ID = "currentRunId";
const KEY_POINTS = "pendingPoints";

interface BufferedPoint {
  ts: number;
  lat: number;
  lng: number;
  accuracyM: number | null;
  speedMps: number;
  altitude: number | null;
}

class PointBuffer {
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private flushing = false;

  attachRun(runId: string): void {
    storage.set(KEY_RUN_ID, runId);
    storage.delete(KEY_POINTS);
    this.startFlushTimer();
  }

  detachRun(): void {
    this.stopFlushTimer();
    void this.flush();
    storage.delete(KEY_RUN_ID);
  }

  push(p: BufferedPoint): void {
    const arr = this.read();
    arr.push(p);
    storage.set(KEY_POINTS, JSON.stringify(arr));
  }

  pushMany(points: BufferedPoint[]): void {
    if (points.length === 0) return;
    const arr = this.read();
    arr.push(...points);
    storage.set(KEY_POINTS, JSON.stringify(arr));
  }

  private read(): BufferedPoint[] {
    const raw = storage.getString(KEY_POINTS);
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
    const runId = storage.getString(KEY_RUN_ID);
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
      storage.delete(KEY_POINTS);
    } catch {
      // keep buffer for retry
    } finally {
      this.flushing = false;
    }
  }
}

export const pointBuffer = new PointBuffer();
