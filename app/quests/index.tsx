import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { router, Stack } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Target, CheckCircle2, Gift } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { SkeletonRow } from "@/components/Skeleton";
import { fetchDailyQuests, claimQuest, type DailyQuest } from "@/api/quests";

export default function QuestsScreen() {
  const [items, setItems] = useState<DailyQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetchDailyQuests();
      setItems(r.items);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onClaim(code: string) {
    setClaiming(code);
    try {
      await claimQuest(code);
      await load();
    } finally {
      setClaiming(null);
    }
  }

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
        <Text className="text-white text-2xl font-bold">Дневные задания</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#00ff88" />}
      >
        {loading ? (
          <SkeletonRow count={5} height={68} />
        ) : (
          items.map((q) => {
            const claimed = !!q.claimedAt;
            const ready = q.completed && !claimed;
            return (
              <GlassCard
                key={q.code}
                padding={16}
                borderColor={ready ? "rgba(0,255,136,0.50)" : claimed ? "rgba(255,255,255,0.06)" : undefined}
              >
                <View className="flex-row items-center gap-3 mb-3">
                  <View
                    style={{
                      width: 40, height: 40, borderRadius: 20,
                      backgroundColor: claimed ? "rgba(255,255,255,0.04)" : "rgba(0,255,136,0.18)",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {claimed ? <CheckCircle2 size={20} color="#71717a" /> : <Target size={20} color="#00ff88" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold" style={{ opacity: claimed ? 0.5 : 1 }}>{q.title}</Text>
                    <Text className="text-subtle text-xs">{q.description}</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <Gift size={14} color="#ffd700" />
                    <Text style={{ color: "#ffd700", fontSize: 13, fontWeight: "700" }}>{q.rewardCoin}</Text>
                    <Text className="text-subtle text-xs">+{q.rewardXp}xp</Text>
                  </View>
                </View>

                <View style={{ height: 6, backgroundColor: "#27272a", borderRadius: 3, overflow: "hidden" }}>
                  <View style={{
                    height: "100%",
                    width: `${Math.round(Math.min(1, q.progress) * 100)}%`,
                    backgroundColor: q.completed ? "#00ff88" : "#06b6d4",
                  }} />
                </View>

                {ready && (
                  <Pressable onPress={() => onClaim(q.code)} disabled={claiming === q.code} className="mt-3">
                    <LinearGradient
                      colors={["#00ff88", "#00cc6f"]}
                      style={{ borderRadius: 12, paddingVertical: 10, alignItems: "center", opacity: claiming === q.code ? 0.6 : 1 }}
                    >
                      <Text style={{ color: "#000", fontWeight: "700" }}>Забрать награду</Text>
                    </LinearGradient>
                  </Pressable>
                )}

                {claimed && (
                  <Text className="text-subtle text-xs mt-2">✓ Награда получена</Text>
                )}
              </GlassCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
