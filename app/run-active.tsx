import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable, Animated } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Pause, Play, Square, MapPin, DollarSign, TrendingUp, Footprints, Battery } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { ChainBadge } from "@/components/ChainBadge";
import { useActiveRun } from "@/stores/activeRun";
import { useStreak } from "@/stores/streak";
import { useQuest } from "@/stores/quest";
import { usePrivacy } from "@/stores/privacy";
import { finishRun, uploadPoints } from "@/api/runs";
import { useRunTracker } from "@/features/tracking/useRunTracker";
import { useChain, CHAIN_DEFAULTS } from "@/features/tracking/useChain";
import { startBackgroundLocation, stopBackgroundLocation } from "@/features/tracking/backgroundTask";
import { pointBuffer } from "@/features/tracking/pointBuffer";
import { useUserLocation } from "@/features/location/useUserLocation";
import { RunMap } from "@/components/RunMap";
import { CaptureFlash } from "@/components/CaptureFlash";

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export default function ActiveRun() {
  const { runId, startedAt, reset } = useActiveRun();
  const recordStreakRun = useStreak((s) => s.recordRun);
  const streakMultiplier = useStreak((s) => s.multiplier);
  const markFirstRun = useQuest((s) => s.markFirstRun);
  const isInPrivacyZone = usePrivacy((s) => s.isInside);
  const ghostMode = usePrivacy((s) => s.ghostMode);

  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);

  const [state, controls] = useRunTracker(runId !== null && startedAt !== null);
  const chain = useChain(state.activity.scoring);
  // Independent foreground GPS just for the map dot — gives a position
  // even before the tracker accepts the first valid sample.
  const { coord: liveCoord } = useUserLocation();

  // Live capture detector: when the runner closes a loop back to the
  // start (within 25 m, after at least 200 m of distance), we celebrate
  // and color the polygon green. Resets after the celebration.
  const [captureFlash, setCaptureFlash] = useState(false);
  const [areaClosed, setAreaClosed] = useState(false);
  useEffect(() => {
    const last = state.points[state.points.length - 1];
    const start = state.points[0];
    if (!last || !start) return;
    if (state.scoredDistanceM < 200) return;
    const d = haversineMeters(last.lat, last.lng, start.lat, start.lng);
    if (d < 25 && !areaClosed) {
      setAreaClosed(true);
      setCaptureFlash(true);
      setTimeout(() => setCaptureFlash(false), 2000);
    } else if (d > 60 && areaClosed) {
      setAreaClosed(false);
    }
  }, [state.points.length, state.scoredDistanceM]);

  const claimColor = areaClosed ? "#00ff88" : state.activity.color;

  // Background GPS — фоновое отслеживание + foreground service notification
  useEffect(() => {
    if (!runId) return;
    let active = true;
    startBackgroundLocation(runId).catch(() => {});
    return () => {
      active = false;
      stopBackgroundLocation().catch(() => {});
    };
  }, [runId]);

  // Push chain multiplier into tracker so it counts weighted distance.
  useEffect(() => {
    controls.setChainMultiplier(chain.multiplier);
  }, [chain.multiplier]);

  // Push privacy-zone flag based on latest GPS point
  useEffect(() => {
    const last = state.points[state.points.length - 1];
    if (!last) return;
    controls.setInPrivacyZone(isInPrivacyZone(last.lat, last.lng));
  }, [state.points.length]);

  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  useEffect(() => {
    if (state.paused || state.autoPaused) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.paused, state.autoPaused]);

  // Periodic flush of points to backend (15s).
  // Foreground tracker writes through MMKV buffer for offline retry.
  useEffect(() => {
    if (!runId) return;
    const t = setInterval(() => {
      const drained = controls.flushPoints();
      if (drained.length > 0) {
        pointBuffer.pushMany(drained.map((p) => ({
          ts: p.ts,
          lat: p.lat, lng: p.lng,
          accuracyM: p.accuracyM ?? null,
          speedMps: p.speedMps,
          altitude: p.altitude ?? null,
        })));
      }
      void pointBuffer.flush();
    }, 15_000);
    return () => clearInterval(t);
  }, [runId]);

  if (!runId || !startedAt) {
    return (
      <View className="flex-1 bg-bg justify-center items-center">
        <Text className="text-subtle">Нет активной пробежки</Text>
      </View>
    );
  }

  const seconds = Math.floor((now - startedAt) / 1000);
  const km = state.scoredDistanceM / 1000;
  const totalKm = state.rawDistanceM / 1000;
  const weightedKm = state.weightedDistanceM / 1000;
  const speedKmh = state.speedMps * 3.6;
  const pace = state.speedMps > 0.4 ? 60 / (state.speedMps * 3.6) : 0;

  async function onFinish() {
    setBusy(true);
    try {
      const tail = controls.flushPoints();
      if (tail.length > 0) {
        pointBuffer.pushMany(tail.map((p) => ({
          ts: p.ts,
          lat: p.lat, lng: p.lng,
          accuracyM: p.accuracyM ?? null,
          speedMps: p.speedMps,
          altitude: p.altitude ?? null,
        })));
      }
      await pointBuffer.flush();
      await stopBackgroundLocation().catch(() => {});
      await finishRun(runId!).catch(() => {});
      if (state.scoredDistanceM > 100) {
        recordStreakRun();
        markFirstRun();
      }
    } finally {
      reset();
      setBusy(false);
      router.replace("/(tabs)/map");
    }
  }

  return (
    <View className="flex-1 bg-bg">
      {/* Live route map (start point + path + current pulse) */}
      <View className="absolute inset-0">
        <RunMap
          points={state.points.map((p) => ({ lat: p.lat, lng: p.lng }))}
          current={(() => {
            const last = state.points[state.points.length - 1];
            if (last) return { lat: last.lat, lng: last.lng };
            if (liveCoord) return { lat: liveCoord.lat, lng: liveCoord.lng };
            return null;
          })()}
          color={state.activity.color}
          claimColor={claimColor}
        />
        {/* Subtle dim so metric cards stay legible over the map */}
        <View
          pointerEvents="none"
          style={{ position: "absolute", left: 0, right: 0, top: 0, height: 360, backgroundColor: "rgba(10,10,10,0.55)" }}
        />
        <View
          pointerEvents="none"
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 220, backgroundColor: "rgba(10,10,10,0.55)" }}
        />
      </View>

      <View className="px-5 pt-12">
        {/* Activity badge + chain ring + status indicators */}
        <View className="flex-row items-center justify-between mb-3">
          <View
            className="flex-row items-center gap-2 px-4 py-2 rounded-full"
            style={{
              backgroundColor: `${state.activity.color}26`,
              borderWidth: 1, borderColor: `${state.activity.color}66`,
            }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: state.activity.color }} />
            <Text style={{ color: state.activity.color, fontWeight: "700", letterSpacing: 1 }}>
              {state.activity.label.toUpperCase()}
            </Text>
          </View>

          <View className="flex-row items-center gap-2">
            {ghostMode && <StatusPill text="GHOST" color="#a1a1aa" />}
            {streakMultiplier > 1 && <StatusPill text={`🔥 ×${streakMultiplier.toFixed(2)}`} color="#ef4444" />}
            <StatusPill text={state.gpsProfile.label.toUpperCase()} color="#06b6d4" />
          </View>
        </View>

        <GlassCard borderColor={`${state.activity.color}66`} glow={state.activity.color} padding={20}>
          {/* Top row: chain ring + clock */}
          <View className="flex-row items-center mb-4">
            <ChainBadge
              current={chain.current}
              multiplier={chain.multiplier}
              pulseAge={chain.pulseAge}
              pulseMs={CHAIN_DEFAULTS.pulseMs}
              color={state.activity.color}
            />
            <View className="flex-1 items-end">
              <Text style={{ color: state.activity.color, fontSize: 56, fontWeight: "700", letterSpacing: -2 }}>
                {formatTime(seconds)}
              </Text>
              <Text className="text-subtle text-[10px] tracking-widest">ВРЕМЯ</Text>
            </View>
          </View>

          <View className="flex-row mb-4">
            <Metric label="КМ"     value={km.toFixed(2)} />
            <Metric label="МИН/КМ" value={pace > 0 ? pace.toFixed(1) : "—"} />
            <Metric label="КМ/Ч"   value={speedKmh.toFixed(1)} accent />
          </View>

          <View className="border-t border-border pt-3 gap-2">
            <Row icon={<Footprints size={14} color="#06b6d4" />}
                 label="Каденс" value={state.cadence > 0 ? `${state.cadence} ш/мин` : "—"} valueColor="#06b6d4" />
            <Row icon={<MapPin size={14} color="#a1a1aa" />}
                 label="Всего" value={`${totalKm.toFixed(2)} км`} valueColor="#fff" />
            <Row icon={<DollarSign size={14} color="#ffd700" />}
                 label="Зачёт × множитель" value={`${weightedKm.toFixed(2)} км`} valueColor="#ffd700" />
          </View>
        </GlassCard>

        {/* Auto-pause banner */}
        {state.autoPaused && (
          <View
            className="mt-3 rounded-2xl px-4 py-3"
            style={{ backgroundColor: "rgba(245,158,11,0.18)", borderWidth: 1, borderColor: "rgba(245,158,11,0.4)" }}
          >
            <Text className="text-warning font-semibold text-sm">⏸ Авто-пауза</Text>
            <Text className="text-subtle text-xs">90 сек без движения — продолжаем когда побежишь</Text>
          </View>
        )}

        {/* Live capture banner — area closed back to start */}
        {areaClosed && !captureFlash && (
          <View
            className="mt-3 rounded-2xl px-4 py-3"
            style={{ backgroundColor: "rgba(0,255,136,0.18)", borderWidth: 1, borderColor: "rgba(0,255,136,0.5)" }}
          >
            <Text style={{ color: "#00ff88", fontWeight: "700", fontSize: 14 }}>🟢 Замкнул петлю — территория зачтена</Text>
            <Text className="text-subtle text-xs">Финишируй, чтобы закрепить улицы внутри.</Text>
          </View>
        )}
      </View>

      {/* Fullscreen capture flash on first close */}
      {captureFlash && (
        <CaptureFlash count={1} onDone={() => setCaptureFlash(false)} />
      )}

      {/* Hint */}
      <View className="absolute left-0 right-0 items-center" style={{ bottom: 200 }}>
        <View
          className="flex-row items-center gap-2 px-5 py-3 rounded-2xl"
          style={{ backgroundColor: "rgba(10,10,10,0.85)", borderWidth: 1, borderColor: `${state.activity.color}33` }}
        >
          <TrendingUp size={18} color={state.activity.color} />
          <Text className="text-white text-sm">{state.activity.hint}</Text>
        </View>
      </View>

      {/* Pause / Stop */}
      <View className="absolute left-0 right-0 bottom-20 flex-row justify-center gap-6">
        <Pressable onPress={() => (state.paused ? controls.resume() : controls.pause())}>
          <View
            style={{
              width: 68, height: 68, borderRadius: 34,
              alignItems: "center", justifyContent: "center",
              backgroundColor: state.paused ? "rgba(0,255,136,0.18)" : "rgba(255,255,255,0.08)",
              borderWidth: state.paused ? 2 : 1,
              borderColor: state.paused ? "#00ff88" : "rgba(255,255,255,0.2)",
            }}
          >
            {state.paused ? <Play size={28} color="#fff" /> : <Pause size={28} color="#fff" />}
          </View>
        </Pressable>

        <Pressable onPress={onFinish} disabled={busy}>
          <LinearGradient
            colors={["#ef4444", "#dc2626"]}
            style={{
              width: 68, height: 68, borderRadius: 34,
              alignItems: "center", justifyContent: "center",
              shadowColor: "#ef4444", shadowOpacity: 0.5, shadowRadius: 16,
              opacity: busy ? 0.6 : 1,
            }}
          >
            <Square size={26} color="#fff" fill="#fff" />
          </LinearGradient>
        </Pressable>
      </View>
    </View>
  );
}

function StatusPill({ text, color }: { text: string; color: string }) {
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: `${color}22`, borderWidth: 1, borderColor: `${color}44` }}>
      <Text style={{ color, fontSize: 10, fontWeight: "700", letterSpacing: 0.5 }}>{text}</Text>
    </View>
  );
}

function Metric({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View className="flex-1 items-center">
      <Text style={{ color: accent ? "#00ff88" : "#ffffff", fontSize: 26, fontWeight: "700" }}>{value}</Text>
      <Text className="text-subtle text-[10px] mt-1">{label}</Text>
    </View>
  );
}

function Row({ icon, label, value, valueColor }: { icon: React.ReactNode; label: string; value: string; valueColor: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center gap-2">
        {icon}
        <Text className="text-subtle text-xs">{label}</Text>
      </View>
      <Text style={{ color: valueColor, fontSize: 14, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}
