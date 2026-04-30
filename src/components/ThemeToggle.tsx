import { Pressable, View, Text } from "react-native";
import { Sun, Moon } from "lucide-react-native";
import { useTheme } from "@/stores/theme";

interface Props {
  /** Compact icon-only floating button (size = 48). */
  compact?: boolean;
}

/**
 * Day/night switch. Persists via AsyncStorage and instantly retiles
 * any open WebView map (TerritoryMap, RunMap, Heatmap).
 */
export function ThemeToggle({ compact = true }: Props) {
  const mode = useTheme((s) => s.mode);
  const toggle = useTheme((s) => s.toggle);
  const isDark = mode === "dark";

  if (compact) {
    return (
      <Pressable
        onPress={toggle}
        style={{
          width: 48, height: 48, borderRadius: 24,
          alignItems: "center", justifyContent: "center",
          backgroundColor: "rgba(10,10,10,0.85)",
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,215,0,0.35)" : "rgba(6,182,212,0.35)",
        }}
        accessibilityLabel={isDark ? "Включить дневной режим" : "Включить ночной режим"}
        accessibilityRole="button"
      >
        {isDark
          ? <Sun size={22} color="#ffd700" />
          : <Moon size={22} color="#06b6d4" />}
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={toggle}
      style={{
        flexDirection: "row", alignItems: "center", gap: 8,
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1, borderColor: "rgba(255,255,255,0.10)",
      }}
    >
      {isDark
        ? <Sun size={16} color="#ffd700" />
        : <Moon size={16} color="#06b6d4" />}
      <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
        {isDark ? "День" : "Ночь"}
      </Text>
      <View style={{
        width: 28, height: 16, borderRadius: 8,
        backgroundColor: isDark ? "rgba(255,215,0,0.30)" : "rgba(6,182,212,0.30)",
        justifyContent: "center", paddingHorizontal: 2,
        alignItems: isDark ? "flex-end" : "flex-start",
      }}>
        <View style={{
          width: 12, height: 12, borderRadius: 6,
          backgroundColor: isDark ? "#ffd700" : "#06b6d4",
        }} />
      </View>
    </Pressable>
  );
}
