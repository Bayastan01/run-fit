import { useEffect } from "react";
import { View, Text, Pressable, ScrollView, Switch } from "react-native";
import { router } from "expo-router";
import { ChevronLeft, ShieldOff, MapPin, Trash2, Plus } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { Button } from "@/components/Button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { usePrivacy } from "@/stores/privacy";
import { useUserLocation } from "@/features/location/useUserLocation";

export default function Settings() {
  const privacy = usePrivacy();
  const { coord } = useUserLocation();

  useEffect(() => {
    privacy.hydrate();
  }, []);

  function addCurrentAsZone() {
    if (!coord) return;
    privacy.addZone({ centerLat: coord.lat, centerLng: coord.lng, radiusM: 200 });
  }

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 80 }}>
      <View className="px-5 pt-14">
        <View className="flex-row items-center gap-3 mb-6">
          <Pressable onPress={() => router.back()}>
            <ChevronLeft size={24} color="#fff" />
          </Pressable>
          <Text className="text-white text-2xl font-bold">Настройки</Text>
        </View>

        {/* Theme */}
        <GlassCard padding={16}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-white font-semibold">Тема карты</Text>
              <Text className="text-subtle text-xs">Дневная — яркие тайлы; Ночная — тёмные</Text>
            </View>
            <ThemeToggle compact={false} />
          </View>
        </GlassCard>

        {/* Ghost mode */}
        <GlassCard padding={16}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <ShieldOff size={20} color="#8b5cf6" />
              <View className="flex-1">
                <Text className="text-white font-semibold">Ghost-режим</Text>
                <Text className="text-subtle text-xs">Соседи не видят твою активность</Text>
              </View>
            </View>
            <Switch
              value={privacy.ghostMode}
              onValueChange={privacy.setGhostMode}
              trackColor={{ true: "#00ff88", false: "#27272a" }}
              thumbColor="#fff"
            />
          </View>
        </GlassCard>

        <Text className="text-subtle text-xs uppercase tracking-widest mt-6 mb-3">Privacy zone</Text>
        <Text className="text-subtle text-xs mb-3">
          GPS-точки внутри privacy zone не записываются. Используй вокруг дома, школы и т.д.
        </Text>

        <View className="gap-2">
          {privacy.zones.length === 0 && (
            <Text className="text-subtle text-sm py-4 text-center">Нет приватных зон</Text>
          )}
          {privacy.zones.map((z, i) => (
            <GlassCard key={i} padding={12}>
              <View className="flex-row items-center gap-3">
                <MapPin size={18} color="#00ff88" />
                <View className="flex-1">
                  <Text className="text-white font-semibold">
                    {z.centerLat.toFixed(4)}, {z.centerLng.toFixed(4)}
                  </Text>
                  <Text className="text-subtle text-xs">Радиус {z.radiusM} м</Text>
                </View>
                <Pressable onPress={() => privacy.removeZone(i)}>
                  <Trash2 size={18} color="#ef4444" />
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </View>

        <View className="mt-3">
          <Button
            label={coord ? "+ Добавить текущее место как Privacy zone" : "Жду GPS…"}
            variant="ghost"
            onPress={addCurrentAsZone}
            disabled={!coord}
          />
        </View>
      </View>
    </ScrollView>
  );
}
