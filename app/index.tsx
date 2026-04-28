import { Redirect } from "expo-router";
import { useAuth } from "@/stores/auth";

export default function Entry() {
  const user = useAuth((s) => s.user);
  if (!user) return <Redirect href="/(auth)/login" />;
  if (!user.factionId) return <Redirect href="/(onboarding)/welcome" />;
  return <Redirect href="/(tabs)/map" />;
}
