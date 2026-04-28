import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { StreetSegmentFeature } from "@/api/streets";

export interface LatLng {
  latitude: number;
  longitude: number;
}

interface TerritoryMapProps {
  segments: StreetSegmentFeature[];
  path: LatLng[];
  center: LatLng;
  userLocation?: LatLng | null;
  onSelect: (segment: StreetSegmentFeature) => void;
  onBoundsChanged?: (b: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => void;
}

export function TerritoryMap({
  segments, path, center, userLocation, onSelect, onBoundsChanged,
}: TerritoryMapProps) {
  const webRef = useRef<WebView | null>(null);

  const html = useMemo(() => buildHtml(center), []);

  function onMessage(e: WebViewMessageEvent) {
    try {
      const data = JSON.parse(e.nativeEvent.data) as
        | { type: "segmentTap"; id: string }
        | { type: "bounds"; minLng: number; minLat: number; maxLng: number; maxLat: number };
      if (data.type === "segmentTap") {
        const s = segments.find((seg) => seg.properties.id === data.id);
        if (s) onSelect(s);
      } else if (data.type === "bounds" && onBoundsChanged) {
        onBoundsChanged({ minLng: data.minLng, minLat: data.minLat, maxLng: data.maxLng, maxLat: data.maxLat });
      }
    } catch {}
  }

  useEffect(() => {
    if (!webRef.current) return;
    const json = JSON.stringify(segments.map((s) => ({
      id: s.properties.id,
      coords: s.geometry.coordinates.map(([lng, lat]) => [lat, lng]),
      color: s.properties.factionColor ?? "#3f3f46",
      isMine: s.properties.isMine,
      isOwned: s.properties.ownerId !== null,
    })));
    webRef.current.injectJavaScript(`if (window.runfit) { window.runfit.setSegments(${json}); } true;`);
  }, [segments]);

  useEffect(() => {
    if (!webRef.current) return;
    const json = JSON.stringify(path.map((p) => [p.latitude, p.longitude]));
    webRef.current.injectJavaScript(`if (window.runfit) { window.runfit.setPath(${json}); } true;`);
  }, [path]);

  useEffect(() => {
    if (!userLocation || !webRef.current) return;
    webRef.current.injectJavaScript(
      `if (window.runfit) { window.runfit.setUser(${userLocation.latitude}, ${userLocation.longitude}); } true;`,
    );
  }, [userLocation?.latitude, userLocation?.longitude]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit
        scrollEnabled={false}
        style={{ flex: 1, backgroundColor: "#0a0a0a" }}
        androidLayerType="hardware"
      />
    </View>
  );
}

function buildHtml(center: LatLng): string {
  const initial = JSON.stringify([center.latitude, center.longitude]);

  return /* html */ `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin:0; padding:0; height:100%; width:100%; background:#0a0a0a; }
  .leaflet-container { background:#0a0a0a; }
  .leaflet-control-attribution { font-size:9px; background:rgba(10,10,10,0.6); color:#888; }
  .leaflet-control-attribution a { color:#aaa; }
  .leaflet-control-zoom { display:none; }

  .user-dot { width: 18px; height: 18px; border-radius: 50%; background: #00ff88;
    border: 2px solid #fff; box-shadow: 0 0 0 8px rgba(0,255,136,0.25), 0 0 20px rgba(0,255,136,0.6); }
  .user-pulse { width: 60px; height: 60px; border-radius: 50%;
    background: radial-gradient(circle, rgba(0,255,136,0.35) 0%, rgba(0,255,136,0) 70%);
    animation: pulse 1.8s ease-out infinite; transform-origin: center; }
  @keyframes pulse { 0% { transform: scale(0.6); opacity: 1; } 100% { transform: scale(1.6); opacity: 0; } }

  .seg-flash { animation: flash 1.4s ease-out 1; }
  @keyframes flash { 0% { stroke-opacity: 1; stroke-width: 12; } 100% { stroke-opacity: 0.85; stroke-width: 6; } }
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
const map = L.map('map', { zoomControl: false, attributionControl: true, dragging: true, tap: true })
  .setView(${initial}, 16);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 20, attribution: '© OSM · CARTO', subdomains: 'abcd',
}).addTo(map);

function send(payload) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }
}

let segLayer = L.layerGroup().addTo(map);
let pathLine = null;
let userMarker = null;
let userPulse = null;

function setSegments(list) {
  segLayer.clearLayers();
  list.forEach((s) => {
    const opts = {
      color: s.color,
      weight: s.isMine ? 6 : (s.isOwned ? 5 : 3),
      opacity: s.isOwned ? 0.9 : 0.45,
      lineCap: 'round',
    };
    const pl = L.polyline(s.coords, opts);
    pl.on('click', () => send({ type: 'segmentTap', id: s.id }));
    pl.addTo(segLayer);
  });
}

function setPath(coords) {
  if (pathLine) { map.removeLayer(pathLine); pathLine = null; }
  if (!coords || coords.length === 0) return;
  pathLine = L.polyline(coords, { color: '#00ff88', weight: 4, lineCap: 'round' }).addTo(map);
}

function setUser(lat, lng) {
  const ll = [lat, lng];
  if (!userMarker) {
    const dot = L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
    const pulse = L.divIcon({ className: '', html: '<div class="user-pulse"></div>', iconSize: [60, 60], iconAnchor: [30, 30] });
    userPulse = L.marker(ll, { icon: pulse, interactive: false, keyboard: false, zIndexOffset: 999 }).addTo(map);
    userMarker = L.marker(ll, { icon: dot, interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(map);
    map.setView(ll, 16, { animate: true });
  } else {
    userMarker.setLatLng(ll);
    userPulse.setLatLng(ll);
    if (window.runfit.follow) map.panTo(ll, { animate: true });
  }
}

function emitBounds() {
  const b = map.getBounds();
  send({ type: 'bounds', minLng: b.getWest(), minLat: b.getSouth(), maxLng: b.getEast(), maxLat: b.getNorth() });
}

map.on('moveend', emitBounds);
setTimeout(emitBounds, 200);

window.runfit = { setSegments, setPath, setUser, follow: true };
</script>
</body></html>`;
}
