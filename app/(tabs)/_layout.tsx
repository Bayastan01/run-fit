import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MapPin, DollarSign, Trophy, User } from "lucide-react-native";

const ACTIVE = "#00ff88";
const INACTIVE = "#71717a";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === "ios" ? 24 : 12);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: {
          position: "absolute",
          left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(10,10,10,0.95)",
          borderTopColor: "rgba(255,255,255,0.10)",
          borderTopWidth: 1,
          height: 60 + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
          paddingHorizontal: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerShown: false,
        sceneStyle: { backgroundColor: "#000000" },
      }}
    >
      <Tabs.Screen
        name="map/index"
        options={{ title: "Карта", tabBarIcon: ({ color, focused }) => <MapPin size={focused ? 24 : 22} color={color} /> }}
      />
      <Tabs.Screen
        name="wallet/index"
        options={{ title: "Кошелёк", tabBarIcon: ({ color, focused }) => <DollarSign size={focused ? 24 : 22} color={color} /> }}
      />
      <Tabs.Screen
        name="events/index"
        options={{ title: "События", tabBarIcon: ({ color, focused }) => <Trophy size={focused ? 24 : 22} color={color} /> }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{ title: "Профиль", tabBarIcon: ({ color, focused }) => <User size={focused ? 24 : 22} color={color} /> }}
      />
    </Tabs>
  );
}
