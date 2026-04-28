import { Pressable, Text, ActivityIndicator, View, type PressableProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

type Variant = "primary" | "ghost" | "danger" | "gold";

interface ButtonProps extends Omit<PressableProps, "children"> {
  label: string;
  variant?: Variant;
  loading?: boolean;
}

const GRADIENTS: Record<Variant, [string, string]> = {
  primary: ["#00ff88", "#00cc6f"],
  danger:  ["#ef4444", "#dc2626"],
  gold:    ["#ffd700", "#ffa500"],
  ghost:   ["transparent", "transparent"],
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: "#000000",
  danger:  "#ffffff",
  gold:    "#000000",
  ghost:   "#ffffff",
};

export function Button({ label, variant = "primary", loading, disabled, ...rest }: ButtonProps) {
  const isDisabled = disabled || loading;
  const colors = GRADIENTS[variant];
  const textColor = TEXT_COLOR[variant];

  if (variant === "ghost") {
    return (
      <Pressable
        {...rest}
        disabled={isDisabled}
        className={`rounded-2xl px-6 py-4 items-center justify-center bg-input border border-border ${isDisabled ? "opacity-60" : ""}`}
      >
        {loading
          ? <ActivityIndicator color="#ffffff" />
          : <Text className="text-white font-semibold text-base">{label}</Text>}
      </Pressable>
    );
  }

  return (
    <Pressable {...rest} disabled={isDisabled} style={{ opacity: isDisabled ? 0.6 : 1 }}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 18, paddingVertical: 16, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" }}
      >
        {loading
          ? <ActivityIndicator color={textColor} />
          : <Text style={{ color: textColor, fontWeight: "600", fontSize: 16 }}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

interface IconButtonProps {
  icon: React.ReactNode;
  onPress?: () => void;
  size?: number;
  variant?: "glass" | "neon" | "purple";
}

export function IconButton({ icon, onPress, size = 56, variant = "glass" }: IconButtonProps) {
  const bg =
    variant === "neon"   ? "rgba(0,255,136,0.18)"   :
    variant === "purple" ? "rgba(139,92,246,0.18)" :
    "rgba(10,10,10,0.8)";
  const border =
    variant === "neon"   ? "rgba(0,255,136,0.5)"  :
    variant === "purple" ? "rgba(139,92,246,0.5)" :
    "rgba(255,255,255,0.15)";
  return (
    <Pressable onPress={onPress}>
      <View
        style={{
          width: size, height: size,
          borderRadius: size / 2,
          backgroundColor: bg, borderWidth: 1, borderColor: border,
          alignItems: "center", justifyContent: "center",
        }}
      >
        {icon}
      </View>
    </Pressable>
  );
}
