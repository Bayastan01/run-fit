import { api, unwrap } from "./client";

export interface DailyQuest {
  code: string;
  title: string;
  description: string;
  rewardCoin: number;
  rewardXp: number;
  progress: number;
  completed: boolean;
  claimedAt: string | null;
}

export async function fetchDailyQuests(): Promise<{ date: string; items: DailyQuest[] }> {
  return unwrap<{ date: string; items: DailyQuest[] }>(api.get("api/quests"));
}

export async function claimQuest(code: string): Promise<{ rewardCoin: number; rewardXp: number }> {
  return unwrap(api.post("api/quests/claim", { json: { code } }));
}
