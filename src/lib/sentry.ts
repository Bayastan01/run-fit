import * as Sentry from "@sentry/react-native";
import { env } from "./env";

let initialized = false;

export function initSentry(): void {
  if (initialized) return;
  if (!env.sentryDsn) return;

  Sentry.init({
    dsn: env.sentryDsn,
    environment: __DEV__ ? "development" : "production",
    enableAutoSessionTracking: true,
    sessionTrackingIntervalMillis: 30_000,
    tracesSampleRate: __DEV__ ? 1.0 : 0.2,
    attachScreenshot: false,
    attachStacktrace: true,
    enableNative: true,
  });
  initialized = true;
}

export function setSentryUser(user: { id: string; email?: string } | null): void {
  if (!initialized) return;
  if (user) Sentry.setUser({ id: user.id, email: user.email });
  else Sentry.setUser(null);
}

export function captureError(err: unknown, context?: Record<string, unknown>): void {
  if (!initialized) return;
  Sentry.captureException(err, { extra: context });
}
