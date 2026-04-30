import type { ReactNode } from "react";
import { View, Text } from "react-native";

interface Props {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, subtitle, action }: Props) {
  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingVertical: 48 }}>
      {icon && <View style={{ marginBottom: 12, opacity: 0.7 }}>{icon}</View>}
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "600", textAlign: "center" }}>{title}</Text>
      {subtitle && (
        <Text style={{ color: "#a1a1aa", fontSize: 13, textAlign: "center", marginTop: 6, lineHeight: 18 }}>
          {subtitle}
        </Text>
      )}
      {action && <View style={{ marginTop: 18 }}>{action}</View>}
    </View>
  );
}
