import { useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import { Button } from "@/components/Button";

export default function Permissions() {
  const [busy, setBusy] = useState(false);

  async function request() {
    setBusy(true);
    try {
      const fg = await Location.requestForegroundPermissionsAsync();
      if (fg.status === "granted") {
        await Location.requestBackgroundPermissionsAsync().catch(() => null);
      }
      // expo-notifications недоступен в Expo Go (SDK 53+);
      // используем dynamic import чтобы не падать при загрузке модуля.
      try {
        const N = await import("expo-notifications");
        await N.requestPermissionsAsync().catch(() => null);
      } catch {}
    } finally {
      setBusy(false);
      router.push("/(onboarding)/faction");
    }
  }

  return (
    <View className="flex-1 bg-bg px-6 pt-24 pb-12 justify-between">
      <View className="gap-4">
        <Text className="text-text text-3xl font-bold">Разрешения</Text>
        <Text className="text-subtle text-base">
          Нам нужен доступ к <Text className="text-text font-semibold">геолокации</Text> (всегда — чтобы записывать пробежку при заблокированном экране) и <Text className="text-text font-semibold">уведомлениям</Text> (чтобы ты узнавал, когда твою территорию атакуют).
        </Text>
        <Text className="text-subtle text-sm">
          Разрешения можно поменять позже в настройках iOS / Android.
        </Text>
      </View>
      <Button label={busy ? "Запрашиваю…" : "Разрешить"} loading={busy} onPress={request} />
    </View>
  );
}
