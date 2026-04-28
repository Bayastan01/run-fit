import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Swords, Users, ChevronRight, Trophy } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { listBattles, type Battle } from "@/api/battles";
import { fetchNeighbours, type Neighbour } from "@/api/neighbours";
import { useAuth } from "@/stores/auth";

export default function EventsTab() {
  const user = useAuth((s) => s.user);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [neighbours, setNeighbours] = useState<Neighbour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [b, n] = await Promise.all([listBattles().catch(() => []), fetchNeighbours(2).catch(() => [])]);
      setBattles(b);
      setNeighbours(n);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeBattles = battles.filter((b) => b.status === "ACTIVE" || b.status === "SCHEDULED");

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#00ff88" />}
    >
      <View className="px-5 pt-14">
        <Text className="text-white text-3xl font-bold mb-6">Лента</Text>

        <Pressable onPress={() => router.push("/battles")} className="mb-3">
          <GlassCard padding={16} borderColor="rgba(239,68,68,0.30)">
            <View className="flex-row items-center gap-3">
              <View
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: "rgba(239,68,68,0.18)",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Swords size={22} color="#ef4444" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">Активные битвы</Text>
                <Text className="text-subtle text-xs">{activeBattles.length} в процессе</Text>
              </View>
              <ChevronRight size={20} color="#71717a" />
            </View>
          </GlassCard>
        </Pressable>

        <Pressable onPress={() => router.push("/neighbours")} className="mb-5">
          <GlassCard padding={16} borderColor="rgba(99,102,241,0.30)">
            <View className="flex-row items-center gap-3">
              <View
                style={{
                  width: 44, height: 44, borderRadius: 22,
                  backgroundColor: "rgba(99,102,241,0.18)",
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Users size={22} color="#6366f1" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-semibold">Соседи</Text>
                <Text className="text-subtle text-xs">{neighbours.length} в твоём районе</Text>
              </View>
              <ChevronRight size={20} color="#71717a" />
            </View>
          </GlassCard>
        </Pressable>

        {loading ? (
          <ActivityIndicator color="#00ff88" />
        ) : activeBattles.length > 0 ? (
          <>
            <Text className="text-subtle text-xs uppercase tracking-widest mb-3">Битвы сейчас</Text>
            <View className="gap-2">
              {activeBattles.slice(0, 5).map((b) => {
                const isAttacker = b.attackerUserId === user?.id;
                return (
                  <GlassCard key={b.id} padding={14}>
                    <View className="flex-row items-center gap-3">
                      <Swords size={18} color={isAttacker ? "#ef4444" : "#06b6d4"} />
                      <View className="flex-1">
                        <Text className="text-white text-sm font-semibold">
                          {isAttacker ? "Ты атакуешь" : "Ты защищаешь"}
                        </Text>
                        <Text className="text-subtle text-xs">
                          Ты: {(((isAttacker ? b.attackerDistanceM : b.defenderDistanceM) / 1000)).toFixed(2)} км
                          · Соперник: {(((isAttacker ? b.defenderDistanceM : b.attackerDistanceM) / 1000)).toFixed(2)} км
                        </Text>
                      </View>
                    </View>
                  </GlassCard>
                );
              })}
            </View>
          </>
        ) : (
          <GlassCard padding={20}>
            <View className="items-center gap-3">
              <Trophy size={28} color="#a1a1aa" />
              <Text className="text-subtle text-center">
                Пока ничего не происходит. Беги — захватывай улицы и провоцируй битвы.
              </Text>
            </View>
          </GlassCard>
        )}
      </View>
    </ScrollView>
  );
}
