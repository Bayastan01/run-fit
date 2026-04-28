import { View, Text, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, Clock, Trophy, Users, Zap } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";

interface Event {
  id: string;
  title: string;
  subtitle: string;
  prize: string;
  participants: number;
  endsIn: string;
  status: "live" | "upcoming" | "ended";
  gradient: [string, string];
  icon: string;
}

const EVENTS: Event[] = [
  { id: "1", title: "Король выходных",  subtitle: "Самый длинный маршрут за уикенд", prize: "$500",  participants: 1248, endsIn: "1д 14ч",  status: "live",     gradient: ["#ffd700", "#ffa500"], icon: "👑" },
  { id: "2", title: "Спринт-баттл",       subtitle: "Лучший темп на 5 км",              prize: "$200",  participants: 612,  endsIn: "6ч 12м",   status: "live",     gradient: ["#00ff88", "#06b6d4"], icon: "⚡" },
  { id: "3", title: "Захват квартала",   subtitle: "Кто соберёт больше зон",          prize: "$1,000", participants: 89,   endsIn: "стартует через 2д", status: "upcoming", gradient: ["#8b5cf6", "#6366f1"], icon: "🏆" },
  { id: "4", title: "Марафон месяца",     subtitle: "Кумулятивная дистанция",          prize: "$2,500", participants: 8421, endsIn: "стартует 1 числа",  status: "upcoming", gradient: ["#ef4444", "#dc2626"], icon: "🏃" },
];

export default function EventsTab() {
  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 100 }}>
      <View className="px-5 pt-14">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-3xl font-bold">События</Text>
          <View
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Trophy size={20} color="#a1a1aa" />
          </View>
        </View>

        {/* Featured banner */}
        <View className="mb-6 rounded-3xl overflow-hidden">
          <LinearGradient
            colors={["#ffd700", "#ffa500"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ padding: 24 }}
          >
            <Text style={{ color: "rgba(0,0,0,0.6)", fontSize: 11, letterSpacing: 2, fontWeight: "700" }}>СПЕЦСОБЫТИЕ</Text>
            <Text style={{ color: "#000", fontSize: 24, fontWeight: "700", marginTop: 6 }}>Король выходных 👑</Text>
            <Text style={{ color: "rgba(0,0,0,0.7)", fontSize: 13, marginTop: 4 }}>Самый длинный маршрут — забирает $500</Text>

            <View className="flex-row items-center gap-4 mt-5">
              <View className="flex-row items-center gap-1">
                <Users size={14} color="#000" />
                <Text style={{ color: "#000", fontSize: 13, fontWeight: "600" }}>1,248</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Clock size={14} color="#000" />
                <Text style={{ color: "#000", fontSize: 13, fontWeight: "600" }}>1д 14ч</Text>
              </View>
            </View>

            <Pressable className="mt-5">
              <View
                style={{
                  backgroundColor: "rgba(0,0,0,0.85)",
                  borderRadius: 14, paddingVertical: 12, alignItems: "center",
                }}
              >
                <Text className="text-white font-semibold">Участвовать</Text>
              </View>
            </Pressable>
          </LinearGradient>
        </View>

        {/* Filter pills */}
        <View className="flex-row gap-2 mb-4">
          <Pill label="Все"     active />
          <Pill label="LIVE" />
          <Pill label="Скоро" />
          <Pill label="Мои" />
        </View>

        {/* Event list */}
        <View className="gap-3">
          {EVENTS.map((e) => (
            <GlassCard key={e.id} padding={16}>
              <View className="flex-row items-center gap-3">
                <View style={{ width: 56, height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: `${e.gradient[0]}22`, borderWidth: 1, borderColor: `${e.gradient[0]}44` }}>
                  <Text style={{ fontSize: 28 }}>{e.icon}</Text>
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-semibold">{e.title}</Text>
                    {e.status === "live" && (
                      <View style={{ backgroundColor: "rgba(0,255,136,0.18)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                        <Text style={{ color: "#00ff88", fontSize: 10, fontWeight: "700" }}>LIVE</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-subtle text-xs">{e.subtitle}</Text>
                  <View className="flex-row items-center gap-3 mt-2">
                    <View className="flex-row items-center gap-1">
                      <Users size={11} color="#71717a" />
                      <Text className="text-subtle text-xs">{e.participants.toLocaleString("ru")}</Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <Calendar size={11} color="#71717a" />
                      <Text className="text-subtle text-xs">{e.endsIn}</Text>
                    </View>
                  </View>
                </View>

                <View className="items-end">
                  <Text style={{ color: e.gradient[0], fontSize: 16, fontWeight: "700" }}>{e.prize}</Text>
                  <Text className="text-subtle text-xs">приз</Text>
                </View>
              </View>
            </GlassCard>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function Pill({ label, active }: { label: string; active?: boolean }) {
  return (
    <View
      style={{
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
        backgroundColor: active ? "rgba(0,255,136,0.2)" : "rgba(255,255,255,0.05)",
        borderWidth: 1, borderColor: active ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.1)",
      }}
    >
      <Text style={{ color: active ? "#00ff88" : "#a1a1aa", fontSize: 13, fontWeight: "600" }}>{label}</Text>
    </View>
  );
}
