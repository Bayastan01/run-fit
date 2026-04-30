import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { View, Text, Pressable, ActivityIndicator } from "react-native";
import { router, Stack } from "expo-router";
import { WebView } from "react-native-webview";
import { ChevronLeft, Flame } from "lucide-react-native";
import { useUserLocation } from "@/features/location/useUserLocation";
import { fetchHeatmap, type HeatCell } from "@/api/heatmap";
import { useTheme, tileUrlForTheme, mapBackgroundForTheme, type ThemeMode } from "@/stores/theme";

export default function HeatmapScreen() {
  const { coord } = useUserLocation();
  const center = coord ?? { lat: 42.87, lng: 74.59 }; // Bishkek
  const ref = useRef<WebView | null>(null);
  const [cells, setCells] = useState<HeatCell[]>([]);
  const [loading, setLoading] = useState(true);
  const themeMode = useTheme((s) => s.mode);

  const html = useMemo(
    () => buildHtml(center, themeMode),
    [center.lat, center.lng, themeMode],
  );

  const loadAround = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const r = await fetchHeatmap({
        minLng: lng - 0.05, minLat: lat - 0.04, maxLng: lng + 0.05, maxLat: lat + 0.04,
      });
      setCells(r.cells);
    } catch {} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (coord) loadAround(coord.lat, coord.lng);
  }, [coord?.lat, coord?.lng, loadAround]);

  // Push cells to WebView whenever they change.
  useEffect(() => {
    if (!ref.current || cells.length === 0) return;
    const json = JSON.stringify(cells);
    ref.current.injectJavaScript(`window.runfit && window.runfit.setCells(${json}); true;`);
  }, [cells]);

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="absolute z-10 left-4 top-14 right-4 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(10,10,10,0.85)", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={22} color="#fff" />
        </Pressable>
        <View
          className="flex-1 flex-row items-center gap-2 px-4 py-2 rounded-2xl"
          style={{ backgroundColor: "rgba(10,10,10,0.85)" }}
        >
          <Flame size={16} color="#ef4444" />
          <Text className="text-white text-sm font-semibold">Тепловая карта</Text>
          <Text className="text-subtle text-xs ml-auto">
            {loading ? "загрузка…" : `${cells.length} точек`}
          </Text>
        </View>
      </View>

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

      {loading && cells.length === 0 && (
        <View className="absolute inset-0 items-center justify-center" pointerEvents="none">
          <ActivityIndicator color="#ef4444" size="large" />
        </View>
      )}
    </View>
  );
}

function buildHtml(center: { lat: number; lng: number }, theme: ThemeMode): string {
  const initial = JSON.stringify([center.lat, center.lng]);
  const tileUrl = tileUrlForTheme(theme);
  const bg = mapBackgroundForTheme(theme);
  const attrBg   = theme === "light" ? "rgba(255,255,255,0.7)" : "rgba(10,10,10,0.6)";
  const attrText = theme === "light" ? "#444"  : "#888";
  const attrLink = theme === "light" ? "#222"  : "#aaa";
  return /* html */ `
<!DOCTYPE html>
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
</style>
</head><body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map', { zoomControl:false, dragging:true, tap:true }).setView(${initial}, 13);
L.tileLayer('${tileUrl}', {
  maxZoom:20, attribution:'© OSM · CARTO', subdomains:'abcd',
}).addTo(map);

var layer = L.layerGroup().addTo(map);
function setCells(cells) {
  layer.clearLayers();
  if (!cells || cells.length === 0) return;
  var maxCount = cells.reduce(function (m, c) { return c.count > m ? c.count : m; }, 1);
  cells.forEach(function (c) {
    var alpha = Math.max(0.25, Math.min(0.85, c.count / maxCount));
    L.circle([c.lat, c.lng], {
      radius: 60 + 40 * (c.count / maxCount),
      color: c.color || '#ef4444',
      fillColor: c.color || '#ef4444',
      fillOpacity: alpha,
      weight: 0,
    }).bindTooltip(String(c.count) + ' улиц', { className: 'heat-tip' }).addTo(layer);
  });
}
window.runfit = { setCells: setCells };
</script>
</body></html>`;
}
