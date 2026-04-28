import { useState } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { router } from "expo-router";
import { Button } from "@/components/Button";
import { useAuth } from "@/stores/auth";

interface FactionMeta {
  id: string;
  name: string;
  color: string;
  motto: string;
}

const FACTIONS: FactionMeta[] = [
  { id: "crimson", name: "Багровый рассвет",   color: "#E11D48", motto: "Преследуй и сжигай." },
  { id: "azure",   name: "Лазурный прилив",    color: "#2563EB", motto: "Перетекай через стены." },
  { id: "verdant", name: "Зелёный союз",       color: "#16A34A", motto: "Переживи любого врага." },
  { id: "amber",   name: "Янтарная кузница",   color: "#F59E0B", motto: "Бей и удерживай." },
];

export default function FactionPick() {
  const patchUser = useAuth((s) => s.patchUser);
  const [selected, setSelected] = useState<string | null>(null);

  function confirm() {
    if (selected) patchUser({ factionId: selected });
    router.replace("/(tabs)/map");
  }

  return (
    <View className="flex-1 bg-bg pt-20 pb-10 px-6">
      <Text className="text-text text-3xl font-bold mb-2">Выбери фракцию</Text>
      <Text className="text-subtle mb-6">Сменить позже не получится — выбирай вдумчиво.</Text>
      <ScrollView className="flex-1" contentContainerStyle={{ gap: 12 }}>
        {FACTIONS.map((f) => {
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
              <View className="flex-row items-center gap-3">
                <View style={{ backgroundColor: f.color, width: 16, height: 16, borderRadius: 8 }} />
                <Text className="text-text text-lg font-semibold">{f.name}</Text>
              </View>
              <Text className="text-subtle mt-1">{f.motto}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      <View className="mt-4">
        <Button label="Продолжить" disabled={!selected} onPress={confirm} />
      </View>
    </View>
  );
}
