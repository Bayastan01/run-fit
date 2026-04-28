/**
 * Native MapLibre map (vector tiles + ShapeSource).
 *
 * Используется только в dev-client / production билде (не Expo Go).
 * В Expo Go клиенте — fallback на TerritoryMap (Leaflet WebView).
 */
import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import MapLibreGL, {
  type MapViewRef,
  type CameraRef,
} from "@maplibre/maplibre-react-native";
import type { StreetSegmentFeature } from "@/api/streets";
import { env } from "@/lib/env";

export interface LatLng {
  latitude: number;
  longitude: number;
}

interface Props {
  segments: StreetSegmentFeature[];
  center: LatLng;
  userLocation?: LatLng | null;
  onSelect: (s: StreetSegmentFeature) => void;
  onBoundsChanged?: (b: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => void;
}

const STYLE_URL = `${env.tilesUrl}/style.json`;

export function TerritoryMapNative({ segments, center, userLocation, onSelect, onBoundsChanged }: Props) {
  const mapRef = useRef<MapViewRef | null>(null);
  const cameraRef = useRef<CameraRef | null>(null);

  const segmentCollection = useMemo(
    () => ({ type: "FeatureCollection" as const, features: segments }),
    [segments],
  );

  useEffect(() => {
    if (!userLocation || !cameraRef.current) return;
    cameraRef.current.setCamera({
      centerCoordinate: [userLocation.longitude, userLocation.latitude],
      zoomLevel: 16,
      animationDuration: 600,
    });
  }, [userLocation?.latitude, userLocation?.longitude]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <MapLibreGL.MapView
        ref={mapRef}
        style={{ flex: 1 }}
        mapStyle={STYLE_URL}
        compassEnabled={false}
        attributionEnabled={false}
        logoEnabled={false}
        onRegionDidChange={async () => {
          if (!mapRef.current || !onBoundsChanged) return;
          try {
            const visible = await mapRef.current.getVisibleBounds();
            // visible: [[neLng, neLat], [swLng, swLat]]
            const ne = visible[0];
            const sw = visible[1];
            onBoundsChanged({
              minLng: sw[0],
              minLat: sw[1],
              maxLng: ne[0],
              maxLat: ne[1],
            });
          } catch {}
        }}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          defaultSettings={{
            centerCoordinate: [center.longitude, center.latitude],
            zoomLevel: 15,
          }}
        />

        <MapLibreGL.ShapeSource
          id="streets-source"
          shape={segmentCollection}
          onPress={(e) => {
            const f = e.features[0];
            const id = f?.properties?.id;
            if (typeof id === "string") {
              const seg = segments.find((s) => s.properties.id === id);
              if (seg) onSelect(seg);
            }
          }}
        >
          <MapLibreGL.LineLayer
            id="streets-line"
            style={{
              lineColor: ["coalesce", ["get", "factionColor"], "#3f3f46"] as never,
              lineWidth: ["case", ["get", "isMine"], 6, ["!=", ["get", "ownerId"], null], 5, 3] as never,
              lineOpacity: ["case", ["!=", ["get", "ownerId"], null], 0.9, 0.45] as never,
              lineCap: "round",
              lineJoin: "round",
            }}
          />
        </MapLibreGL.ShapeSource>

        {userLocation && <MapLibreGL.UserLocation visible animated />}
      </MapLibreGL.MapView>
    </View>
  );
}

export const isMapLibreAvailable = (): boolean => {
  try {
    return typeof MapLibreGL?.MapView === "function";
  } catch {
    return false;
  }
};
