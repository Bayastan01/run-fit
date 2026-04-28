# run-fit-mobile

Expo + React Native + TypeScript client for the Run-Fit fitness game (INTVL-style: claim OSM streets by running over them).

Companion backend: [run-fit-api](../run-fit-api).

## Stack

- **Expo SDK 54** + **React Native 0.81** + **Expo Router 6** (file-based)
- **NativeWind v4** (Tailwind for RN)
- **Zustand** (UI/local state) + **TanStack Query** (server state)
- **MMKV** (fast KV — points buffer, settings) + **expo-secure-store** (tokens)
- **expo-location** + **expo-task-manager** (background GPS — free path; can swap to `react-native-background-geolocation` if iOS reliability is insufficient)
- **MapLibre Native** (`@maplibre/maplibre-react-native`) — vector tiles from our Martin tile server
- **pusher-js** → Soketi (realtime: territory updates, guild chat, battles)
- **ky** (HTTP) with auto-bearer + 401-on-401 token clear
- **expo-notifications** (Expo Push)
- **Sentry** for errors

## Important: Expo Go vs Dev Client

This app uses native modules (`react-native-mmkv`, `@maplibre/maplibre-react-native`, background `expo-location`, etc.) that **don't run in Expo Go**. You must use a **dev-client build** (or run on a simulator with `expo run:ios` / `run:android`).

## Local development

### Prerequisites

- Node 20+, pnpm 8+
- Xcode (for iOS) — Xcode 15+ for SDK 54
- Android Studio (for Android) with NDK
- A running [`run-fit-api`](../run-fit-api) at `http://localhost:3000`

### First-time setup

```bash
pnpm install

cp .env.example .env
# point EXPO_PUBLIC_API_URL to your local backend (use your Mac's LAN IP for physical devices)

# generate native ios/ and android/ folders
pnpm prebuild
```

### Run on simulator/device

```bash
# iOS simulator
pnpm ios

# Android emulator
pnpm android

# Or launch dev server, then build dev-client via EAS
pnpm start
```

### Run on physical device

1. Build dev-client: `eas build --profile development --platform ios` (or android)
2. Install on device
3. Set `EXPO_PUBLIC_API_URL=http://<your-LAN-IP>:3000` in `.env`
4. `pnpm start` and scan QR

## Project layout

```
app/                       # Expo Router file-based routing
  _layout.tsx              # Root: providers, auth bootstrap
  index.tsx                # Entry: redirects based on auth/onboarding state
  (auth)/                  # login, register
  (onboarding)/            # welcome, permissions, faction
  (tabs)/                  # map, run, stats, profile
  run-active.tsx           # Active run full-screen

src/
  api/                     # ky client + typed endpoints (auth, runs)
  components/              # NativeWind UI primitives
  features/                # tracking (background GPS), map, realtime — added in M2/M3
  lib/                     # env, secure store, MMKV
  providers/               # AppProviders (Query, SafeArea, AuthBootstrap)
  stores/                  # Zustand (auth, activeRun)

global.css                 # Tailwind directives (consumed by NativeWind metro plugin)
tailwind.config.js
metro.config.js            # withNativeWind wrapper
babel.config.js            # nativewind/babel + jsxImportSource
```

## Permissions (already in app.json)

- iOS: `NSLocationWhenInUseUsageDescription`, `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSMotionUsageDescription`, `UIBackgroundModes: location/fetch/remote-notification`
- Android: `ACCESS_FINE_LOCATION`, `ACCESS_BACKGROUND_LOCATION`, `FOREGROUND_SERVICE_LOCATION` (Android 14+), `POST_NOTIFICATIONS` (13+), `ACTIVITY_RECOGNITION`

The onboarding `permissions` screen requests them with an explainer first.

## Roadmap

See [eventual-pondering-parrot.md](../../.claude/plans/eventual-pondering-parrot.md) for the full M0–M6 plan.

Currently scaffolded: **M0 + M1 (auth + onboarding) + M2 plumbing (run start/active/finish wired to backend, GPS task to be implemented).**
# run-fit
