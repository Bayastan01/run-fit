import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { router, Stack } from "expo-router";
import { ChevronLeft, Crown, Users, MapPin } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { EmptyState } from "@/components/EmptyState";
import { fetchFactionWars, type FactionStat } from "@/api/factionWars";
import { useAuth } from "@/stores/auth";

export default function FactionWarsScreen() {
  const me = useAuth((s) => s.user);
  const [items, setItems] = useState<FactionStat[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetchFactionWars();
      setItems(r.factions);
      setTotal(r.totalSegments);
    } finally {
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
        <View className="flex-1">
          <Text className="text-white text-2xl font-bold">Войны фракций</Text>
          <Text className="text-subtle text-xs">Всего захвачено: {total} улиц</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#00ff88" />}
      >
        {loading ? (
          <ActivityIndicator color="#00ff88" />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Crown size={32} color="#a1a1aa" />}
            title="Пока ничейная карта"
            subtitle="Захватите первые улицы, чтобы фракция появилась здесь."
          />
        ) : (
          items.map((f, i) => {
            const isMine = me?.factionId === f.id;
            return (
              <GlassCard key={f.id} padding={16} borderColor={isMine ? `${f.color}80` : `${f.color}30`}>
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 44, height: 44, borderRadius: 22,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: `${f.color}26`,
                      borderWidth: 2, borderColor: f.color,
                    }}
                  >
                    {i === 0 ? <Crown size={20} color={f.color} /> : (
                      <Text style={{ color: f.color, fontWeight: "700", fontSize: 18 }}>{i + 1}</Text>
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white font-bold text-base">{f.name}</Text>
                      {isMine && (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: `${f.color}26` }}>
                          <Text style={{ color: f.color, fontSize: 10, fontWeight: "700" }}>ТВОЯ</Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row gap-3 mt-1">
                      <View className="flex-row items-center gap-1">
                        <MapPin size={12} color="#a1a1aa" />
                        <Text className="text-subtle text-xs">{f.segmentsOwned}</Text>
                      </View>
                      <View className="flex-row items-center gap-1">
                        <Users size={12} color="#a1a1aa" />
                        <Text className="text-subtle text-xs">{f.members}</Text>
                      </View>
                      <Text className="text-subtle text-xs">{(f.totalDistanceM / 1000).toFixed(1)} км/нед</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text style={{ color: f.color, fontSize: 22, fontWeight: "700" }}>
                      {(f.sharePct * 100).toFixed(0)}%
                    </Text>
                  </View>
                </View>
                <View style={{ height: 6, backgroundColor: "#27272a", borderRadius: 3, overflow: "hidden", marginTop: 12 }}>
                  <View style={{
                    height: "100%",
                    width: `${Math.round(f.sharePct * 100)}%`,
                    backgroundColor: f.color,
                  }} />
                </View>
              </GlassCard>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
