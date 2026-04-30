import { useState } from "react";
import { View, Text, Alert } from "react-native";
import { router } from "expo-router";
import * as Location from "expo-location";
import { Button } from "@/components/Button";

export default function Permissions() {
  const [busy, setBusy] = useState(false);

  async function request() {
    setBusy(true);
    try {
      const fg = await Location.requestForegroundPermissionsAsync();
      if (fg.status !== "granted") {
        Alert.alert(
          "Геолокация обязательна",
          "Без доступа к GPS пробежку нельзя записать. Открой Настройки → Run-Fit → Разрешения и включи геолокацию.",
        );
        return;
      }
      const bg = await Location.requestBackgroundPermissionsAsync().catch(() => ({ status: "denied" as const }));
      if (bg.status !== "granted") {
        Alert.alert(
          "Фоновая геолокация отключена",
          "Игра будет работать, но при заблокированном экране точки записываться не будут. Можно включить позже в настройках.",
        );
      }
      // expo-notifications недоступен в Expo Go (SDK 53+) — dynamic import.
      try {
        const N = await import("expo-notifications");
        await N.requestPermissionsAsync().catch(() => null);
      } catch {}
      router.push("/(onboarding)/faction");
    } finally {
      setBusy(false);
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
