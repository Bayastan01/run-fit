import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform } from "react-native";
import { Link, router } from "expo-router";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";
import { register } from "@/api/auth";
import { ApiError } from "@/api/client";
import { useAuth } from "@/stores/auth";

export default function RegisterScreen() {
  const setUser = useAuth((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const user = await register({ email: email.trim(), displayName: displayName.trim(), password });
      setUser(user);
      router.replace("/");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Не удалось зарегистрироваться");
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
          <Text className="text-text text-3xl font-bold">Создать аккаунт</Text>
          <Text className="text-subtle">Выбери фракцию. Беги по улицам. Забирай территории.</Text>
        </View>

        <View className="gap-4">
          <TextField
            label="Отображаемое имя"
            value={displayName}
            onChangeText={setDisplayName}
          />
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
          />
          <TextField
            label="Пароль (от 8 символов)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text className="text-danger text-sm">{error}</Text> : null}
        </View>

        <Button label="Создать аккаунт" onPress={onSubmit} loading={submitting} />

        <View className="flex-row justify-center gap-2 pt-2">
          <Text className="text-subtle">Уже есть аккаунт?</Text>
          <Link href="/(auth)/login" className="text-primary font-semibold">
            Войти
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
