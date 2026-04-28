import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import { fetchMe } from "@/api/auth";
import { ApiError } from "@/api/client";
import { loadToken } from "@/lib/secure";
import { initSentry, setSentryUser } from "@/lib/sentry";
import { useAuth } from "@/stores/auth";
import { useStreak } from "@/stores/streak";
import { useQuest } from "@/stores/quest";
import { usePrivacy } from "@/stores/privacy";

initSentry();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (count, error) => {
        if (error instanceof ApiError && error.status === 401) return false;
        return count < 2;
      },
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthBootstrap({ children }: { children: ReactNode }) {
  const setUser = useAuth((s) => s.setUser);
  const hydrateStreak  = useStreak((s) => s.hydrate);
  const hydrateQuest   = useQuest((s) => s.hydrate);
  const hydratePrivacy = usePrivacy((s) => s.hydrate);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      hydrateStreak();
      hydrateQuest();
      hydratePrivacy();
      const token = await loadToken();
      if (!token) {
        setUser(null);
        setSentryUser(null);
      } else {
        try {
          const user = await fetchMe();
          setUser(user);
          setSentryUser({ id: user.id, email: user.email });
        } catch {
          setUser(null);
          setSentryUser(null);
        }
      }
      setReady(true);
    })();
  }, [setUser, hydrateStreak, hydrateQuest, hydratePrivacy]);

  if (!ready) return null;
  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthBootstrap>{children}</AuthBootstrap>
          <StatusBar style="light" />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
