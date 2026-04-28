import { api, unwrap } from "./client";

export type BoostKind = "EARNINGS_2X" | "SHIELD_24H" | "ENERGY_REFILL";

export interface ActiveBoost {
  id: string;
  kind: BoostKind;
  startedAt: string;
  expiresAt: string;
}

export interface BoostsState {
  active: ActiveBoost[];
  prices: Record<BoostKind, { coin: number; durationH: number }>;
}

export async function fetchBoosts(): Promise<BoostsState> {
  return unwrap<BoostsState>(api.get("api/boosts"));
}

export async function purchaseBoost(kind: BoostKind): Promise<void> {
  await unwrap(api.post("api/boosts", { json: { kind } }));
}
