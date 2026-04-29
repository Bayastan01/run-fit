import { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { ChevronLeft, MapPin, Clock, Zap, Target, AlertTriangle } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { RunMap } from "@/components/RunMap";
import { api, unwrap } from "@/api/client";

interface RunDetail {
  run: {
    id: string;
    startedAt: string;
    finishedAt: string | null;
    distanceM: number;
    weightedDistanceM: number;
    durationS: number;
    avgPaceS: number | null;
    matchRatio: number | null;
    bestChain: number;
    status: "ACTIVE" | "FINISHED" | "INVALID";
    suspectScore: number;
    invalidReason: string | null;
  };
  pointCount: number;
  capturedSegments: number;
  track: { coordinates: [number, number][] } | null;
}

export default function RunDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<RunDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    unwrap<RunDetail>(api.get(`api/runs/${id}`))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  // Track is GeoJSON LineString → coordinates are [lng, lat]; flip for RunMap.
  const trackPoints = useMemo(() => {
    if (!data?.track?.coordinates) return [];
    return data.track.coordinates.map(([lng, lat]) => ({ lat, lng }));
  }, [data]);

  return (
    <View className="flex-1 bg-bg">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center px-4 pt-14 pb-4 gap-3">
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={22} color="#fff" />
        </Pressable>
        <Text className="text-white text-2xl font-bold">Пробежка</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#00ff88" style={{ marginTop: 60 }} />
      ) : !data ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-subtle">Не удалось загрузить пробежку</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, gap: 12 }}>
          {trackPoints.length > 1 && (
            <View
              style={{
                height: 280, borderRadius: 18, overflow: "hidden",
                borderWidth: 1, borderColor: "rgba(0,255,136,0.30)",
              }}
            >
              <RunMap
                points={trackPoints}
                current={trackPoints[trackPoints.length - 1] ?? null}
                color="#00ff88"
              />
            </View>
          )}

          <GlassCard padding={20}>
            <Text className="text-subtle text-xs uppercase tracking-widest mb-2">
              {new Date(data.run.startedAt).toLocaleString("ru-RU")}
            </Text>
            <View className="flex-row gap-6 flex-wrap">
              <BigStat icon={<MapPin size={16} color="#06b6d4" />} label="Дистанция" value={`${(data.run.distanceM / 1000).toFixed(2)} км`} />
              <BigStat icon={<Clock size={16} color="#a1a1aa" />} label="Время" value={formatDuration(data.run.durationS)} />
              {data.run.avgPaceS != null && (
                <BigStat icon={<Zap size={16} color="#00ff88" />} label="Темп" value={formatPace(data.run.avgPaceS)} />
              )}
              <BigStat icon={<Target size={16} color="#8b5cf6" />} label="Захвачено" value={String(data.capturedSegments)} />
            </View>
          </GlassCard>

          <GlassCard padding={16}>
            <Text className="text-subtle text-xs uppercase tracking-widest mb-3">Мультипликатор</Text>
            <View className="flex-row justify-between">
              <Field label="Лучшая цепь" value={`${data.run.bestChain}×`} color="#f59e0b" />
              <Field label="Взвешенная дистанция" value={`${(data.run.weightedDistanceM / 1000).toFixed(2)} км`} color="#00ff88" />
            </View>
          </GlassCard>

          {data.run.matchRatio !== null && (
            <GlassCard padding={16}>
              <Text className="text-subtle text-xs uppercase tracking-widest mb-3">Точность маршрута</Text>
              <View style={{ height: 8, backgroundColor: "#27272a", borderRadius: 4, overflow: "hidden" }}>
                <View
                  style={{
                    height: "100%",
                    width: `${Math.round(data.run.matchRatio * 100)}%`,
                    backgroundColor: data.run.matchRatio >= 0.6 ? "#00ff88" : "#ef4444",
                  }}
                />
              </View>
              <Text className="text-subtle text-xs mt-2">
                {Math.round(data.run.matchRatio * 100)}% точек попали на улицы
              </Text>
            </GlassCard>
          )}

          {data.run.status === "INVALID" && (
            <View
              className="rounded-2xl p-4 flex-row items-start gap-3"
              style={{ backgroundColor: "rgba(239,68,68,0.10)", borderWidth: 1, borderColor: "rgba(239,68,68,0.30)" }}
            >
              <AlertTriangle size={18} color="#ef4444" />
              <View className="flex-1">
                <Text style={{ color: "#ef4444", fontWeight: "700" }}>Пробежка не засчитана</Text>
                <Text className="text-subtle text-xs mt-1">Причина: {data.run.invalidReason ?? "—"}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function BigStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View>
      <View className="flex-row items-center gap-2 mb-1">{icon}<Text className="text-subtle text-xs">{label}</Text></View>
      <Text className="text-white text-2xl font-bold">{value}</Text>
    </View>
  );
}

function Field({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View>
      <Text className="text-subtle text-xs">{label}</Text>
      <Text style={{ color, fontSize: 18, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}

function formatDuration(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  return h > 0 ? `${h}ч ${m}м` : `${m}:${String(ss).padStart(2, "0")}`;
}

function formatPace(s: number): string {
  const m = Math.floor(s / 60);
  const ss = Math.round(s % 60);
  return `${m}:${String(ss).padStart(2, "0")}/км`;
}
