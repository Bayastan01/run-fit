import { api, unwrap } from "./client";

export interface Battle {
  id: string;
  attackerUserId: string;
  defenderUserId: string | null;
  streetSegmentId: string;
  status: "SCHEDULED" | "ACTIVE" | "RESOLVED" | "CANCELLED";
  scheduledAt: string;
  expiresAt: string;
  resolvedAt: string | null;
  winnerSide: "ATTACKER" | "DEFENDER" | null;
  attackerDistanceM: number;
  defenderDistanceM: number;
}

export async function listBattles(): Promise<Battle[]> {
  const data = await unwrap<{ items: Battle[] }>(api.get("api/battles"));
  return data.items;
}

export async function declareBattle(streetSegmentId: string): Promise<Battle> {
  const data = await unwrap<{ battle: Battle }>(
    api.post("api/battles", { json: { streetSegmentId } }),
  );
  return data.battle;
}
