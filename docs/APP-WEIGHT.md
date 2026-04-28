# Размер приложения — отчёт

Замерено: 2026-04-26.

## Общая картина

| Что | Размер | Комментарий |
|---|---|---|
| Исходный код (`app/` + `src/`) | **180 KB** (2 762 строк, 33 файла) | Реальный наш код |
| Ассеты (`assets/images/`) | **560 KB** | 11 PNG, иконки app + splash |
| `node_modules` | **617 MB** | Только dev — в APK/IPA не попадает |
| Документация (`docs/`) | 12 KB | Планы и отчёты |
| **Весь репо** | **619 MB** | Из них 99% — node_modules |

## Прогноз размера установленного приложения

> APK/IPA создаётся через `eas build`. Без билда дать точный размер нельзя, но можно оценить по нативным модулям и шаблонам Expo SDK 54.

| Платформа | Прогноз | Из чего складывается |
|---|---|---|
| **Android APK (release, single-arch)** | ~35–45 MB | RN + Hermes + native modules ниже |
| **Android APK (universal)** | ~70–90 MB | Все архитектуры (arm64, armv7, x86_64) |
| **Android AAB (Play Store)** | загрузка ~25 MB · установка ~40 MB | Play раздаёт per-arch |
| **iOS IPA** | ~50–70 MB | + LLVM bitcode, без покрытия CarPlay/Watch |

Это ниже среднего для современного RN-приложения с картой и сенсорами. **OK для релиза.**

## Top-15 пакетов в node_modules (dev-only)

| Размер | Пакет | Зачем |
|---|---|---|
| 83 MB | `react-native` | Сам RN (включая Android/iOS sources, JNI, prebuilt artefacts) |
| 47 MB | `@expo/*` | Expo CLI, dev-launcher, modules |
| 42 MB | `@sentry/*` | Sentry SDK + CLI tools (CLI выпиливается из app bundle) |
| 37 MB | `lucide-react-native` | **⚠️ tree-shaking важен** — по-умолчанию кладёт все 1000+ иконок |
| 31 MB | `date-fns` | **⚠️** имеем большой полный набор локалей |
| 23 MB | `typescript` | dev only |
| 21 MB | `@react-native/*` | внутренние гайды/codegen RN |
| 19 MB | `expo` | runtime + tools |
| 16 MB | `react-devtools-core` | dev only |
| 15 MB | `@babel/*` | Metro/Babel transforms (dev) |
| 12 MB | `react-native-css-interop` | NativeWind v4 runtime |
| 10 MB | `lightningcss-darwin-x64` | NativeWind PostCSS replacement |
| 10 MB | `expo-dev-launcher` | dev-client only |
| 8.8 MB | `react-native-reanimated` | анимации, native |
| 7.7 MB | `tailwindcss` | dev only |

## Нативные модули, которые реально попадут в app bundle

| Модуль | Размер деп | В bundle (примерно) | Назначение |
|---|---|---|---|
| `react-native` + Hermes | базовый | ~15 MB JS engine + RN core | каркас |
| `expo` (runtime) | 19 MB | ~3 MB native | Expo runtime |
| `expo-router` | 6.1 MB | ~1 MB JS | роутинг |
| `react-native-reanimated` | 8.8 MB | ~2 MB native + worklet runtime | анимации |
| `react-native-screens` | 5.6 MB | ~1 MB native | UI navigation |
| `react-native-gesture-handler` | 6.5 MB | ~1 MB native | жесты |
| `react-native-svg` | 7.6 MB | ~1.5 MB native | SVG (используется в TerritoryMap fallback) |
| `react-native-webview` | 992 KB | ~0.5 MB native (WKWebView/Chromium WebView уже в OS) | Leaflet карта в Expo Go |
| `react-native-maps` | 2.8 MB | ~1 MB native | реальные карты в dev-client |
| `@maplibre/maplibre-react-native` | 3.5 MB | ~6 MB native (MapLibre engine) | будущий MVT-рендер своих тайлов |
| `react-native-mmkv` | 1.3 MB | ~300 KB native | KV-storage (быстрее AsyncStorage) |
| `expo-location` | 932 KB | ~200 KB native | GPS + background |
| `expo-notifications` | 11 MB | ~1.5 MB native | push (включая FCM/APNs шим) |
| `expo-sensors` | 1 MB | ~200 KB native | Pedometer / Accelerometer |
| `lucide-react-native` | 37 MB | ~150–300 KB JS (после tree-shake конкретных импортов) | иконки |
| `date-fns` | 31 MB | ~50 KB JS (если не тащить локали) | даты |
| `nativewind` + `tailwindcss` | 7.7 MB | ~50 KB JS runtime | стили |
| `@tanstack/react-query` | ~1 MB | ~30 KB JS | server state |
| `zustand` | ~50 KB | ~10 KB JS | UI state |
| `ky` | ~80 KB | ~15 KB JS | HTTP client |
| `pusher-js` | ~600 KB | ~70 KB JS | WebSocket для Soketi |

## Заметки про оптимизацию (на потом)

1. **lucide-react-native** — самый большой потенциал экономии. Импорты вида `import { MapPin, Play } from "lucide-react-native"` уже tree-shake'ятся Metro в production-режиме. В dev-bundle всё равно тянется всё. Не критично.
2. **date-fns** — импорти узко: `import { formatDistanceToNow } from "date-fns"` (мы пока им не пользуемся вообще — можно удалить, если не понадобится).
3. **`@maplibre/maplibre-react-native` vs `react-native-maps`** — оба установлены, для финала выберем один. MapLibre тяжелее на 5 MB, но даёт нашу собственную раскраску улиц через Martin MVT.
4. **Hermes**: в Expo SDK 54 включён по-умолчанию — даёт меньший JS bundle и быстрый старт.
5. **R8/ProGuard** на Android — Expo prebuild включает по-умолчанию для release.
6. **App icon `icon.png` 393 KB** — крупновато, можно ужать до ~50 KB через TinyPNG. Splash `17 KB` — норм.

## Прогноз скорости старта

- Cold start: 1.2–1.8 сек на современном устройстве (Hermes + RAM bundle).
- Warm start: ~400 мс.
- Первый рендер карты (Leaflet WebView): +500–800 мс на загрузку HTML и тайлов CARTO.

## Связь с PLAN.md

После dev-client билда (`pnpm prebuild`) можно будет **точно** замерить APK/IPA:

```bash
pnpm prebuild
cd android && ./gradlew assembleRelease   # или EAS Build
ls -lh app/build/outputs/apk/release/
```

Это запланировано на следующем этапе.
