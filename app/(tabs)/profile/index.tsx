import { View, Text, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Award, Crown, DollarSign, Flame, Settings, Target, TrendingUp,
} from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { logout } from "@/api/auth";
import { useAuth } from "@/stores/auth";

interface StatItem { label: string; value: string; color: string }

interface Achievement { name: string; icon: string; rarity: "Common" | "Rare" | "Epic" | "Legendary"; unlocked: boolean }

const STATS: StatItem[] = [
  { label: "Всего заработано", value: "$1,247", color: "#00ff88" },
  { label: "Территории",       value: "18",     color: "#6366f1" },
  { label: "Всего пробежек",   value: "127",    color: "#8b5cf6" },
  { label: "Дней подряд",      value: "12",     color: "#ef4444" },
];

const ACHIEVEMENTS: Achievement[] = [
  { name: "Первый захват",   icon: "🎯", rarity: "Common",    unlocked: true },
  { name: "Король зоны",     icon: "👑", rarity: "Legendary", unlocked: true },
  { name: "Демон скорости",  icon: "⚡", rarity: "Epic",      unlocked: true },
  { name: "$1000 дохода",    icon: "💰", rarity: "Epic",      unlocked: true },
  { name: "Марафонец",        icon: "🏃", rarity: "Rare",      unlocked: true },
  { name: "Защитник",         icon: "🛡️", rarity: "Rare",      unlocked: false },
];

const PRO_FEATURES = [
  "2× к доходу",
  "Расширенная аналитика",
  "Приоритетная поддержка",
  "Эксклюзивные события",
];

const RARITY_COLORS: Record<Achievement["rarity"], { bg: string; fg: string; ru: string }> = {
  Legendary: { bg: "rgba(255,215,0,0.18)", fg: "#ffd700", ru: "Легенда" },
  Epic:      { bg: "rgba(139,92,246,0.18)", fg: "#8b5cf6", ru: "Эпик" },
  Rare:      { bg: "rgba(6,182,212,0.18)",  fg: "#06b6d4", ru: "Редкий" },
  Common:    { bg: "rgba(255,255,255,0.08)", fg: "#a1a1aa", ru: "Обычный" },
};

