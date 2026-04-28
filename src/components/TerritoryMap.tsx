import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import {
  FALLBACK_CENTER,
  type LatLng,
  type Territory,
} from "@/data/mockTerritories";

interface TerritoryMapProps {
  territories: Territory[];
  path: LatLng[];
  center: LatLng;
  /** Live user position. When changes, the map keeps centred on it and updates the marker. */
  userLocation?: LatLng | null;
  onSelect: (t: Territory) => void;
}

/**
 * Real OpenStreetMap tiles via Leaflet inside a WebView.
 * Works in Expo Go (no native MapLibre / Google-Maps required).
 *
 * Initial state is rendered server-side as HTML; runtime updates
 * (user position, follow camera) go through `injectJavaScript`.
 */
export function TerritoryMap({
  territories, path, center, userLocation, onSelect,
}: TerritoryMapProps) {
  const webRef = useRef<WebView | null>(null);

  const html = useMemo(
    () => buildHtml(territories, path, center),
    [territories, path, center],
  );

  function onMessage(e: WebViewMessageEvent) {
    try {
      const data = JSON.parse(e.nativeEvent.data) as { type: string; id?: number };
      if (data.type === "territoryTap" && typeof data.id === "number") {
        const t = territories.find((tt) => tt.id === data.id);
        if (t) onSelect(t);
      }
    } catch {}
  }

  // Live user-position updates → push to webview
  useEffect(() => {
    if (!userLocation || !webRef.current) return;
    const js = `if (window.runfit && window.runfit.setUser) {
      window.runfit.setUser(${userLocation.latitude}, ${userLocation.longitude});
    } true;`;
    webRef.current.injectJavaScript(js);
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

function buildHtml(territories: Territory[], path: LatLng[], center: LatLng): string {
  const polygons = territories.map((t) => {
    const isHV = t.status === "high-value" && t.owner === "user";
    const stroke = isHV ? "#ffd700" : t.color;
    const fillOpacity = t.owner === "user" ? 0.35 : 0.22;
    const dashArray = t.status === "contested" ? "8,6" : null;
    return {
      id: t.id,
      coords: t.polygon.map((p) => [p.latitude, p.longitude]),
      stroke, fill: stroke, fillOpacity, dashArray,
      label: buildLabel(t),
      labelLat: t.center.latitude,
      labelLng: t.center.longitude,
      labelClass: isHV ? "label gold" : "label",
      labelStyle: `color:${stroke}; border-color:${stroke}66;`,
    };
  });

  const c = center ?? FALLBACK_CENTER;
  const initial = JSON.stringify([c.latitude, c.longitude]);
  const polygonsJson = JSON.stringify(polygons);
  const pathJson = JSON.stringify(path.map((p) => [p.latitude, p.longitude]));

  return /* html */ `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin:0; padding:0; height:100%; width:100%; background:#0a0a0a; }
    .leaflet-container { background:#0a0a0a; }
    .leaflet-control-attribution { font-size:9px; background:rgba(10,10,10,0.6); color:#888; }
    .leaflet-control-attribution a { color:#aaa; }
    .leaflet-control-zoom { display:none; }

    .label {
      background: rgba(10,10,10,0.92);
      border: 1px solid rgba(255,255,255,0.10);
      color: #fff;
      padding: 6px 10px;
      border-radius: 14px;
      font-family: -apple-system, "Segoe UI", system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 4px 14px rgba(0,0,0,0.6);
      position: relative;
    }
    .label.gold { background: rgba(255,215,0,0.18); border-color: #ffd700; color: #ffd700; }
    .label .small { color:#a1a1aa; font-size:10px; font-weight:500; margin-left:4px; }
    .label .danger { color:#ef4444; font-weight:700; margin-left:4px; }
    .label .crown { position:absolute; top:-10px; right:-10px; font-size:14px; }

    .user-dot {
      width: 18px; height: 18px; border-radius: 50%;
      background: #00ff88;
      border: 2px solid #fff;
      box-shadow: 0 0 0 8px rgba(0,255,136,0.25), 0 0 20px rgba(0,255,136,0.6);
    }
    .user-pulse {
      width: 60px; height: 60px; border-radius: 50%;
      background: radial-gradient(circle, rgba(0,255,136,0.35) 0%, rgba(0,255,136,0) 70%);
      animation: pulse 1.8s ease-out infinite;
      transform-origin: center;
    }
    @keyframes pulse {
      0%   { transform: scale(0.6); opacity: 1; }
      100% { transform: scale(1.6); opacity: 0; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const map = L.map('map', {
      zoomControl: false,
      attributionControl: true,
      dragging: true,
      tap: true,
    }).setView(${initial}, 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20,
      attribution: '© OSM · CARTO',
      subdomains: 'abcd',
    }).addTo(map);

    function send(payload) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(payload));
      }
    }

    const polygons = ${polygonsJson};
    polygons.forEach((p) => {
      const opts = {
        color: p.stroke, weight: 2.5,
        fillColor: p.fill, fillOpacity: p.fillOpacity,
      };
      if (p.dashArray) opts.dashArray = p.dashArray;
      const poly = L.polygon(p.coords, opts).addTo(map);
      poly.on('click', () => send({ type: 'territoryTap', id: p.id }));

      const label = L.divIcon({
        html: '<div class="' + p.labelClass + '" style="' + p.labelStyle + '">' + p.label + '</div>',
        className: '', iconSize: null, iconAnchor: [0, 0],
      });
      const marker = L.marker([p.labelLat, p.labelLng], { icon: label, interactive: true }).addTo(map);
      marker.on('click', () => send({ type: 'territoryTap', id: p.id }));
    });

    L.polyline(${pathJson}, { color: '#00ff88', weight: 4, lineCap: 'round' }).addTo(map);
    L.circleMarker(${pathJson}[0], { radius: 6, color: '#00ff88', fillColor: '#00ff88', fillOpacity: 1 }).addTo(map);

    // Live user marker
    let userMarker = null;
    let userPulse  = null;
    function setUser(lat, lng) {
      const ll = [lat, lng];
      if (!userMarker) {
        const dot = L.divIcon({ className: '', html: '<div class="user-dot"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
        const pulse = L.divIcon({ className: '', html: '<div class="user-pulse"></div>', iconSize: [60, 60], iconAnchor: [30, 30] });
        userPulse  = L.marker(ll, { icon: pulse, interactive: false, keyboard: false, zIndexOffset: 999 }).addTo(map);
        userMarker = L.marker(ll, { icon: dot,   interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(map);
        map.setView(ll, 16, { animate: true });
      } else {
        userMarker.setLatLng(ll);
        userPulse.setLatLng(ll);
        if (window.runfit.follow) map.panTo(ll, { animate: true });
      }
    }
    window.runfit = { setUser, follow: true };
  </script>
</body>
</html>
`;
}

function buildLabel(t: Territory): string {
  const head = t.pendingAmount
    ? `$${t.pendingAmount.toFixed(2)}<span class="small">готово</span>`
    : `+$${t.earnings.toFixed(2)}<span class="small">/24ч</span>`;
  const sub = `<div style="color:#71717a;font-size:10px;font-weight:500;margin-top:2px;">${t.timeRemaining}${t.attacks ? ` <span class="danger">⚔️ ${t.attacks}</span>` : ""}</div>`;
  const crown = t.isKingZone ? `<span class="crown">👑</span>` : "";
  return `${crown}${head}${sub}`;
}
