import { api, unwrap } from "./client";

export interface HeatCell {
  lat: number;
  lng: number;
  count: number;
  color: string | null;
}

export async function fetchHeatmap(bbox: {
  minLng: number; minLat: number; maxLng: number; maxLat: number;
}): Promise<{ resolution: number; cellSize: number; cells: HeatCell[] }> {
  return unwrap(api.get("api/heatmap", {
    searchParams: {
      minLng: bbox.minLng, minLat: bbox.minLat, maxLng: bbox.maxLng, maxLat: bbox.maxLat,
    },
  }));
}
