export const env = {
  apiUrl:     process.env.EXPO_PUBLIC_API_URL    ?? "http://localhost:3000",
  soketiHost: process.env.EXPO_PUBLIC_SOKETI_HOST ?? "localhost",
  soketiPort: Number(process.env.EXPO_PUBLIC_SOKETI_PORT ?? 6001),
  soketiKey:  process.env.EXPO_PUBLIC_SOKETI_KEY  ?? "run-fit-key",
  tilesUrl:   process.env.EXPO_PUBLIC_TILES_URL   ?? "http://localhost:3001",
  sentryDsn:  process.env.EXPO_PUBLIC_SENTRY_DSN,
};
