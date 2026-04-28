import { View, Text, ScrollView, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowDownLeft, ArrowUpRight, DollarSign, TrendingUp, Wallet as WalletIcon } from "lucide-react-native";
import { GlassCard } from "@/components/GlassCard";

interface Tx {
  id: string;
  kind: "earn" | "spend" | "boost";
  title: string;
  subtitle: string;
  amount: number;
  date: string;
}

const TXS: Tx[] = [
  { id: "1", kind: "earn",  title: "Доход с территорий", subtitle: "King Zone · Парк Победы",   amount: 12.40, date: "Сегодня, 18:24" },
  { id: "2", kind: "earn",  title: "Доход с территорий", subtitle: "Жилой район",                amount:  4.20, date: "Сегодня, 14:10" },
  { id: "3", kind: "spend", title: "Усиление: Щит",       subtitle: "Защита 24ч",                 amount: -4.99, date: "Вчера, 09:15" },
  { id: "4", kind: "earn",  title: "Бонус за серию",      subtitle: "12 дней подряд",             amount:  5.00, date: "Вчера, 06:00" },
  { id: "5", kind: "boost", title: "Усиление: 2× доход", subtitle: "6 часов",                    amount: -2.99, date: "3 дня назад" },
];

export default function WalletTab() {
  const balance = 1247.83;
  const today = 16.60;
  const week  = 86.40;

  return (
    <ScrollView className="flex-1 bg-bg" contentContainerStyle={{ paddingBottom: 100 }}>
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

        {/* Hero balance card */}
        <View className="mb-5 rounded-3xl overflow-hidden">
          <LinearGradient
            colors={["rgba(0,255,136,0.2)", "rgba(6,182,212,0.18)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ padding: 28, borderWidth: 2, borderColor: "rgba(0,255,136,0.4)", borderRadius: 24 }}
          >
            <Text className="text-subtle text-xs tracking-widest">БАЛАНС</Text>
            <View className="flex-row items-end gap-2 mt-2">
              <Text className="text-white text-5xl font-bold">${balance.toFixed(2)}</Text>
            </View>

            <View className="flex-row mt-6 gap-3">
              <Pressable className="flex-1">
                <LinearGradient
                  colors={["#00ff88", "#00cc6f"]}
                  style={{ borderRadius: 14, paddingVertical: 12, alignItems: "center" }}
                >
                  <Text style={{ color: "#000", fontWeight: "600" }}>Вывести</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                className="flex-1 rounded-2xl py-3 items-center"
                style={{ backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" }}
              >
                <Text className="text-white font-semibold">Пополнить</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>

        {/* Period stats */}
        <View className="flex-row gap-3 mb-5">
          <PeriodStat icon={<TrendingUp size={16} color="#00ff88" />} label="Сегодня" amount={today} />
          <PeriodStat icon={<DollarSign size={16} color="#06b6d4" />} label="Неделя"  amount={week} accent="#06b6d4" />
        </View>

        {/* Transactions */}
        <Text className="text-subtle text-xs tracking-widest mb-3">ИСТОРИЯ</Text>
        <View className="gap-2">
          {TXS.map((tx) => (
            <GlassCard key={tx.id} padding={14}>
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 40, height: 40, borderRadius: 20,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: tx.amount > 0 ? "rgba(0,255,136,0.18)" : "rgba(239,68,68,0.18)",
                  }}
                >
                  {tx.amount > 0 ? <ArrowDownLeft size={18} color="#00ff88" /> : <ArrowUpRight size={18} color="#ef4444" />}
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold">{tx.title}</Text>
                  <Text className="text-subtle text-xs">{tx.subtitle} · {tx.date}</Text>
                </View>
                <Text style={{ color: tx.amount > 0 ? "#00ff88" : "#ef4444", fontSize: 16, fontWeight: "700" }}>
                  {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
                </Text>
              </View>
            </GlassCard>
          ))}
        </View>
      </View>
    </ScrollView>
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
      <Text style={{ color: accent, fontSize: 22, fontWeight: "700" }}>+${amount.toFixed(2)}</Text>
    </View>
  );
}
