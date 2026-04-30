import { useEffect } from "react";
import { Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from "react-native-reanimated";

interface Props {
  amount: number;
  onDone: () => void;
}

/**
 * Floats a "+0.50" gold number upward and fades. 1.5 s.
 */
export function CoinPop({ amount, onDone }: Props) {
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.7);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 200 }),
      withTiming(1, { duration: 800 }),
      withTiming(0, { duration: 350 }, (finished) => {
        if (finished) runOnJS(onDone)();
      }),
    );
    ty.value = withTiming(-60, { duration: 1350, easing: Easing.out(Easing.quad) });
    scale.value = withSequence(
      withTiming(1.15, { duration: 240, easing: Easing.out(Easing.exp) }),
      withTiming(1, { duration: 200 }),
    );
  }, [ty, opacity, scale, onDone]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          left: 0, right: 0, bottom: 80,
          alignItems: "center",
        },
        style,
      ]}
    >
      <Text style={{
        color: "#ffd700",
        fontSize: 28,
        fontWeight: "800",
        textShadowColor: "rgba(255,215,0,0.7)",
        textShadowRadius: 20,
      }}>
        +{amount.toFixed(2)} RUN
      </Text>
    </Animated.View>
  );
}
