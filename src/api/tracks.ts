import { api, unwrap } from "./client";

export interface TrackOverlay {
  runId: string;
  geometry: { type: "LineString"; coordinates: [number, number][] };
}

export async function fetchMyTracksInBbox(bbox: {
  minLng: number; minLat: number; maxLng: number; maxLat: number;
}): Promise<TrackOverlay[]> {
  const data = await unwrap<{ tracks: TrackOverlay[] }>(api.get("api/runs/tracks", {
    searchParams: {
      minLng: bbox.minLng, minLat: bbox.minLat, maxLng: bbox.maxLng, maxLat: bbox.maxLat,
    },
  }));
  return data.tracks;
}
