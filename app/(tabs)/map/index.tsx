import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { View, Text, Pressable, Modal, ActivityIndicator, Alert } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle, Crown, DollarSign, Navigation, Play, Shield, X, Zap,
} from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { IconButton } from "@/components/Button";
import { TerritoryMap, type LatLng } from "@/components/TerritoryMap";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useUserLocation } from "@/features/location/useUserLocation";
import { startRun } from "@/api/runs";
import { fetchStreets, type StreetSegmentFeature, type BBox } from "@/api/streets";
import { fetchMyTracksInBbox, type TrackOverlay } from "@/api/tracks";
import { fetchBalance, type Balances } from "@/api/wallet";
import { purchaseBoost } from "@/api/boosts";
import { useActiveRun } from "@/stores/activeRun";
import { useRegionChannel } from "@/features/realtime/useRegionChannel";

const FALLBACK_CENTER: LatLng = { latitude: 55.7558, longitude: 37.6173 };

export default function MapTab() {
  const [selected, setSelected] = useState<StreetSegmentFeature | null>(null);
  const [showBoosts, setShowBoosts] = useState(false);
  const [segments, setSegments] = useState<StreetSegmentFeature[]>([]);
  const [historyTracks, setHistoryTracks] = useState<TrackOverlay[]>([]);
  const [bbox, setBbox] = useState<BBox | null>(null);
  const [loading, setLoading] = useState(false);
  const [balances, setBalances] = useState<Balances | null>(null);
  const startActive = useActiveRun((s) => s.start);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { coord, error } = useUserLocation();

  const center: LatLng = coord
    ? { latitude: coord.lat, longitude: coord.lng }
    : FALLBACK_CENTER;

  const onBoundsChanged = useCallback((b: BBox) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setBbox(b), 350);
  }, []);

  useEffect(() => {
    if (!bbox) return;
    let alive = true;
    setLoading(true);
    fetchStreets(bbox)
      .then((c) => { if (alive) setSegments(c.features); })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [bbox]);

  // Load my history tracks for the same bbox so old runs appear as faded lines.
  useEffect(() => {
    if (!bbox) return;
    let alive = true;
    fetchMyTracksInBbox(bbox)
      .then((tracks) => { if (alive) setHistoryTracks(tracks); })
      .catch(() => {});
    return () => { alive = false; };
  }, [bbox]);

  useEffect(() => {
    fetchBalance().then(setBalances).catch(() => {});
  }, []);

  useRegionChannel("global", useCallback((u) => {
    setSegments((prev) =>
      prev.map((s) =>
        u.segmentIds.includes(s.properties.id)
          ? { ...s, properties: { ...s.properties, factionId: u.factionId, ownerId: u.userId, isMine: false } }
          : s,
      ),
    );
  }, []));

  const ownedSegments = segments.filter((s) => s.properties.isMine);

  async function onStartRun() {
    try {
      const { runId } = await startRun();
      startActive(runId);
      router.push("/run-active");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось начать";
      Alert.alert("Ошибка соединения", `${msg}\n\nПроверь интернет и попробуй ещё раз.`);
    }
  }

  async function onBuyBoost(kind: "EARNINGS_2X" | "SHIELD_24H" | "ENERGY_REFILL") {
    try {
      await purchaseBoost(kind);
      const b = await fetchBalance();
      setBalances(b);
      setShowBoosts(false);
    } catch {}
  }

  const locationStatus =
    coord ? null
    : error === "permission" ? "Разреши доступ к геолокации в настройках"
    : error === "unavailable" ? "Включи GPS на устройстве"
    : "Определяем местоположение…";

  return (
    <View className="flex-1 bg-bg">
      <TerritoryMap
        segments={segments}
        path={[]}
        center={center}
        userLocation={coord ? { latitude: coord.lat, longitude: coord.lng } : null}
        historyTracks={historyTracks.map((t) => ({ runId: t.runId, coordinates: t.geometry.coordinates }))}
        onSelect={setSelected}
        onBoundsChanged={onBoundsChanged}
      />

      <View className="absolute left-0 right-0 top-12 px-4">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.push("/(tabs)/wallet")}>
            <GlassCard borderColor="rgba(0,255,136,0.35)" padding={12}>
              <View className="flex-row items-center gap-3">
                <DollarSign size={20} color="#00ff88" />
                <View>
                  <Text className="text-subtle text-[10px] uppercase tracking-widest">Баланс</Text>
                  <Text className="text-primary text-lg font-bold">{(balances?.COIN ?? 0).toFixed(2)}</Text>
                </View>
              </View>
            </GlassCard>
          </Pressable>

          <View className="flex-row gap-2 items-center">
            {loading && <ActivityIndicator color="#00ff88" />}
            <ThemeToggle />
            <Pressable onPress={() => router.push("/(tabs)/profile")}>
              <IconButton size={48} icon={<Text style={{ fontSize: 22 }}>⚡</Text>} />
            </Pressable>
          </View>
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

        {ownedSegments.length > 0 && (
          <View
            className="mt-3 rounded-2xl px-4 py-3 flex-row items-center gap-3"
            style={{ backgroundColor: "rgba(0,255,136,0.10)", borderWidth: 1, borderColor: "rgba(0,255,136,0.30)" }}
          >
            <Crown size={18} color="#00ff88" />
            <View className="flex-1">
              <Text className="text-white text-sm font-semibold">{ownedSegments.length} улиц в этом районе твои</Text>
              <Text className="text-subtle text-xs">Беги по ним, чтобы защитить</Text>
            </View>
          </View>
        )}
      </View>

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

      <Modal visible={selected != null} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View className="flex-1 justify-end" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          {selected && (
            <View
              className="rounded-t-3xl p-6 pb-12"
              style={{
                backgroundColor: "#0a0a0a",
                borderTopWidth: 2,
                borderTopColor: selected.properties.factionColor ?? "#3f3f46",
              }}
            >
              <View className="flex-row items-center justify-between mb-6">
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 52, height: 52, borderRadius: 26,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: `${selected.properties.factionColor ?? "#3f3f46"}33`,
                      borderWidth: 2, borderColor: selected.properties.factionColor ?? "#3f3f46",
                    }}
                  >
                    <Text style={{ fontSize: 22, color: "#fff" }}>
                      {selected.properties.isMine ? "⚡" : selected.properties.ownerId ? "⚔️" : "·"}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-white text-lg font-semibold">
                      {selected.properties.streetName ?? "Без названия"}
                    </Text>
                    <Text className="text-subtle text-xs">
                      {selected.properties.isMine ? "Твоя территория"
                        : selected.properties.ownerId ? `Владелец: ${selected.properties.ownerName ?? "?"}`
                        : "Свободная улица"}
                    </Text>
                  </View>
                </View>
                <Pressable onPress={() => setSelected(null)}>
                  <X size={24} color="#a1a1aa" />
                </Pressable>
              </View>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <Text className="text-subtle text-xs">Длина</Text>
                  <Text className="text-white text-xl font-semibold mt-1">
                    {Math.round(selected.properties.lengthM)} м
                  </Text>
                </View>
                <View className="flex-1 rounded-2xl p-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
                  <Text className="text-subtle text-xs">Защита / Атаки</Text>
                  <Text className="text-white text-xl font-semibold mt-1">
                    {selected.properties.defenseCount} / {selected.properties.flipCount}
                  </Text>
                </View>
              </View>

              <Pressable onPress={() => { setSelected(null); onStartRun(); }}>
                <LinearGradient
                  colors={selected.properties.isMine ? ["#00ff88", "#00cc6f"] : ["#ef4444", "#dc2626"]}
                  style={{ borderRadius: 18, paddingVertical: 16, alignItems: "center" }}
                >
                  <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>
                    {selected.properties.isMine ? "🛡️ Защитить (беги)" : "⚔️ Захватить (беги)"}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

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

            <Text className="text-subtle text-sm mb-4">
              Баланс: {(balances?.COIN ?? 0).toFixed(2)} RUN · {balances?.ENERGY ?? 0} энергии
            </Text>

            <View className="gap-3">
              <BoostCard
                icon={<Zap size={22} color="#00ff88" />}
                title="2× к доходу"
                subtitle="6 часов · 5 RUN"
                colors={["#00ff88", "#00cc6f"]}
                onPress={() => onBuyBoost("EARNINGS_2X")}
              />
              <BoostCard
                icon={<Shield size={22} color="#8b5cf6" />}
                title="Щит территории"
                subtitle="Защита 24ч · 8 RUN"
                colors={["#8b5cf6", "#6366f1"]}
                onPress={() => onBuyBoost("SHIELD_24H")}
              />
              <BoostCard
                icon={<Zap size={22} color="#f59e0b" />}
                title="Залить энергию"
                subtitle="до 100 · 2 RUN"
                colors={["#f59e0b", "#dc6803"]}
                onPress={() => onBuyBoost("ENERGY_REFILL")}
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
  colors: [string, string];
  onPress: () => void;
}

function BoostCard({ icon, title, subtitle, colors, onPress }: BoostCardProps) {
  return (
    <View
      className="rounded-2xl p-4"
      style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: `${colors[0]}33` }}
    >
      <View className="flex-row items-center gap-3 mb-3">
        <View
          style={{
            width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
            backgroundColor: `${colors[0]}30`,
          }}
        >
          {icon}
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold">{title}</Text>
          <Text className="text-subtle text-xs">{subtitle}</Text>
        </View>
      </View>
      <Pressable onPress={onPress}>
        <LinearGradient colors={colors} style={{ borderRadius: 14, paddingVertical: 12, alignItems: "center" }}>
          <Text style={{ color: "#000", fontWeight: "600" }}>Купить</Text>
        </LinearGradient>
      </Pressable>
    </View>
  );
}
