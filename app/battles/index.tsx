import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl } from "react-native";
import { router, Stack } from "expo-router";
import { ChevronLeft, Swords, Shield, Trophy } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { SkeletonRow } from "@/components/Skeleton";
import { listBattles, type Battle } from "@/api/battles";
import { useAuth } from "@/stores/auth";

export default function BattlesScreen() {
  const user = useAuth((s) => s.user);
  const [battles, setBattles] = useState<Battle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const items = await listBattles();
      setBattles(items);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Live polling — refresh every 20 s while screen is mounted, so the
  // distance bars and timers update without manual pull.
  useEffect(() => {
    const t = setInterval(() => { void load(); }, 20_000);
    return () => clearInterval(t);
  }, [load]);

  // 1-second tick just for the countdown labels.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const active = battles.filter((b) => b.status === "ACTIVE" || b.status === "SCHEDULED");
  const resolved = battles.filter((b) => b.status === "RESOLVED");

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
        <Text className="text-white text-2xl font-bold">Битвы</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, gap: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#00ff88" />}
      >
        {loading && battles.length === 0 ? (
          <SkeletonRow count={5} height={68} />
        ) : (
          <>
            <Section title="Активные" count={active.length}>
              {active.length === 0 ? (
                <GlassCard padding={20}>
                  <Text className="text-subtle text-center">
                    Тапни на чужую улицу на карте — объяви атаку. У тебя 24ч пробежать больше защитника.
                  </Text>
                </GlassCard>
              ) : (
                active.map((b) => (
                  <BattleCard key={b.id} battle={b} userId={user?.id ?? ""} now={now} />
                ))
              )}
            </Section>

            {resolved.length > 0 && (
              <Section title="Завершённые" count={resolved.length}>
                {resolved.map((b) => (
                  <BattleCard key={b.id} battle={b} userId={user?.id ?? ""} now={now} />
                ))}
              </Section>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between mb-1">
        <Text className="text-subtle text-xs uppercase tracking-widest">{title}</Text>
        <Text className="text-subtle text-xs">{count}</Text>
      </View>
      {children}
    </View>
  );
}

function BattleCard({ battle, userId, now }: { battle: Battle; userId: string; now: number }) {
  const isAttacker = battle.attackerUserId === userId;
  const myDist = isAttacker ? battle.attackerDistanceM : battle.defenderDistanceM;
  const oppDist = isAttacker ? battle.defenderDistanceM : battle.attackerDistanceM;
  const won = battle.winnerSide && (battle.winnerSide === "ATTACKER" ? isAttacker : !isAttacker);

  const totalDist = myDist + oppDist;
  const myShare = totalDist > 0 ? (myDist / totalDist) * 100 : 50;
  // Need 1.2× more than opponent to win (server constant) — show how
  // many extra metres are required.
  const requiredLead = Math.max(0, oppDist * 1.2 - myDist);

  const expiresIn = new Date(battle.expiresAt).getTime() - now;
  const expiresHours = Math.max(0, Math.floor(expiresIn / 3_600_000));
  const expiresMin = Math.max(0, Math.floor((expiresIn % 3_600_000) / 60_000));
  const expiresSec = Math.max(0, Math.floor((expiresIn % 60_000) / 1_000));
  const urgent = expiresIn > 0 && expiresIn < 60 * 60_000;
  const timeColor = urgent ? "#ef4444" : "#a1a1aa";

  return (
    <GlassCard padding={16}>
      <View className="flex-row items-center gap-3 mb-3">
        <View
          style={{
            width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center",
            backgroundColor: isAttacker ? "rgba(239,68,68,0.18)" : "rgba(6,182,212,0.18)",
          }}
        >
          {isAttacker ? <Swords size={18} color="#ef4444" /> : <Shield size={18} color="#06b6d4" />}
        </View>
        <View className="flex-1">
          <Text className="text-white font-semibold">
            {isAttacker ? "Ты атакуешь" : "Ты защищаешь"}
          </Text>
          <Text style={{ color: battle.status === "RESOLVED" ? "#a1a1aa" : timeColor, fontSize: 12, fontWeight: urgent ? "700" : "400" }}>
            {battle.status === "RESOLVED"
              ? `Завершена ${new Date(battle.resolvedAt!).toLocaleString("ru-RU", { day: "2-digit", month: "short" })}`
              : expiresIn <= 0
                ? "⏱ резолв в течение 5 мин"
                : `⏱ ${expiresHours}ч ${expiresMin}м ${expiresSec.toString().padStart(2, "0")}с`}
          </Text>
        </View>
        {battle.status === "RESOLVED" && won && <Trophy size={20} color="#ffd700" />}
      </View>

      <View style={{ height: 8, backgroundColor: "#27272a", borderRadius: 4, overflow: "hidden" }}>
        <View style={{ height: "100%", width: `${myShare}%`, backgroundColor: "#00ff88" }} />
      </View>
      <View className="flex-row justify-between mt-2">
        <Text className="text-subtle text-xs">Ты: {(myDist / 1000).toFixed(2)} км</Text>
        <Text className="text-subtle text-xs">Соперник: {(oppDist / 1000).toFixed(2)} км</Text>
      </View>

      {battle.status !== "RESOLVED" && requiredLead > 0 && (
        <Text style={{ color: "#f59e0b", fontSize: 11, marginTop: 6 }}>
          Нужно ещё +{requiredLead.toFixed(0)} м для победы (1.2× преимущество)
        </Text>
      )}

      {battle.status === "RESOLVED" && (
        <View className="mt-3">
          <Text style={{ color: won ? "#00ff88" : "#ef4444", fontSize: 13, fontWeight: "700" }}>
            {won ? "🏆 Победа" : "Поражение"}
          </Text>
        </View>
      )}
    </GlassCard>
  );
}