export default function ProfileTab() {
  const user = useAuth((s) => s.user);
  const setUser = useAuth((s) => s.setUser);

  async function onLogout() {
    await logout().catch(() => {});
    setUser(null);
    router.replace("/");
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-5 pt-14">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-3xl font-bold">Профиль</Text>
          <Pressable
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.08)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Settings size={20} color="#a1a1aa" />
          </Pressable>
        </View>

        {/* Hero card */}
        <View className="mb-5 rounded-3xl overflow-hidden">
          <LinearGradient
            colors={["rgba(0,255,136,0.18)", "rgba(6,182,212,0.18)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ padding: 24, borderWidth: 2, borderColor: "rgba(0,255,136,0.4)", borderRadius: 24 }}
          >
            <View className="flex-row items-center justify-between mb-5">
              <View
                style={{
                  width: 80, height: 80, borderRadius: 40,
                  alignItems: "center", justifyContent: "center",
                  shadowColor: "#00ff88", shadowOpacity: 0.4, shadowRadius: 24,
                }}
              >
                <LinearGradient
                  colors={["#00ff88", "#06b6d4"]}
                  style={{ width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center" }}
                >
                  <Text style={{ fontSize: 38 }}>⚡</Text>
                </LinearGradient>
                <View style={{ position: "absolute", top: -4, right: -4 }}>
                  <Crown size={20} color="#ffd700" />
                </View>
              </View>

              <View
                className="flex-row items-center gap-2 px-4 py-2 rounded-2xl"
                style={{ backgroundColor: "rgba(255,215,0,0.15)", borderWidth: 1, borderColor: "rgba(255,215,0,0.4)" }}
              >
                <Crown size={14} color="#ffd700" />
                <Text style={{ color: "#ffd700", fontSize: 12, fontWeight: "700", letterSpacing: 2 }}>PRO</Text>
              </View>
            </View>

            <Text className="text-white text-2xl font-bold mb-3">{user?.displayName ?? "Бегун #4701"}</Text>

            <View className="flex-row items-center gap-2 mb-4">
              <View style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(0,255,136,0.18)" }}>
                <Text style={{ color: "#00ff88", fontSize: 12, fontWeight: "600" }}>Уровень {user?.level ?? 24} · МАСТЕР</Text>
              </View>
              <View
                className="flex-row items-center gap-1"
                style={{ paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, backgroundColor: "rgba(239,68,68,0.18)" }}
              >
                <Flame size={11} color="#ef4444" />
                <Text style={{ color: "#ef4444", fontSize: 12, fontWeight: "600" }}>12 дней</Text>
              </View>
            </View>

            {/* XP bar */}
            <View style={{ height: 8, backgroundColor: "#27272a", borderRadius: 4, overflow: "hidden" }}>
              <LinearGradient
                colors={["#00ff88", "#06b6d4"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ height: "100%", width: "75%" }}
              />
            </View>
            <Text className="text-subtle text-xs mt-2 text-center">4 840 / 6 000 XP до 25 уровня</Text>
          </LinearGradient>
        </View>

        {/* Stats grid */}
        <View className="flex-row flex-wrap gap-3 mb-5">
          {STATS.map((s, i) => (
            <View key={i} className="rounded-2xl p-4" style={{ width: "47%", backgroundColor: "rgba(10,10,10,0.7)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" }}>
              <View className="flex-row items-center gap-2 mb-2">
                {i === 0 ? <DollarSign size={14} color={s.color} /> :
                 i === 1 ? <Target     size={14} color={s.color} /> :
                 i === 2 ? <TrendingUp size={14} color={s.color} /> :
                           <Flame      size={14} color={s.color} />}
                <Text className="text-subtle text-xs">{s.label}</Text>
              </View>
              <Text className="text-white text-2xl font-bold">{s.value}</Text>
            </View>
          ))}
        </View>

        {/* Pro membership */}
        <View className="mb-5 rounded-3xl overflow-hidden">
          <LinearGradient
            colors={["rgba(255,215,0,0.10)", "rgba(255,165,0,0.10)"]}
            style={{ padding: 20, borderWidth: 2, borderColor: "rgba(255,215,0,0.3)", borderRadius: 24 }}
          >
            <View className="flex-row items-center gap-3 mb-4">
              <Crown size={22} color="#ffd700" />
              <Text className="text-subtle text-xs tracking-widest">PRO ПОДПИСКА</Text>
            </View>

            {PRO_FEATURES.map((f, i) => (
              <View key={i} className="flex-row items-center gap-3 mb-2">
                <View
                  style={{
                    width: 18, height: 18, borderRadius: 9,
                    backgroundColor: "rgba(0,255,136,0.18)",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: "#00ff88" }} />
                </View>
                <Text className="text-white text-sm">{f}</Text>
              </View>
            ))}

            <Pressable className="mt-4">
              <LinearGradient
                colors={["#ffd700", "#ffa500"]}
                style={{ borderRadius: 14, paddingVertical: 12, alignItems: "center" }}
              >
                <Text style={{ color: "#000", fontWeight: "700" }}>Управлять подпиской</Text>
              </LinearGradient>
            </Pressable>
          </LinearGradient>
        </View>

        {/* Achievements */}
        <GlassCard padding={20}>
          <View className="flex-row items-center gap-3 mb-4">
            <Award size={18} color="#00ff88" />
            <Text className="text-subtle text-xs tracking-widest">ДОСТИЖЕНИЯ</Text>
          </View>

          <View className="flex-row flex-wrap gap-3">
            {ACHIEVEMENTS.map((a, i) => {
              const r = RARITY_COLORS[a.rarity];
              return (
                <View
                  key={i}
                  className="rounded-2xl p-3 items-center"
                  style={{
                    width: "30%",
                    backgroundColor: a.unlocked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
                    opacity: a.unlocked ? 1 : 0.45,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{a.icon}</Text>
                  <Text className="text-white text-xs text-center mt-2" numberOfLines={2}>{a.name}</Text>
                  <View
                    style={{
                      marginTop: 6, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
                      backgroundColor: r.bg,
                    }}
                  >
                    <Text style={{ color: r.fg, fontSize: 10, fontWeight: "700" }}>{r.ru}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </GlassCard>

        <Pressable
          onPress={onLogout}
          className="mt-6 rounded-2xl py-4 items-center"
          style={{ backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" }}
        >
          <Text className="text-white">Выйти</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
