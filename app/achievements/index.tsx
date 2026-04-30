import { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { router, Stack } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { SkeletonRow } from "@/components/Skeleton";
import { fetchAchievements, type AchievementsResponse, type AchievementRarity } from "@/api/achievements";

const RARITY: Record<AchievementRarity, { bg: string; fg: string; ru: string }> = {
  legendary: { bg: "rgba(255,215,0,0.18)",  fg: "#ffd700", ru: "Легенда" },
  epic:      { bg: "rgba(139,92,246,0.18)", fg: "#8b5cf6", ru: "Эпик" },
  rare:      { bg: "rgba(6,182,212,0.18)",  fg: "#06b6d4", ru: "Редкий" },
  common:    { bg: "rgba(255,255,255,0.08)", fg: "#a1a1aa", ru: "Обычный" },
};

export default function AchievementsScreen() {
  const [data, setData] = useState<AchievementsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
          <Text className="text-white text-2xl font-bold">Достижения</Text>
          {data && (
            <Text className="text-subtle text-xs">{data.unlocked} из {data.total} разблокировано</Text>
          )}
        </View>
      </View>

      {loading ? (
        <SkeletonRow count={5} height={68} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}>
          <View className="flex-row flex-wrap gap-3">
            {data?.items.map((a) => {
              const r = RARITY[a.rarity];
              return (
                <View
                  key={a.code}
                  className="rounded-2xl p-4 items-center"
                  style={{
                    width: "31%",
                    backgroundColor: a.unlocked ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                    borderWidth: 1,
                    borderColor: a.unlocked ? r.fg + "55" : "rgba(255,255,255,0.06)",
                    opacity: a.unlocked ? 1 : 0.45,
                  }}
                >
                  <Text style={{ fontSize: 28 }}>{a.icon}</Text>
                  <Text className="text-white text-xs text-center mt-2 font-semibold" numberOfLines={2}>{a.title}</Text>
                  <Text className="text-subtle text-[10px] text-center mt-1" numberOfLines={2}>{a.description}</Text>
                  <View
                    style={{
                      marginTop: 8, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999,
                      backgroundColor: r.bg,
                    }}
                  >
                    <Text style={{ color: r.fg, fontSize: 10, fontWeight: "700" }}>{r.ru}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
