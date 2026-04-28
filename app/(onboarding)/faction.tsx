import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/Button";
import { useAuth } from "@/stores/auth";
import { fetchFactions, chooseFaction, type FactionListItem } from "@/api/profile";

export default function FactionPick() {
  const patchUser = useAuth((s) => s.patchUser);
  const [factions, setFactions] = useState<FactionListItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFactions()
      .then(setFactions)
      .catch(() => setError("Не удалось загрузить фракции"))
      .finally(() => setLoading(false));
  }, []);

  async function confirm() {
    if (!selected) return;
    setSubmitting(true);
    setError(null);
    try {
      await chooseFaction(selected);
      patchUser({ factionId: selected });
      router.replace("/(tabs)/map");
    } catch (e) {
      setError("Не удалось выбрать фракцию. Попробуй ещё раз.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-bg pt-20 pb-10 px-6">
      <Text className="text-text text-3xl font-bold mb-2">Выбери фракцию</Text>
      <Text className="text-subtle mb-6">Сменить позже не получится — выбирай вдумчиво.</Text>

      {loading ? (
        <ActivityIndicator color="#00ff88" />
      ) : (
        <ScrollView className="flex-1" contentContainerStyle={{ gap: 12 }}>
          {factions.map((f) => {
            const active = selected === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setSelected(f.id)}
                style={{
                  borderRadius: 20,
                  padding: 18,
                  borderWidth: 2,
                  borderColor: active ? f.color : "rgba(255,255,255,0.10)",
                  backgroundColor: active ? `${f.color}1A` : "rgba(10,10,10,0.7)",
                  shadowColor: active ? f.color : undefined,
                  shadowOpacity: active ? 0.4 : 0,
                  shadowRadius: 18,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-3">
                    <View style={{ backgroundColor: f.color, width: 16, height: 16, borderRadius: 8 }} />
                    <Text className="text-text text-lg font-semibold">{f.name}</Text>
                  </View>
                  <Text className="text-subtle text-xs">{f.totalStreetsCached} улиц</Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {error ? <Text className="text-danger text-sm mt-3">{error}</Text> : null}

      <View className="mt-4">
        <Button label="Продолжить" disabled={!selected || submitting} loading={submitting} onPress={confirm} />
      </View>
    </View>
  );
}
