import { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  Easing,
  runOnJS,
} from "react-native-reanimated";

interface Props {
  count: number;
  onDone: () => void;
}

/**
 * Полноэкранный flash при захвате улицы. Использует Reanimated 3.
 * Пульсация + радиальное расширение + scale число.
 */
export function CaptureFlash({ count, onDone }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);
  const ringScale = useSharedValue(0);
  const ringOpacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 180 }),
      withTiming(1, { duration: 1400 }),
      withTiming(0, { duration: 250 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
    scale.value = withSequence(
      withTiming(1.08, { duration: 320, easing: Easing.out(Easing.exp) }),
      withTiming(1, { duration: 180 }),
    );
    ringScale.value = withRepeat(
      withSequence(
        withTiming(2.6, { duration: 1100, easing: Easing.out(Easing.exp) }),
        withTiming(0, { duration: 0 }),
      ),
      2,
      false,
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 0 }),
        withTiming(0, { duration: 1100 }),
      ),
      2,
      false,
    );
  }, [opacity, scale, ringScale, ringOpacity, onDone]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const numberStyle  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle    = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="none">
      <Animated.View style={[styles.ring, ringStyle]} />
      <Animated.View style={numberStyle}>
        <Text style={styles.title}>+{count}</Text>
        <Text style={styles.subtitle}>{count === 1 ? "улица захвачена" : "улиц захвачено"}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  ring: {
    position: "absolute",
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 4, borderColor: "#00ff88",
  },
  title: {
    color: "#00ff88",
    fontSize: 96,
    fontWeight: "800",
    textAlign: "center",
    textShadowColor: "rgba(0,255,136,0.7)",
    textShadowRadius: 28,
  },
  subtitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    letterSpacing: 2,
    textTransform: "uppercase",
    opacity: 0.85,
  },
});
