import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, RefreshControl, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowDownLeft, ArrowUpRight, DollarSign, TrendingUp, Wallet as WalletIcon } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";
import { fetchBalance, fetchTransactions, type Balances, type LedgerEntry } from "@/api/wallet";

const REASON_LABEL: Record<string, string> = {
  TERRITORY_HOURLY: "Доход с территорий",
  TERRITORY_CAPTURED: "Захват улицы",
  RUN_COMPLETED: "Завершённая пробежка",
  ACHIEVEMENT_UNLOCKED: "Достижение",
  STREAK_BONUS: "Бонус за серию",
  BATTLE_WIN: "Победа в битве",
  BOOST_PURCHASED: "Покупка усиления",
  ADMIN_ADJUSTMENT: "Корректировка",
  WITHDRAWAL_REQUEST: "Вывод средств",
  REFUND: "Возврат",
};

export default function WalletTab() {
  const [balances, setBalances] = useState<Balances | null>(null);
  const [txs, setTxs] = useState<LedgerEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [b, t] = await Promise.all([fetchBalance(), fetchTransactions()]);
      setBalances(b);
      setTxs(t.items);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function onRefresh() { setRefreshing(true); load(); }

  const today = txs
    .filter((t) => isToday(t.createdAt) && t.type === "COIN" && t.delta > 0)
    .reduce((s, t) => s + t.delta, 0);

  const week = txs
    .filter((t) => isThisWeek(t.createdAt) && t.type === "COIN" && t.delta > 0)
    .reduce((s, t) => s + t.delta, 0);

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerStyle={{ paddingBottom: 100 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00ff88" />}
    >
      <View className="px-5 pt-14">
        <View className="flex-row items-center justify-between mb-6">
          <Text className="text-white text-3xl font-bold">Кошелёк</Text>
          <View
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.06)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <WalletIcon size={20} color="#a1a1aa" />
          </View>
        </View>

        <View className="mb-5 rounded-3xl overflow-hidden">
          <LinearGradient
            colors={["rgba(0,255,136,0.2)", "rgba(6,182,212,0.18)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ padding: 28, borderWidth: 2, borderColor: "rgba(0,255,136,0.4)", borderRadius: 24 }}
          >
            <Text className="text-subtle text-xs tracking-widest">БАЛАНС</Text>
            {loading && balances === null ? (
              <ActivityIndicator color="#00ff88" style={{ marginTop: 12 }} />
            ) : (
              <View className="flex-row items-end gap-3 mt-2">
                <Text className="text-white text-5xl font-bold">{(balances?.COIN ?? 0).toFixed(2)}</Text>
                <Text className="text-subtle text-base mb-2">RUN</Text>
              </View>
            )}

            <View className="flex-row mt-3 gap-4">
              <ResourcePill label="Energy" value={balances?.ENERGY ?? 0} color="#06b6d4" />
              <ResourcePill label="Shards" value={balances?.SHARD ?? 0} color="#8b5cf6" />
            </View>

            <View className="flex-row mt-6 gap-3">
              <Pressable className="flex-1" onPress={() => router.push("/withdraw")}>
                <LinearGradient
                  colors={["#00ff88", "#00cc6f"]}
                  style={{ borderRadius: 14, paddingVertical: 12, alignItems: "center" }}
                >
                  <Text style={{ color: "#000", fontWeight: "600" }}>Вывести</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                onPress={() => router.push("/quests")}
                className="flex-1 rounded-2xl py-3 items-center"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
              >
                <Text className="text-white font-semibold">Задания</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        <View className="flex-row gap-3 mb-5">
          <PeriodStat icon={<TrendingUp size={16} color="#00ff88" />} label="Сегодня" amount={today} />
          <PeriodStat icon={<DollarSign size={16} color="#06b6d4" />} label="Неделя"  amount={week} accent="#06b6d4" />
        </View>

        <Text className="text-subtle text-xs tracking-widest mb-3">ИСТОРИЯ</Text>
        {loading && txs.length === 0 ? (
          <ActivityIndicator color="#00ff88" />
        ) : txs.length === 0 ? (
          <GlassCard padding={20}>
            <Text className="text-subtle text-center">Нет транзакций. Беги — захватывай улицы.</Text>
          </GlassCard>
        ) : (
          <View className="gap-2">
            {txs.map((tx) => (
              <GlassCard key={tx.id} padding={14}>
                <View className="flex-row items-center gap-3">
                  <View
                    style={{
                      width: 40, height: 40, borderRadius: 20,
                      alignItems: "center", justifyContent: "center",
                      backgroundColor: tx.delta > 0 ? "rgba(0,255,136,0.18)" : "rgba(239,68,68,0.18)",
                    }}
                  >
                    {tx.delta > 0 ? <ArrowDownLeft size={18} color="#00ff88" /> : <ArrowUpRight size={18} color="#ef4444" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-semibold">{REASON_LABEL[tx.reason] ?? tx.reason}</Text>
                    <Text className="text-subtle text-xs">{formatDate(tx.createdAt)} · {tx.type}</Text>
                  </View>
                  <Text style={{ color: tx.delta > 0 ? "#00ff88" : "#ef4444", fontSize: 16, fontWeight: "700" }}>
                    {tx.delta > 0 ? "+" : ""}{tx.delta.toFixed(2)}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function ResourcePill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="flex-row items-center gap-1">
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text className="text-subtle text-xs">{label}</Text>
      <Text className="text-white text-sm font-semibold">{Math.round(value)}</Text>
    </View>
  );
}

function PeriodStat({ icon, label, amount, accent = "#00ff88" }: { icon: React.ReactNode; label: string; amount: number; accent?: string }) {
  return (
    <View
      className="flex-1 rounded-2xl p-4"
      style={{ backgroundColor: "rgba(10,10,10,0.7)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)" }}
    >
      <View className="flex-row items-center gap-2 mb-2">
        {icon}
        <Text className="text-subtle text-xs">{label}</Text>
      </View>
      <Text style={{ color: accent, fontSize: 22, fontWeight: "700" }}>+{amount.toFixed(2)}</Text>
    </View>
  );
}

function isToday(iso: string): boolean {
  const d = new Date(iso); const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

function isThisWeek(iso: string): boolean {
  const d = new Date(iso); const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  return diffMs >= 0 && diffMs < 7 * 24 * 60 * 60 * 1000;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return `Сегодня, ${time}`;
  if (isYesterday) return `Вчера, ${time}`;
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" });
}
