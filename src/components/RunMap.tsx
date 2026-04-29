import { useEffect, useMemo, useRef } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

interface LatLng { lat: number; lng: number }

interface Props {
  /** Stream of points already collected by the tracker. */
  points: LatLng[];
  /** Latest live position (used for the pulse marker). */
  current?: LatLng | null;
  /** Activity color — line and marker tint. */
  color?: string;
}

/**
 * Lightweight map for the active-run screen: starting point, route
 * polyline, current pulsing marker. Live updates via injectJavaScript.
 */
export function RunMap({ points, current, color = "#00ff88" }: Props) {
  const ref = useRef<WebView | null>(null);
  const start = points[0] ?? current ?? null;

  // Build initial HTML once — runtime updates go through injectJavaScript.
  const html = useMemo(() => buildHtml(start, color), [start?.lat, start?.lng, color]);

  // Push every new tail point to map (incremental, avoids full re-render).
  useEffect(() => {
    if (!ref.current || points.length === 0) return;
    const recent = points.slice(-30);
    const arr = JSON.stringify(recent.map((p) => [p.lat, p.lng]));
    ref.current.injectJavaScript(`window.runfit && window.runfit.appendPath(${arr}); true;`);
  }, [points.length]);

  useEffect(() => {
    if (!ref.current || !current) return;
    ref.current.injectJavaScript(
      `window.runfit && window.runfit.setUser(${current.lat}, ${current.lng}); true;`,
    );
  }, [current?.lat, current?.lng]);

  return (
    <View style={{ flex: 1, backgroundColor: "#0a0a0a" }}>
      <WebView
        ref={ref}
        originWhitelist={["*"]}
        source={{ html }}
        javaScriptEnabled
        domStorageEnabled
        scrollEnabled={false}
        style={{ flex: 1, backgroundColor: "#0a0a0a" }}
        androidLayerType="hardware"
      />
    </View>
  );
}

function buildHtml(start: LatLng | null, color: string): string {
  const center = start ?? { lat: 55.7558, lng: 37.6173 };
  const initial = JSON.stringify([center.lat, center.lng]);

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
    .start-dot {
      width: 14px; height: 14px; border-radius: 50%;
      background: #fff; border: 3px solid ${color};
      box-shadow: 0 0 8px rgba(0,0,0,0.6);
    }
    .user-dot {
      width: 18px; height: 18px; border-radius: 50%;
      background: ${color};
      border: 2px solid #fff;
      box-shadow: 0 0 0 8px ${color}40, 0 0 20px ${color}99;
    }
    .user-pulse {
      width: 60px; height: 60px; border-radius: 50%;
      background: radial-gradient(circle, ${color}55 0%, ${color}00 70%);
      animation: pulse 1.8s ease-out infinite;
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
    var COLOR = ${JSON.stringify(color)};
    var map = L.map('map', { zoomControl: false, attributionControl: true, dragging: true, tap: true })
                .setView(${initial}, 17);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 20, attribution: '© OSM · CARTO', subdomains: 'abcd',
    }).addTo(map);

    var startMarker = null;
    var path = [];
    var poly = L.polyline([], { color: COLOR, weight: 5, lineCap: 'round', lineJoin: 'round' }).addTo(map);
    var userMarker = null;
    var userPulse = null;

    function ensureStart(latlng) {
      if (startMarker) return;
      var icon = L.divIcon({ className: '', html: '<div class="start-dot"></div>',
                             iconSize: [14,14], iconAnchor: [7,7] });
      startMarker = L.marker(latlng, { icon: icon, interactive: false }).addTo(map);
    }

    function appendPath(arr) {
      if (!arr || arr.length === 0) return;
      // Avoid pushing dup of last
      var last = path[path.length - 1];
      for (var i = 0; i < arr.length; i++) {
        var p = arr[i];
        if (!last || last[0] !== p[0] || last[1] !== p[1]) {
          path.push(p);
          last = p;
        }
      }
      if (path.length > 0 && !startMarker) ensureStart(path[0]);
      poly.setLatLngs(path);
    }

    function setUser(lat, lng) {
      var ll = [lat, lng];
      if (!startMarker) ensureStart(ll);
      if (!userMarker) {
        var dot = L.divIcon({ className: '', html: '<div class="user-dot"></div>',
                              iconSize: [18,18], iconAnchor: [9,9] });
        var pulse = L.divIcon({ className: '', html: '<div class="user-pulse"></div>',
                                iconSize: [60,60], iconAnchor: [30,30] });
        userPulse  = L.marker(ll, { icon: pulse, interactive: false, keyboard: false, zIndexOffset: 999 }).addTo(map);
        userMarker = L.marker(ll, { icon: dot,   interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(map);
      } else {
        userMarker.setLatLng(ll);
        userPulse.setLatLng(ll);
      }
      map.panTo(ll, { animate: true, duration: 0.6 });
    }

    window.runfit = { appendPath: appendPath, setUser: setUser };
  </script>
</body>
</html>`;
}
