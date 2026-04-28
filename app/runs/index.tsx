import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { router, Stack } from "expo-router";
import { ChevronLeft, MapPin, Clock, Zap } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { listRuns, type RunListItem } from "@/api/runs";

export default function RunsHistoryScreen() {
  const [runs, setRuns] = useState<RunListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const load = useCallback(async (cursor?: string) => {
    try {
      const r = await listRuns(cursor);
      if (cursor) setRuns((prev) => [...prev, ...r.items]);
      else setRuns(r.items);
      setNextCursor(r.nextCursor);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
        <Text className="text-white text-2xl font-bold">История пробежек</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#00ff88" />}
        onMomentumScrollEnd={(e) => {
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          if (nextCursor && contentOffset.y + layoutMeasurement.height >= contentSize.height - 100) {
            load(nextCursor);
          }
        }}
      >
        {loading && runs.length === 0 ? (
          <ActivityIndicator color="#00ff88" />
        ) : runs.length === 0 ? (
          <GlassCard padding={24}>
            <Text className="text-subtle text-center">Ещё не было пробежек. Жми старт на карте.</Text>
          </GlassCard>
        ) : (
          runs.map((r) => (
            <Pressable
              key={r.id}
              onPress={() => router.push(`/runs/${r.id}`)}
            >
              <GlassCard padding={16}>
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-white font-semibold">{formatDate(r.startedAt)}</Text>
                  <View
                    style={{
                      paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
                      backgroundColor: r.status === "FINISHED" ? "rgba(0,255,136,0.18)" : r.status === "INVALID" ? "rgba(239,68,68,0.18)" : "rgba(245,158,11,0.18)",
                    }}
                  >
                    <Text style={{
                      color: r.status === "FINISHED" ? "#00ff88" : r.status === "INVALID" ? "#ef4444" : "#f59e0b",
                      fontSize: 10, fontWeight: "700",
                    }}>
                      {r.status === "FINISHED" ? "ЗАЧЁТ" : r.status === "INVALID" ? "БРАК" : "АКТИВНА"}
                    </Text>
                  </View>
                </View>
                <View className="flex-row gap-4">
                  <Stat icon={<MapPin size={14} color="#06b6d4" />} value={`${(r.distanceM / 1000).toFixed(2)} км`} />
                  <Stat icon={<Clock size={14} color="#a1a1aa" />} value={formatDuration(r.durationS)} />
                  {r.avgPaceS != null && (
                    <Stat icon={<Zap size={14} color="#00ff88" />} value={formatPace(r.avgPaceS)} />
                  )}
                </View>
              </GlassCard>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <View className="flex-row items-center gap-1.5">
      {icon}
      <Text className="text-white text-sm font-semibold">{value}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
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
