import { api, unwrap } from "./client";

export interface RunPointInput {
  ts: string;
  lat: number;
  lng: number;
  accuracyM?: number;
  speedMps?: number;
  altitude?: number;
}

export async function startRun(): Promise<{ runId: string; startedAt: string }> {
  return unwrap(
    api.post("api/runs", { json: { startedAt: new Date().toISOString() } }),
  );
}

export async function uploadPoints(runId: string, points: RunPointInput[]): Promise<{ accepted: number }> {
  return unwrap(
    api.post(`api/runs/${runId}/points`, { json: { points } }),
  );
}

export interface FinishResult {
  runId: string;
  status: "FINISHED" | "INVALID";
  distanceM: number;
  durationS: number;
  avgPaceS: number | null;
  pointsCount: number;
  suspectScore: number;
}

export async function finishRun(runId: string): Promise<FinishResult> {
  return unwrap(
    api.post(`api/runs/${runId}/finish`, { json: { finishedAt: new Date().toISOString() } }),
  );
}

export interface RunListItem {
  id: string;
  startedAt: string;
  finishedAt: string | null;
  distanceM: number;
  durationS: number;
  avgPaceS: number | null;
  status: "ACTIVE" | "FINISHED" | "INVALID";
}

export async function listRuns(cursor?: string): Promise<{ items: RunListItem[]; nextCursor: string | null }> {
  return unwrap(
    api.get("api/runs", { searchParams: cursor ? { cursor, limit: "20" } : { limit: "20" } }),
  );
}
