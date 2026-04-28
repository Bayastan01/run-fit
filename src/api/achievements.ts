import { api, unwrap } from "./client";

export type AchievementRarity = "common" | "rare" | "epic" | "legendary";

export interface AchievementItem {
  code: string;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface AchievementsResponse {
  total: number;
  unlocked: number;
  items: AchievementItem[];
}

export async function fetchAchievements(): Promise<AchievementsResponse> {
  return unwrap<AchievementsResponse>(api.get("api/achievements"));
}
