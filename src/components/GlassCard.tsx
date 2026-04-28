import type { ReactNode } from "react";
import { View, type ViewStyle } from "react-native";

interface GlassCardProps {
  children: ReactNode;
  borderColor?: string;
  glow?: string;
  style?: ViewStyle;
  padding?: number;
}

export function GlassCard({
  children,
  borderColor = "rgba(255,255,255,0.10)",
  glow,
  style,
  padding = 20,
}: GlassCardProps) {
  return (
    <View
      style={[
        {
          backgroundColor: "rgba(10,10,10,0.85)",
          borderWidth: 1,
          borderColor,
          borderRadius: 24,
          padding,
          shadowColor: glow ?? "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: glow ? 0.6 : 0.3,
          shadowRadius: glow ? 24 : 12,
          elevation: 8,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
