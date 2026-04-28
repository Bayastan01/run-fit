import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Award, Crown, DollarSign, Flame, Settings, Target, TrendingUp,
} from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { logout } from "@/api/auth";
import { fetchProfile, type ProfilePayload } from "@/api/profile";
import { useAuth } from "@/stores/auth";

export default function ProfileTab() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);
  const [data, setData] = useState<ProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const p = await fetchProfile();
      setData(p);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onLogout() {
    await logout().catch(() => {});
    setUser(null);
    router.replace("/");
  }

  const xpToNext = (data?.user.level ?? 1) * 250;
  const xpProgress = data ? Math.min(100, (data.user.xp % xpToNext) / xpToNext * 100) : 0;
  const totalKm = (data?.stats.totalDistanceM ?? 0) / 1000;

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#00ff88" />}
    >
      <View className="px-5 pt-14">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-3xl font-bold">Профиль</Text>
          <Pressable
            onPress={() => router.push("/settings")}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Settings size={20} color="#a1a1aa" />
          </Pressable>
        </View>

        <View className="mb-5 rounded-3xl overflow-hidden">
          <LinearGradient
            colors={[`${data?.user.faction?.color ?? "#00ff88"}30`, "rgba(6,182,212,0.18)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ padding: 24, borderWidth: 2, borderColor: data?.user.faction?.color ?? "rgba(0,255,136,0.4)", borderRadius: 24 }}
          >
            <View className="flex-row items-center justify-between mb-5">
              <LinearGradient
                colors={[data?.user.faction?.color ?? "#00ff88", "#06b6d4"]}
                style={{ width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={{ fontSize: 38 }}>⚡</Text>
              </LinearGradient>
              {data?.user.faction && (
                <View
                  className="flex-row items-center gap-2 px-3 py-2 rounded-2xl"
                  style={{ backgroundColor: `${data.user.faction.color}30`, borderWidth: 1, borderColor: data.user.faction.color }}
                >
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: data.user.faction.color }} />
                  <Text style={{ color: data.user.faction.color, fontSize: 12, fontWeight: "700" }}>{data.user.faction.name}</Text>
                </View>
              )}
            </View>

            <Text className="text-white text-2xl font-bold mb-3">
              {data?.user.displayName ?? user?.displayName ?? "—"}
            </Text>

            <View className="flex-row items-center gap-2 mb-4">
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(0,255,136,0.18)" }}>
                <Text style={{ color: "#00ff88", fontSize: 12, fontWeight: "600" }}>
                  Уровень {data?.user.level ?? user?.level ?? 1}
                </Text>
              </View>
              {(data?.stats.currentStreakDays ?? 0) > 0 && (
                <View
                  className="flex-row items-center gap-1"
                  style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(239,68,68,0.18)" }}
                >
                  <Flame size={11} color="#ef4444" />
                  <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "600" }}>{data?.stats.currentStreakDays} дн.</Text>
                </View>
              )}
            </View>

            <View style={{ height: 8, backgroundColor: "#27272a", borderRadius: 4, overflow: "hidden" }}>
              <LinearGradient
                colors={["#00ff88", "#06b6d4"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: "100%", width: `${xpProgress}%` }}
              />
            </View>
            <Text className="text-subtle text-xs mt-2 text-center">
              {data?.user.xp ?? 0} XP до следующего уровня
            </Text>
          </LinearGradient>
        </View>

        {loading && !data ? (
          <ActivityIndicator color="#00ff88" />
        ) : (
          <View className="flex-row flex-wrap gap-3 mb-5">
            <StatCard
              icon={<DollarSign size={14} color="#00ff88" />}
              color="#00ff88"
              label="Баланс монет"
              value={(data?.balances.COIN ?? 0).toFixed(2)}
            />
            <StatCard
              icon={<Target size={14} color="#6366f1" />}
              color="#6366f1"
              label="Территории"
              value={String(data?.stats.ownedSegments ?? 0)}
            />
            <StatCard
              icon={<TrendingUp size={14} color="#8b5cf6" />}
              color="#8b5cf6"
              label="Пробежек"
              value={String(data?.stats.runsCount ?? 0)}
            />
            <StatCard
              icon={<Flame size={14} color="#ef4444" />}
              color="#ef4444"
              label="Километров"
              value={totalKm.toFixed(1)}
            />
          </View>
        )}

        <GlassCard padding={20}>
          <View className="flex-row items-center gap-3 mb-4">
            <Award size={18} color="#00ff88" />
            <Text className="text-subtle text-xs tracking-widest">ЛУЧШАЯ ЦЕПЬ</Text>
          </View>
          <Text className="text-white text-4xl font-bold">{data?.stats.bestChain ?? 0}×</Text>
          <Text className="text-subtle text-xs mt-1">множитель доходов в одной пробежке</Text>
        </GlassCard>

        <View className="flex-row gap-3 mt-4">
          <Pressable
            onPress={() => router.push("/runs")}
            className="flex-1 rounded-2xl py-4 items-center"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" }}
          >
            <Text className="text-white font-semibold">История</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/achievements")}
            className="flex-1 rounded-2xl py-4 items-center"
            style={{ backgroundColor: "rgba(255,215,0,0.10)", borderWidth: 1, borderColor: "rgba(255,215,0,0.30)" }}
          >
            <Text style={{ color: "#ffd700", fontWeight: "600" }}>Достижения</Text>
          </Pressable>
        </View>

        <Pressable
          onPress={onLogout}
          className="mt-3 rounded-2xl py-4 items-center"
          style={{ backgroundColor: "rgba(239,68,68,0.10)", borderWidth: 1, borderColor: "rgba(239,68,68,0.30)" }}
        >
          <Text style={{ color: "#ef4444" }}>Выйти</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <View className="rounded-2xl p-4" style={{ width: "47%", backgroundColor: "rgba(10,10,10,0.7)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" }}>
      <View className="flex-row items-center gap-2 mb-2">
        {icon}
        <Text className="text-subtle text-xs">{label}</Text>
      </View>
      <Text style={{ color, fontSize: 22, fontWeight: "700" }}>{value}</Text>
    </View>
  );
}
