import { useEffect, useRef } from "react";
import { Animated, Easing, View, Text, Pressable, Modal } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, Share2, ArrowRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface CaptureWowProps {
  visible: boolean;
  onDismiss: () => void;
  streetName?: string;
  earnings?: number;
  xp?: number;
}

/**
 * Fullscreen "WOW" animation when the user captures their first street.
 * Plays once per first-capture event.
 */
export function CaptureWow({ visible, onDismiss, streetName = "Улица свободна", earnings = 0.45, xp = 50 }: CaptureWowProps) {
  const scale = useRef(new Animated.Value(0.5)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sparkleRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.loop(
        Animated.timing(sparkleRotate, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true }),
      ),
    ]).start();
    return () => {
      scale.setValue(0.5);
      opacity.setValue(0);
      sparkleRotate.setValue(0);
    };
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
        <Animated.View
          style={{
            opacity,
            transform: [{ scale }],
            width: "85%",
            maxWidth: 380,
          }}
        >
          <LinearGradient
            colors={["rgba(0,255,136,0.25)", "rgba(6,182,212,0.20)"]}
            style={{
              borderRadius: 32,
              padding: 32,
              borderWidth: 2,
              borderColor: "#00ff88",
              alignItems: "center",
              shadowColor: "#00ff88",
              shadowOpacity: 0.6,
              shadowRadius: 32,
            }}
          >
            <Animated.View
              style={{
                transform: [{
                  rotate: sparkleRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] }),
                }],
              }}
            >
              <Sparkles size={64} color="#00ff88" />
            </Animated.View>

            <Text style={{ color: "#fff", fontSize: 28, fontWeight: "800", marginTop: 16, textAlign: "center" }}>
              Первая территория! 🎯
            </Text>
            <Text style={{ color: "#a1a1aa", fontSize: 14, marginTop: 8, textAlign: "center" }}>
              {streetName} — твоя на 24 часа
            </Text>

            <View
              style={{
                flexDirection: "row",
                gap: 12,
                marginTop: 24,
                width: "100%",
              }}
            >
              <Stat title="ДОХОД / ЧАС" value={`+$${earnings.toFixed(2)}`} color="#ffd700" />
              <Stat title="ОПЫТ" value={`+${xp} XP`} color="#00ff88" />
            </View>

            <Pressable onPress={onDismiss} style={{ marginTop: 28, width: "100%" }}>
              <LinearGradient
                colors={["#00ff88", "#00cc6f"]}
                style={{
                  borderRadius: 18,
                  paddingVertical: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <Text style={{ color: "#000", fontWeight: "800", fontSize: 16 }}>Дальше</Text>
                <ArrowRight size={18} color="#000" />
              </LinearGradient>
            </Pressable>

            <Pressable onPress={onDismiss} style={{ marginTop: 8, flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Share2 size={14} color="#a1a1aa" />
              <Text style={{ color: "#a1a1aa", fontSize: 12 }}>Поделиться</Text>
            </Pressable>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

function Stat({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        borderRadius: 14,
        padding: 12,
        alignItems: "center",
        borderWidth: 1,
        borderColor: `${color}33`,
      }}
    >
      <Text style={{ color: "#71717a", fontSize: 9, letterSpacing: 1, fontWeight: "700" }}>{title}</Text>
      <Text style={{ color, fontSize: 18, fontWeight: "700", marginTop: 4 }}>{value}</Text>
    </View>
  );
}
