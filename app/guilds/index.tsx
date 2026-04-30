import { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator, RefreshControl, Alert, KeyboardAvoidingView, Platform, TextInput } from "react-native";
import { router, Stack } from "expo-router";
import { ChevronLeft, Users, Plus, Crown } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GlassCard } from "@/components/GlassCard";
import { SkeletonRow } from "@/components/Skeleton";
import { EmptyState } from "@/components/EmptyState";
import { listGuilds, createGuild, joinGuild, leaveGuild, type GuildListItem } from "@/api/guilds";
import { useAuth } from "@/stores/auth";

export default function GuildsScreen() {
  const me = useAuth((s) => s.user);
  const [items, setItems] = useState<GuildListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await listGuilds();
      setItems(list);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function onCreate(): Promise<void> {
    if (name.trim().length < 2) {
      Alert.alert("Ошибка", "Имя — минимум 2 символа");
      return;
    }
    if (!/^[A-Z0-9]{2,8}$/.test(tag)) {
      Alert.alert("Ошибка", "Тег: 2–8 заглавных латинских букв или цифр (например RUN)");
      return;
    }
    setBusy(true);
    try {
      await createGuild(name.trim(), tag);
      Alert.alert("Готово", "Гильдия создана");
      setShowCreate(false);
      setName(""); setTag("");
      await load();
    } catch (e) {
      Alert.alert("Не получилось", e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function onJoin(g: GuildListItem): Promise<void> {
    setBusy(true);
    try {
      await joinGuild(g.id);
      await load();
    } catch (e) {
      Alert.alert("Не получилось", e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  async function onLeave(g: GuildListItem): Promise<void> {
    setBusy(true);
    try {
      await leaveGuild(g.id);
      await load();
    } catch (e) {
      Alert.alert("Не получилось", e instanceof Error ? e.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  const myGuild = items.find((g) => g.isMine);

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
        <Text className="text-white text-2xl font-bold flex-1">Гильдии</Text>
        {!myGuild && (
          <Pressable onPress={() => setShowCreate(true)} className="px-3 py-2 rounded-2xl flex-row items-center gap-1"
            style={{ backgroundColor: "rgba(0,255,136,0.18)", borderWidth: 1, borderColor: "rgba(0,255,136,0.4)" }}>
            <Plus size={16} color="#00ff88" />
            <Text style={{ color: "#00ff88", fontWeight: "600", fontSize: 13 }}>Создать</Text>
          </Pressable>
        )}
      </View>

      {showCreate && !myGuild && (
        <View className="px-4 mb-3">
          <GlassCard padding={16}>
            <Text className="text-white font-semibold mb-2">Новая гильдия</Text>
            <TextInput
              placeholder="Название"
              placeholderTextColor="#71717a"
              value={name}
              onChangeText={setName}
              maxLength={40}
              style={{ color: "#fff", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.10)" }}
            />
            <TextInput
              placeholder="Тег (например RUN)"
              placeholderTextColor="#71717a"
              value={tag}
              onChangeText={(v) => setTag(v.toUpperCase())}
              autoCapitalize="characters"
              maxLength={8}
              style={{ color: "#fff", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.10)" }}
            />
            <View className="flex-row gap-2 mt-4">
              <Pressable onPress={() => setShowCreate(false)} className="flex-1 py-3 rounded-2xl items-center"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
                <Text className="text-subtle">Отмена</Text>
              </Pressable>
              <Pressable onPress={onCreate} disabled={busy} className="flex-1">
                <LinearGradient colors={["#00ff88", "#00cc6f"]} style={{ borderRadius: 14, paddingVertical: 12, alignItems: "center", opacity: busy ? 0.6 : 1 }}>
                  <Text style={{ color: "#000", fontWeight: "700" }}>{busy ? "..." : "Создать"}</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </GlassCard>
        </View>
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#00ff88" />}
      >
        {loading ? (
          <SkeletonRow count={5} height={68} />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Users size={32} color="#a1a1aa" />}
            title="Пока ни одной гильдии"
            subtitle={me?.factionId ? "Создай первую — она будет в твоей фракции." : "Сначала выбери фракцию в профиле."}
          />
        ) : (
          items.map((g) => (
            <GlassCard key={g.id} padding={14} borderColor={g.isMine ? `${g.factionColor}80` : `${g.factionColor}30`}>
              <View className="flex-row items-center gap-3">
                <View
                  style={{
                    width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center",
                    backgroundColor: `${g.factionColor}26`, borderWidth: 2, borderColor: g.factionColor,
                  }}
                >
                  <Text style={{ color: g.factionColor, fontWeight: "700", fontSize: 11 }}>{g.tag}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-semibold">{g.name}</Text>
                    {g.isMine && <Crown size={14} color="#ffd700" />}
                  </View>
                  <Text className="text-subtle text-xs">{g.factionName} · уровень {g.level} · {g.memberCount} чел</Text>
                </View>
                {g.isMine ? (
                  <Pressable onPress={() => onLeave(g)} disabled={busy} className="px-3 py-2 rounded-xl"
                    style={{ backgroundColor: "rgba(239,68,68,0.18)" }}>
                    <Text style={{ color: "#ef4444", fontWeight: "600", fontSize: 12 }}>Покинуть</Text>
                  </Pressable>
                ) : !myGuild ? (
                  <Pressable onPress={() => onJoin(g)} disabled={busy} className="px-3 py-2 rounded-xl"
                    style={{ backgroundColor: "rgba(0,255,136,0.18)" }}>
                    <Text style={{ color: "#00ff88", fontWeight: "600", fontSize: 12 }}>Вступить</Text>
                  </Pressable>
                ) : null}
              </View>
            </GlassCard>
          ))
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
