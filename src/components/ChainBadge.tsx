import { useEffect, useRef } from "react";
import { Animated, Easing, View, Text } from "react-native";

interface ChainBadgeProps {
  current: number;
  multiplier: number;
  pulseAge: number;
  pulseMs: number;
  color?: string;
}

/**
 * Visual ring filling each `pulseMs`. When chain ticks (pulseAge resets to 0),
 * the inner number scales up briefly. Conveys interval rhythm.
 */
export function ChainBadge({ current, multiplier, pulseAge, pulseMs, color = "#00ff88" }: ChainBadgeProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevCurrent = useRef(current);

  useEffect(() => {
    if (current > prevCurrent.current) {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.35, duration: 150, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.0,  duration: 250, easing: Easing.in(Easing.cubic),  useNativeDriver: true }),
      ]).start();
    }
    prevCurrent.current = current;
  }, [current, scale]);

  const progress = Math.min(1, pulseAge / pulseMs);
  const ringSize = 88;
  const strokeWidth = 4;
  const radius = (ringSize - strokeWidth) / 2;

  // Approximate ring with rotated arc: we use a single View with conic-style border via two halves.
  // Simpler: outer dim ring + inner glow opacity tied to progress.
  return (
    <View style={{ width: ringSize, height: ringSize, alignItems: "center", justifyContent: "center" }}>
      {/* outer ring */}
      <View
        style={{
          position: "absolute",
          width: ringSize, height: ringSize, borderRadius: ringSize / 2,
          borderWidth: strokeWidth, borderColor: `${color}33`,
        }}
      />
      {/* glow scaled by progress */}
      <View
        style={{
          position: "absolute",
          width: ringSize * (0.6 + progress * 0.4),
          height: ringSize * (0.6 + progress * 0.4),
          borderRadius: ringSize / 2,
          backgroundColor: `${color}22`,
          opacity: 0.5 + progress * 0.5,
        }}
      />
      <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
        <Text style={{ color, fontSize: 28, fontWeight: "700", lineHeight: 30 }}>×{multiplier.toFixed(1)}</Text>
        <Text style={{ color: "#a1a1aa", fontSize: 10, fontWeight: "600", letterSpacing: 1 }}>
          ЦЕПЬ {current}
        </Text>
      </Animated.View>
    </View>
  );
}
