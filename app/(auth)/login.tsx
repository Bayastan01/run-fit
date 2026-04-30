import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, Pressable, Alert } from "react-native";
import { Link, router } from "expo-router";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { login } from "@/api/auth";
import { ApiError } from "@/api/client";
import { useAuth } from "@/stores/auth";

export default function LoginScreen() {
  const setUser = useAuth((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const user = await login({ email: email.trim(), password });
      setUser(user);
      router.replace("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось войти");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 bg-bg"
    >
      <View className="flex-1 px-6 pt-24 gap-6">
        <View className="gap-1">
          <Text className="text-text text-3xl font-bold">С возвращением</Text>
          <Text className="text-subtle">Войди, чтобы захватывать улицы.</Text>
        </View>

        <View className="gap-4">
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <TextField
            label="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text className="text-danger text-sm">{error}</Text> : null}
        </View>

        <Button label="Войти" onPress={onSubmit} loading={submitting} />

        <View className="flex-row items-center gap-3">
          <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.10)" }} />
          <Text className="text-subtle text-xs">или</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.10)" }} />
        </View>

        <View className="gap-3">
          <Pressable onPress={() => Alert.alert("Google Sign-In", "Скоро — настраиваем OAuth client")} style={oauthBtn}>
            <Text style={{ fontSize: 18 }}>🟢</Text>
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Войти через Google</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert("Apple Sign-In", "Скоро — настраиваем OAuth client")} style={oauthBtn}>
            <Text style={{ fontSize: 18 }}></Text>
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>Войти через Apple</Text>
          </Pressable>
        </View>

        <View className="flex-row justify-center gap-2 pt-2">
          <Text className="text-subtle">Нет аккаунта?</Text>
          <Link href="/(auth)/register" className="text-primary font-semibold">
            Зарегистрироваться
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const oauthBtn = {
  flexDirection: "row" as const,
  alignItems: "center" as const,
  justifyContent: "center" as const,
  gap: 12,
  paddingVertical: 14,
  borderRadius: 14,
  backgroundColor: "rgba(255,255,255,0.06)",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.10)",
};
