import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import type { StreetSegmentFeature } from "@/api/streets";
import { useTheme, tileUrlForTheme, mapBackgroundForTheme, type ThemeMode } from "@/stores/theme";

export interface LatLng {
  latitude: number;
  longitude: number;
}

interface TerritoryMapProps {
  segments: StreetSegmentFeature[];
  path: LatLng[];
  center: LatLng;
  userLocation?: LatLng | null;
  /** Old GPS tracks to overlay as faded polylines (GeoJSON [lng,lat]). */
  historyTracks?: { runId: string; coordinates: [number, number][] }[];
  onSelect: (segment: StreetSegmentFeature) => void;
  onBoundsChanged?: (b: { minLng: number; minLat: number; maxLng: number; maxLat: number }) => void;
}

export function TerritoryMap({
  segments, path, center, userLocation, historyTracks, onSelect, onBoundsChanged,
}: TerritoryMapProps) {
  const webRef = useRef<WebView | null>(null);
  const themeMode = useTheme((s) => s.mode);

  // HTML rebuild only when the *initial* center changes by >0.001° (~110m)
  // OR theme switches. Re-rendering the WebView on every GPS tick would
  // reset all layers; a theme toggle is rare enough to warrant a rebuild.
  const html = useMemo(
    () => buildHtml(center, themeMode),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [Math.round(center.latitude * 1000) / 1000, Math.round(center.longitude * 1000) / 1000, themeMode],
  );

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

  useEffect(() => {
    if (!webRef.current) return;
    const payload = (historyTracks ?? []).map((t) => ({
      coords: t.coordinates.map(([lng, lat]) => [lat, lng]),
    }));
    webRef.current.injectJavaScript(
      `if (window.runfit && window.runfit.setHistoryTracks) { window.runfit.setHistoryTracks(${JSON.stringify(payload)}); } true;`,
    );
  }, [historyTracks]);

  const bg = mapBackgroundForTheme(themeMode);
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <WebView
        ref={webRef}
        originWhitelist={["*"]}
        source={{ html }}
        onMessage={onMessage}
        javaScriptEnabled
        domStorageEnabled
        scalesPageToFit
        scrollEnabled={false}
        style={{ flex: 1, backgroundColor: bg }}
        androidLayerType="hardware"
      />
    </View>
  );
}

function buildHtml(center: LatLng, theme: ThemeMode): string {
  const initial = JSON.stringify([center.latitude, center.longitude]);
  const tileUrl = tileUrlForTheme(theme);
  const bg = mapBackgroundForTheme(theme);
  // attribution colour adapts so it stays readable on both themes
  const attrBg   = theme === "light" ? "rgba(255,255,255,0.7)" : "rgba(10,10,10,0.6)";
  const attrText = theme === "light" ? "#444"  : "#888";
  const attrLink = theme === "light" ? "#222"  : "#aaa";

  return /* html */ `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<style>
  html, body, #map { margin:0; padding:0; height:100%; width:100%; background:${bg}; }
  .leaflet-container { background:${bg}; }
  .leaflet-control-attribution { font-size:9px; background:${attrBg}; color:${attrText}; }
  .leaflet-control-attribution a { color:${attrLink}; }
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

L.tileLayer('${tileUrl}', {
  maxZoom: 20, attribution: '© OSM · CARTO', subdomains: 'abcd',
}).addTo(map);

function send(payload) {
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }
}

let historyLayer = L.layerGroup().addTo(map);
let segLayer = L.layerGroup().addTo(map);
let pathLine = null;

function setHistoryTracks(list) {
  historyLayer.clearLayers();
  if (!list || list.length === 0) return;
  list.forEach(function (t) {
    if (!t.coords || t.coords.length < 2) return;
    L.polyline(t.coords, {
      color: '#00ff88',
      weight: 3,
      opacity: 0.30,
      lineCap: 'round',
    }).addTo(historyLayer);
  });
}
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

window.runfit = { setSegments, setPath, setUser, setHistoryTracks, follow: true };
</script>
</body></html>`;
}
