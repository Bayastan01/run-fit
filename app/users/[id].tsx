import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { ChevronLeft, MapPin, Target, Award, Flame } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { api, unwrap } from "@/api/client";

interface UserProfileData {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    level: number;
    xp: number;
    factionId: string | null;
    createdAt: string;
    faction: { id: string; name: string; color: string } | null;
  };
  stats: {
    runsCount: number;
    totalDistanceM: number;
    bestChain: number;
    ownedSegments: number;
    achievements: number;
  };
  rivalry: number;
  isMe: boolean;
}

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [data, setData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    unwrap<UserProfileData>(api.get(`api/users/${id}`))
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

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
        <Text className="text-white text-2xl font-bold">Профиль</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#00ff88" style={{ marginTop: 60 }} />
      ) : !data ? (
        <View className="flex-1 items-center justify-center">
          <Text className="text-subtle">Пользователь не найден</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, gap: 12 }}>
          <GlassCard padding={20} borderColor={data.user.faction?.color ?? "rgba(255,255,255,0.10)"}>
            <View className="flex-row items-center gap-4">
              <View
                style={{
                  width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center",
                  backgroundColor: `${data.user.faction?.color ?? "#3f3f46"}30`,
                  borderWidth: 2,
                  borderColor: data.user.faction?.color ?? "#3f3f46",
                }}
              >
                <Text className="text-white font-bold text-2xl">
                  {data.user.displayName.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-xl font-bold">{data.user.displayName}</Text>
                {data.user.faction && (
                  <Text style={{ color: data.user.faction.color, fontSize: 13 }}>
                    {data.user.faction.name} · Уровень {data.user.level}
                  </Text>
                )}
              </View>
            </View>

            {data.rivalry > 0 && !data.isMe && (
              <View
                className="mt-4 rounded-2xl p-3 flex-row items-center gap-2"
                style={{ backgroundColor: "rgba(239,68,68,0.10)", borderWidth: 1, borderColor: "rgba(239,68,68,0.30)" }}
              >
                <Flame size={16} color="#ef4444" />
                <Text className="text-white text-sm flex-1">Старая вражда</Text>
                <Text style={{ color: "#ef4444", fontWeight: "700" }}>×{data.rivalry.toFixed(1)}</Text>
              </View>
            )}
          </GlassCard>

          <View className="flex-row flex-wrap gap-3">
            <Stat icon={<MapPin size={14} color="#06b6d4" />} label="Километров" value={`${(data.stats.totalDistanceM / 1000).toFixed(1)}`} color="#06b6d4" />
            <Stat icon={<Target size={14} color="#8b5cf6" />} label="Улиц" value={String(data.stats.ownedSegments)} color="#8b5cf6" />
            <Stat icon={<Award size={14} color="#ffd700" />} label="Достижений" value={String(data.stats.achievements)} color="#ffd700" />
            <Stat icon={<Flame size={14} color="#ef4444" />} label="Лучшая цепь" value={`${data.stats.bestChain}×`} color="#ef4444" />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
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
