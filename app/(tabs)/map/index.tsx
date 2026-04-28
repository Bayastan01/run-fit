import { useMemo, useState } from "react";
import { View, Text, Pressable, Modal } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle, Crown, DollarSign, Navigation, Play, Shield, X, Zap,
} from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { IconButton } from "@/components/Button";
import { TerritoryMap } from "@/components/TerritoryMap";
import {
  FALLBACK_CENTER,
  generatePath,
  generateTerritories,
  type LatLng,
  type Territory,
} from "@/data/mockTerritories";
import { useUserLocation } from "@/features/location/useUserLocation";
import { startRun } from "@/api/runs";
import { useActiveRun } from "@/stores/activeRun";

export default function MapTab() {
  const [selected, setSelected] = useState<Territory | null>(null);
  const [showBoosts, setShowBoosts] = useState(false);
  const startActive = useActiveRun((s) => s.start);

  const { coord, granted, error } = useUserLocation();

  // Center: user GPS if available, otherwise fallback (Moscow). Recompute mock
  // territories so they sit around the user's neighbourhood.
  const center: LatLng = coord
    ? { latitude: coord.lat, longitude: coord.lng }
    : FALLBACK_CENTER;

  const territories = useMemo(() => generateTerritories(center), [center.latitude, center.longitude]);
  const path        = useMemo(() => generatePath(center),        [center.latitude, center.longitude]);

  const totalEarnings = useMemo(
    () => territories.filter((t) => t.owner === "user").reduce((s, t) => s + t.earnings, 0),
    [territories],
  );
  const contestedCount = territories.filter((t) => t.owner === "user" && t.status === "contested").length;

  async function onStartRun() {
    try {
      const { runId } = await startRun();
      startActive(runId);
    } catch {
      startActive(`dev-run-${Date.now()}`);
    }
    router.push("/run-active");
  }

  const locationStatus =
    coord ? null
    : error === "permission" ? "Разреши доступ к геолокации в настройках"
    : error === "unavailable" ? "Включи GPS на устройстве"
    : "Определяем местоположение…";

  return (
    <View className="flex-1 bg-bg">
      {/* Real OSM map (Leaflet inside WebView) */}
      <TerritoryMap
        territories={territories}
        path={path}
        center={center}
        userLocation={coord ? { latitude: coord.lat, longitude: coord.lng } : null}
        onSelect={setSelected}
      />

      {/* Top bar */}
      <View className="absolute left-0 right-0 top-12 px-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.push("/(tabs)/wallet")}>
            <GlassCard borderColor="rgba(0,255,136,0.35)" padding={12}>
              <View className="flex-row items-center gap-3">
                <DollarSign size={20} color="#00ff88" />
                <View>
                  <Text className="text-subtle text-[10px] uppercase tracking-widest">Сегодня</Text>
                  <Text className="text-primary text-lg font-bold">+${totalEarnings.toFixed(2)}</Text>
                </View>
              </View>
            </GlassCard>
          </Pressable>

          <IconButton size={48} icon={<Text style={{ fontSize: 22 }}>⚡</Text>} />
        </View>

        {locationStatus && (
          <View
            className="mt-3 rounded-2xl px-4 py-3 flex-row items-center gap-3"
            style={{ backgroundColor: "rgba(245,158,11,0.18)", borderWidth: 1, borderColor: "rgba(245,158,11,0.35)" }}
          >
            <AlertTriangle size={18} color="#f59e0b" />
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold">Геолокация</Text>
              <Text className="text-subtle text-xs">{locationStatus}</Text>
            </View>
          </View>
        )}

        {contestedCount > 0 && (
          <View
            className="mt-3 rounded-2xl px-4 py-3 flex-row items-center gap-3"
            style={{ backgroundColor: "rgba(239,68,68,0.18)", borderWidth: 1, borderColor: "rgba(239,68,68,0.4)" }}
          >
            <AlertTriangle size={20} color="#ef4444" />
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold">{contestedCount} территории под атакой</Text>
              <Text className="text-subtle text-xs">Защити, иначе теряешь доход</Text>
            </View>
          </View>
        )}
      </View>

      {/* FAB row */}
      <View className="absolute left-0 right-0 bottom-36 px-8 flex-row items-center justify-between">
        <IconButton
          size={56}
          variant="purple"
          icon={<Zap size={26} color="#8b5cf6" />}
          onPress={() => setShowBoosts(true)}
        />

        <Pressable onPress={onStartRun}>
          <LinearGradient
            colors={["#00ff88", "#00cc6f"]}
            style={{
              width: 88, height: 88, borderRadius: 44,
              alignItems: "center", justifyContent: "center",
              shadowColor: "#00ff88", shadowOpacity: 0.7, shadowRadius: 28,
            }}
          >
            <Play size={36} color="#000" fill="#000" />
          </LinearGradient>
        </Pressable>

        <IconButton size={56} icon={<Navigation size={24} color="#fff" />} />
      </View>

      {/* Territory detail modal */}
      <Modal visible={selected != null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          {selected && (
            <View
              className="rounded-t-3xl p-6 pb-12"
              style={{
                backgroundColor: "#0a0a0a",
                borderTopWidth: 2,
                borderTopColor:
                  selected.status === "high-value" && selected.owner === "user" ? "#ffd700" : selected.color,
              }}
            >
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 52, height: 52, borderRadius: 26,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: `${selected.color}33`,
                      borderWidth: 2, borderColor: selected.color,
                    }}
                  >
                    <Text style={{ fontSize: 24 }}>{selected.ownerAvatar}</Text>
                  </View>
                  <View>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-white text-lg font-semibold">{selected.ownerName}</Text>
                      {selected.isKingZone && <Crown size={16} color="#ffd700" />}
                    </View>
                    <Text className="text-subtle text-xs">
                      {selected.status === "contested"  ? "⚔️ Под атакой" :
                       selected.status === "high-value" ? (selected.isKingZone ? "👑 Король-зона" : "💎 Высокая ценность") :
                       selected.status === "expiring"   ? "⏰ Скоро истечёт" :
                       "Твоя территория"}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => setSelected(null)}>
                  <X size={24} color="#a1a1aa" />
                </Pressable>
              </View>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <Text className="text-subtle text-xs">Доход / 24ч</Text>
                  <Text style={{ color: selected.color, fontSize: 22, fontWeight: "700", marginTop: 4 }}>
                    ${selected.earnings.toFixed(2)}
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <Text className="text-subtle text-xs">Осталось</Text>
                  <Text className="text-white text-xl font-semibold mt-1">{selected.timeRemaining}</Text>
                </View>
              </View>

              {selected.pendingAmount ? (
                <View
                  className="rounded-2xl p-4 mb-4"
                  style={{
                    backgroundColor:
                      selected.status === "high-value" && selected.owner === "user"
                        ? "rgba(255,215,0,0.18)"
                        : `${selected.color}22`,
                    borderWidth: 1,
                    borderColor:
                      selected.status === "high-value" && selected.owner === "user" ? "#ffd700" : selected.color,
                  }}
                >
                  <Text className="text-subtle text-xs">💰 Готово к получению</Text>
                  <Text
                    style={{
                      color: selected.status === "high-value" && selected.owner === "user" ? "#ffd700" : selected.color,
                      fontSize: 28, fontWeight: "700", marginTop: 4,
                    }}
                  >
                    ${selected.pendingAmount.toFixed(2)}
                  </Text>
                </View>
              ) : null}

              <Pressable>
                <LinearGradient
                  colors={
                    selected.owner === "user"
                      ? selected.status === "high-value"
                        ? ["#ffd700", "#ffa500"]
                        : [selected.color, selected.color]
                      : ["#ef4444", "#dc2626"]
                  }
                  style={{ borderRadius: 18, paddingVertical: 16, alignItems: "center" }}
                >
                  <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>
                    {selected.owner === "user"
                      ? selected.pendingAmount ? "💰 Забрать доход" : "🛡️ Защитить территорию"
                      : "⚔️ Атаковать"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      {/* Power-Ups modal */}
      <Modal visible={showBoosts} transparent animationType="slide" onRequestClose={() => setShowBoosts(false)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.7)" }}>
          <View
            className="rounded-t-3xl p-6 pb-12"
            style={{ backgroundColor: "#0a0a0a", borderTopWidth: 2, borderTopColor: "rgba(139,92,246,0.5)" }}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-white text-xl font-bold">Усиления</Text>
              <Pressable onPress={() => setShowBoosts(false)}><X size={24} color="#a1a1aa" /></Pressable>
            </View>

            <View className="gap-3">
              <BoostCard
                icon={<Zap size={22} color="#00ff88" />}
                title="2× к доходу"
                subtitle="6 часов"
                price="$2.99"
                colors={["#00ff88", "#00cc6f"]}
                badgeBg="rgba(0,255,136,0.18)"
                priceColor="#00ff88"
                buttonTextColor="#000"
              />
              <BoostCard
                icon={<Shield size={22} color="#8b5cf6" />}
                title="Щит территории"
                subtitle="Защита 24 часа"
                price="$4.99"
                colors={["#8b5cf6", "#6366f1"]}
                badgeBg="rgba(139,92,246,0.18)"
                priceColor="#8b5cf6"
                buttonTextColor="#fff"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface BoostCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  price: string;
  colors: [string, string];
  badgeBg: string;
  priceColor: string;
  buttonTextColor: string;
}

function BoostCard({ icon, title, subtitle, price, colors, badgeBg, priceColor, buttonTextColor }: BoostCardProps) {
  return (
    <View
      className="rounded-2xl p-4"
      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: `${colors[0]}33` }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-3">
          <View style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: badgeBg }}>
            {icon}
          </View>
          <View>
            <Text className="text-white font-semibold">{title}</Text>
            <Text className="text-subtle text-xs">{subtitle}</Text>
          </View>
        </View>
        <Text style={{ color: priceColor, fontSize: 18, fontWeight: "600" }}>{price}</Text>
      </View>
      <Pressable>
        <LinearGradient colors={colors} style={{ borderRadius: 14, paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ color: buttonTextColor, fontWeight: "600" }}>Активировать</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
