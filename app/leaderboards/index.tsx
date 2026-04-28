import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { router, Stack } from "expo-router";
import { ChevronLeft, Trophy, Crown } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { fetchLeaderboard, type LeaderboardEntry, type LeaderboardScope } from "@/api/leaderboards";
import { useAuth } from "@/stores/auth";

const SCOPES: { id: LeaderboardScope; label: string; suffix: string; format: (n: number) => string }[] = [
  { id: "distance_week", label: "Километры",  suffix: "за 7 дней", format: (n) => `${(n / 1000).toFixed(1)} км` },
  { id: "captures_week", label: "Захваты",    suffix: "за 7 дней", format: (n) => String(Math.round(n)) },
  { id: "coins_week",    label: "Монеты",     suffix: "за 7 дней", format: (n) => n.toFixed(2) },
  { id: "level",         label: "Уровень",    suffix: "общий",     format: (n) => `${Math.round(n)} XP` },
];

const RANK_BG = ["#ffd700", "#c0c0c0", "#cd7f32"];

export default function LeaderboardsScreen() {
  const me = useAuth((s) => s.user);
  const [scope, setScope] = useState<LeaderboardScope>("distance_week");
  const [items, setItems] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (s: LeaderboardScope) => {
    try {
      const list = await fetchLeaderboard(s);
      setItems(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(scope); }, [load, scope]);

  const cur = SCOPES.find((s) => s.id === scope)!;

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
        <Text className="text-white text-2xl font-bold">Топы</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {SCOPES.map((s) => (
          <Pressable
            key={s.id}
            onPress={() => setScope(s.id)}
            className="px-4 py-2 rounded-full"
            style={{
              backgroundColor: scope === s.id ? "rgba(0,255,136,0.20)" : "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: scope === s.id ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.10)",
            }}
          >
            <Text style={{ color: scope === s.id ? "#00ff88" : "#a1a1aa", fontWeight: "600" }}>{s.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text className="text-subtle text-xs mt-2 px-5">{cur.suffix}</Text>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 80, gap: 8 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(scope); }} tintColor="#00ff88" />}
      >
        {loading ? (
          <ActivityIndicator color="#00ff88" />
        ) : items.length === 0 ? (
          <GlassCard padding={20}>
            <View className="items-center gap-2">
              <Trophy size={28} color="#a1a1aa" />
              <Text className="text-subtle text-center">Пока пусто. Беги — попадёшь в топ.</Text>
            </View>
          </GlassCard>
        ) : (
          items.map((e) => {
            const isMe = e.userId === me?.id;
            const rankColor = e.rank <= 3 ? RANK_BG[e.rank - 1] : "#a1a1aa";
            return (
              <Pressable
                key={e.userId}
                onPress={() => router.push(`/users/${e.userId}`)}
              >
                <GlassCard
                  padding={14}
                  borderColor={isMe ? "rgba(0,255,136,0.50)" : undefined}
                >
                  <View className="flex-row items-center gap-3">
                    <View
                      style={{
                        width: 40, height: 40, borderRadius: 20,
                        alignItems: "center", justifyContent: "center",
                        backgroundColor: e.rank <= 3 ? `${rankColor}30` : "rgba(255,255,255,0.06)",
                        borderWidth: e.rank <= 3 ? 2 : 0,
                        borderColor: rankColor,
                      }}
                    >
                      {e.rank === 1 ? <Crown size={20} color={rankColor} /> : (
                        <Text style={{ color: rankColor, fontWeight: "700", fontSize: 16 }}>{e.rank}</Text>
                      )}
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2">
                        <Text className="text-white font-semibold">{e.displayName}</Text>
                        {isMe && (
                          <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: "rgba(0,255,136,0.18)" }}>
                            <Text style={{ color: "#00ff88", fontSize: 10, fontWeight: "700" }}>ТЫ</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-subtle text-xs">Уровень {e.level}</Text>
                    </View>
                    <View className="items-end">
                      <Text style={{ color: e.factionColor ?? "#fff", fontSize: 16, fontWeight: "700" }}>
                        {cur.format(e.value)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
