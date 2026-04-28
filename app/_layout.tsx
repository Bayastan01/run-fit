import "../global.css";
import "react-native-reanimated";

import { Stack } from "expo-router";
import { AppProviders } from "@/providers/AppProviders";

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#0B0E14" },
        }}
      />
    </AppProviders>
  );
}
