import { api, unwrap } from "./client";

export type LeaderboardScope = "distance_week" | "captures_week" | "coins_week" | "level";

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  factionId: string | null;
  factionColor: string | null;
  level: number;
  value: number;
}

export async function fetchLeaderboard(
  scope: LeaderboardScope,
  factionId?: string,
): Promise<LeaderboardEntry[]> {
  const params: Record<string, string> = { scope };
  if (factionId) params.faction = factionId;
  const data = await unwrap<{ scope: string; items: LeaderboardEntry[] }>(
    api.get("api/leaderboards", { searchParams: params }),
  );
  return data.items;
}
