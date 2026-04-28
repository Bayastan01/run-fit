import { useState } from "react";
import { View, Text, Pressable, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router, Stack } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/GlassCard";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { api, unwrap } from "@/api/client";

type Kind = "card" | "yoomoney" | "email";

export default function WithdrawScreen() {
  const [amount, setAmount] = useState("");
  const [destination, setDestination] = useState("");
  const [kind, setKind] = useState<Kind>("card");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    const a = Number(amount);
    if (!Number.isFinite(a) || a < 5) {
      Alert.alert("Ошибка", "Минимальная сумма — 5 RUN");
      return;
    }
    if (destination.length < 4) {
      Alert.alert("Ошибка", "Заполни реквизиты");
      return;
    }
    setSubmitting(true);
    try {
      const res = await unwrap<{ amount: number; status: string; message: string }>(
        api.post("api/wallet/withdraw", { json: { amount: a, destination, destinationKind: kind } }),
      );
      Alert.alert("Заявка принята", res.message, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Не удалось отправить заявку";
      Alert.alert("Ошибка", msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-bg"
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View className="flex-row items-center px-4 pt-14 pb-4 gap-3">
        <Pressable
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={22} color="#fff" />
        </Pressable>
        <Text className="text-white text-2xl font-bold">Вывод средств</Text>
      </View>

      <View className="px-5 gap-4">
        <GlassCard padding={20}>
          <Text className="text-subtle text-xs uppercase tracking-widest">Сумма</Text>
          <TextField
            label=""
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="от 5.00"
          />
          <Text className="text-subtle text-xs mt-2">Комиссия 0%, обработка до 3 рабочих дней.</Text>
        </GlassCard>

        <View className="flex-row gap-2">
          {(["card", "yoomoney", "email"] as const).map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              className="flex-1 rounded-2xl py-3 items-center"
              style={{
                backgroundColor: kind === k ? "rgba(0,255,136,0.18)" : "rgba(255,255,255,0.06)",
                borderWidth: 1, borderColor: kind === k ? "rgba(0,255,136,0.4)" : "rgba(255,255,255,0.10)",
              }}
            >
              <Text style={{ color: kind === k ? "#00ff88" : "#a1a1aa", fontWeight: "600" }}>
                {k === "card" ? "Карта" : k === "yoomoney" ? "ЮMoney" : "Email"}
              </Text>
            </Pressable>
          ))}
        </View>

        <GlassCard padding={20}>
          <TextField
            label={kind === "card" ? "Номер карты" : kind === "yoomoney" ? "Номер кошелька" : "Email"}
            value={destination}
            onChangeText={setDestination}
            keyboardType={kind === "email" ? "email-address" : "default"}
            autoCapitalize="none"
          />
        </GlassCard>

        <Pressable onPress={onSubmit} disabled={submitting}>
          <LinearGradient
            colors={["#00ff88", "#00cc6f"]}
            style={{ borderRadius: 16, paddingVertical: 16, alignItems: "center", opacity: submitting ? 0.6 : 1 }}
          >
            <Text style={{ color: "#000", fontWeight: "700", fontSize: 16 }}>
              {submitting ? "Отправляем…" : "Подать заявку"}
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
