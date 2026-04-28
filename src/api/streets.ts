import { api, unwrap } from "./client";

export interface StreetSegmentFeature {
  type: "Feature";
  geometry: { type: "LineString"; coordinates: [number, number][] };
  properties: {
    id: string;
    streetId: string;
    streetName: string | null;
    lengthM: number;
    ownerId: string | null;
    ownerName: string | null;
    factionId: string | null;
    factionColor: string | null;
    capturedAt: string | null;
    defenseCount: number;
    flipCount: number;
    isMine: boolean;
  };
}

export interface StreetsCollection {
  type: "FeatureCollection";
  features: StreetSegmentFeature[];
}

export interface BBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export async function fetchStreets(bbox: BBox, ownedOnly = false): Promise<StreetsCollection> {
  const params: Record<string, string> = {
    minLng: String(bbox.minLng),
    minLat: String(bbox.minLat),
    maxLng: String(bbox.maxLng),
    maxLat: String(bbox.maxLat),
  };
  if (ownedOnly) params.owned = "1";
  return unwrap<StreetsCollection>(api.get("api/streets", { searchParams: params }));
}
