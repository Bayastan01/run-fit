import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { Link, router } from "expo-router";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { login } from "@/api/auth";
import { ApiError } from "@/api/client";
import { useAuth, MOCK_USER } from "@/stores/auth";

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

        <Button
          label="Пропустить — офлайн-превью"
          variant="ghost"
          onPress={() => {
            setUser(MOCK_USER);
            router.replace("/");
          }}
        />

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
