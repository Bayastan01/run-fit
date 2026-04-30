import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { router, Stack } from "expo-router";
import { ChevronLeft, Users } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { SkeletonRow } from "@/components/Skeleton";
import { fetchNeighbours, type Neighbour } from "@/api/neighbours";

export default function NeighboursScreen() {
  const [items, setItems] = useState<Neighbour[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [radius, setRadius] = useState<1 | 2 | 3>(2);

  const load = useCallback(async (r: 1 | 2 | 3) => {
    try {
      const list = await fetchNeighbours(r);
      setItems(list);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(radius); }, [load, radius]);

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
        <Text className="text-white text-2xl font-bold">Соседи</Text>
      </View>

      <View className="flex-row gap-2 px-4 mb-3">
        {([1, 2, 3] as const).map((r) => (
          <Pressable
            key={r}
            onPress={() => setRadius(r)}
            className="px-4 py-2 rounded-full"
            style={{
              backgroundColor: radius === r ? "rgba(0,255,136,0.20)" : "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: radius === r ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.10)",
            }}
          >
            <Text style={{ color: radius === r ? "#00ff88" : "#a1a1aa", fontWeight: "600" }}>
              {r === 1 ? "Близко" : r === 2 ? "Район" : "Город"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(radius); }} tintColor="#00ff88" />}
      >
        {loading ? (
          <SkeletonRow count={5} height={68} />
        ) : items.length === 0 ? (
          <GlassCard padding={20}>
            <View className="items-center gap-2">
              <Users size={28} color="#a1a1aa" />
              <Text className="text-subtle text-center">
                Пока нет соседей в этом радиусе. Беги — район определится автоматически.
              </Text>
            </View>
          </GlassCard>
        ) : (
          items.map((n) => (
            <Pressable key={n.id} onPress={() => router.push(`/users/${n.id}`)}>
              <GlassCard padding={14}>
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 44, height: 44, borderRadius: 22,
                      backgroundColor: "rgba(99,102,241,0.18)",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Text className="text-white font-bold">{n.displayName.slice(0, 1).toUpperCase()}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{n.displayName}</Text>
                    <Text className="text-subtle text-xs">Уровень {n.level} · {n.cell.slice(0, 7)}…</Text>
                  </View>
                  {n.factionId && (
                    <View
                      style={{
                        paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
                        backgroundColor: "rgba(255,255,255,0.06)",
                      }}
                    >
                      <Text className="text-subtle text-xs">{n.factionId}</Text>
                    </View>
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
