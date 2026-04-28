import { api, unwrap } from "./client";

export interface Balances {
  ENERGY: number;
  COIN: number;
  SHARD: number;
}

export interface LedgerEntry {
  id: string;
  type: keyof Balances;
  delta: number;
  reason: string;
  refType: string | null;
  refId: string | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export async function fetchBalance(): Promise<Balances> {
  const data = await unwrap<{ balances: Balances }>(api.get("api/wallet/balance"));
  return data.balances;
}

export async function fetchTransactions(cursor?: string): Promise<{ items: LedgerEntry[]; nextCursor: string | null }> {
  return unwrap(api.get("api/wallet/transactions", {
    searchParams: cursor ? { cursor, limit: "30" } : { limit: "30" },
  }));
}
