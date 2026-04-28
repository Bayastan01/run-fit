import { api, unwrap } from "./client";
import type { Balances } from "./wallet";

export interface ProfileFaction {
  id: string;
  name: string;
  color: string;
}

export interface ProfilePayload {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    level: number;
    xp: number;
    energy: number;
    factionId: string | null;
    guildId: string | null;
    createdAt: string;
    faction: ProfileFaction | null;
  };
  stats: {
    runsCount: number;
    totalDistanceM: number;
    totalDurationS: number;
    totalWeightedM: number;
    bestChain: number;
    ownedSegments: number;
    currentStreakDays: number;
  };
  balances: Balances;
}

export async function fetchProfile(): Promise<ProfilePayload> {
  return unwrap<ProfilePayload>(api.get("api/profile/stats"));
}

export interface FactionListItem {
  id: string;
  name: string;
  color: string;
  totalStreetsCached: number;
}

export async function fetchFactions(): Promise<FactionListItem[]> {
  const data = await unwrap<{ factions: FactionListItem[] }>(api.get("api/factions"));
  return data.factions;
}

export async function chooseFaction(factionId: string): Promise<void> {
  await unwrap(api.post("api/auth/faction", { json: { factionId } }));
}
