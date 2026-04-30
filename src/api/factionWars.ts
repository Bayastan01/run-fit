import { api, unwrap } from "./client";

export interface FactionStat {
  id: string;
  name: string;
  color: string;
  segmentsOwned: number;
  members: number;
  totalDistanceM: number;
  sharePct: number;
}

export async function fetchFactionWars(): Promise<{ factions: FactionStat[]; totalSegments: number }> {
  return unwrap(api.get("api/faction-wars"));
}
