import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View } from "react-native";
import { WebView } from "react-native-webview";

interface LatLng { lat: number; lng: number }

interface Props {
  /** Stream of points already collected by the tracker. */
  points: LatLng[];
  /** Latest live position — passed in from the screen even before the
   *  tracker has accumulated points (e.g. on first GPS lock). */
  current?: LatLng | null;
  /** Activity color — line and marker tint. */
  color?: string;
}

/**
 * Lightweight map for the active-run screen: starting point, route
 * polyline, current pulsing marker. Live updates via injectJavaScript.
 *
 * We queue every JS command until WebView fires onLoadEnd, then flush.
 * Otherwise the very first setUser/appendPath gets dropped on cold start.
 */
export function RunMap({ points, current, color = "#00ff88" }: Props) {
  const ref = useRef<WebView | null>(null);
  const [ready, setReady] = useState(false);
  const queue = useRef<string[]>([]);
  const lastSentLen = useRef(0);

  const send = useCallback((js: string): void => {
    if (ready && ref.current) {
      ref.current.injectJavaScript(js + " true;");
    } else {
      queue.current.push(js);
    }
  }, [ready]);

  // Initial HTML built once. Center is just a placeholder — first setUser()
  // does setView() with the real position.
  const html = useMemo(
    () => buildHtml({ lat: 55.7558, lng: 37.6173 }, color),
    [color],
  );

  // Flush queued JS once the page is loaded.
  function onLoadEnd(): void {
    setReady(true);
    if (ref.current) {
      const drained = queue.current.splice(0, queue.current.length);
      if (drained.length > 0) {
        ref.current.injectJavaScript(drained.join("\n") + " true;");
      }
    }
  }

  // Push every new tail point to map.
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === lastSentLen.current) return;
    const tail = points.slice(lastSentLen.current);
    lastSentLen.current = points.length;
    const arr = JSON.stringify(tail.map((p) => [p.lat, p.lng]));
    send(`window.runfit && window.runfit.appendPath(${arr});`);
  }, [points.length, send]);

  // Push live user position.
  useEffect(() => {
    if (!current) return;
    send(`window.runfit && window.runfit.setUser(${current.lat}, ${current.lng});`);
  }, [current?.lat, current?.lng, send]);

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
        onLoadEnd={onLoadEnd}
      />
    </View>
  );
}

function buildHtml(center: LatLng, color: string): string {
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
    var firstFix = true;

    function ensureStart(latlng) {
      if (startMarker) return;
      var icon = L.divIcon({ className: '', html: '<div class="start-dot"></div>',
                             iconSize: [14,14], iconAnchor: [7,7] });
      startMarker = L.marker(latlng, { icon: icon, interactive: false }).addTo(map);
    }

    function appendPath(arr) {
      if (!arr || arr.length === 0) return;
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
      // First fix → snap. Subsequent → pan smoothly.
      if (firstFix) {
        map.setView(ll, 17, { animate: false });
        firstFix = false;
      } else {
        map.panTo(ll, { animate: true, duration: 0.6 });
      }
    }

    window.runfit = { appendPath: appendPath, setUser: setUser };
  </script>
</body>
</html>`;
}
