import { api, unwrap } from "./client";

export interface Neighbour {
  id: string;
  displayName: string;
  level: number;
  factionId: string | null;
  cell: string;
}

export async function fetchNeighbours(radius: 1 | 2 | 3 = 2): Promise<Neighbour[]> {
  const data = await unwrap<{ items: Neighbour[] }>(
    api.get("api/neighbours", { searchParams: { radius: String(radius) } }),
  );
  return data.items;
}
