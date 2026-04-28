# План: трекинг бега, обнаружение активности, anti-cheat

Цель: засчитывать игроку только **реальный бег**. Ходьба — серая зона (опц. ½ XP), стоит — пауза, транспорт (машина/самокат) — не засчитываем + suspect-флаг.

## Что считаем сигналами

| Сигнал | Источник | Зачем |
|---|---|---|
| GPS-точки (lat, lng, accuracy, speed, ts) | `expo-location` | Базовый трек, скорость, дистанция |
| Шаги (cadence — шагов/мин) | `expo-sensors` `Pedometer` | Главный отличитель **бег/ходьба vs транспорт** |
| Акселерометр (вибрация при шагах) | `expo-sensors` `Accelerometer` | Подтверждение шагов когда Pedometer молчит |
| Native Activity Recognition (running/walking/driving) | `CMMotionActivityManager` (iOS) / Google `ActivityRecognitionClient` (Android) | Топ-уровень классификация системы. Требует dev-client. |
| Map-match на улицы OSM | Valhalla на бэке | Проверка что бегун по дорогам, не «телепорт» |
| Серверная скорость / прыжки | бэк | Финальный gate |

---

## Heuristic state machine (клиент)

Окно усреднения **20 сек**, обновление **раз в секунду**. Состояния:

| State | speed (м/с) | cadence (шагов/мин) | Зачёт игре |
|---|---|---|---|
| `STILL` | < 0.4 | < 10 | пауза |
| `WALKING` | 0.4 – 2.2 | 60 – 130 | опц. ½ |
| `RUNNING` | 2.2 – 7.0 | 130 – 220 | ✅ полный |
| `FAST_RUN` | 7.0 – 9.0 | 160 – 240 | ✅ полный |
| `SUSPECT_VEHICLE` | > 7.0 | < 60 | ❌ + flag |
| `VEHICLE` | > 9.0 | < 30 (или 0) | ❌ + flag |
| `BIKE` (опц.) | 4 – 12 | < 30 | ⚠️ помечаем как cycling |

Также:
- Если `accuracy > 30 m` 3+ точки подряд → `LOW_GPS` → ставим run на pause-tracking, метрики не растут.
- Если **прыжок** (расстояние > 50 м между точками за < 1 с) → точку отбросить + `suspectScore += 25`.
- Если в окне 30 сек: `RUNNING` подтверждено → разблокируем «захват улиц». Иначе захват замораживается.

---

## Что записываем в каждой точке

```ts
interface RunPoint {
  ts: number;         // ms epoch
  lat: number;
  lng: number;
  accuracyM: number;  // GPS HDOP
  speedMps: number;   // GPS-derived
  altitude?: number;
  cadence: number | null;     // шагов/мин (от Pedometer за окно)
  steps:   number | null;     // delta шагов с прошлой точки
  activity: "still" | "walking" | "running" | "fast_run" | "vehicle" | "suspect_vehicle" | "bike" | "low_gps";
  source:  "fg" | "bg";       // foreground / background задача
}
```

**Частота записи:** GPS — раз в **1 сек** или каждые **5 м** (что наступит раньше).
**Частота отправки на бэк:** батч **раз в 15 сек** (10–20 точек на батч), чтобы экономить трафик и батарею.
**Оффлайн:** буфер в MMKV; при появлении сети — flush с retry-backoff (2s, 5s, 15s, 60s).

---

## Серверная сторона (anti-cheat layer 2)

После `finalizeRun` BullMQ-job выполняет:

1. **Reject malformed points**: `accuracy > 50` или `speed > 15 м/с` → drop.
2. **Speed validation**: пересчёт скорости между принятыми точками. Если > 8 м/с подряд > 30 сек → run = `INVALID`.
3. **Map-matching (Valhalla `trace_attributes`)**: % точек смэтчилось на пешеходные ребра. Если < 60% → `INVALID`.
4. **Cadence sanity** (если клиент прислал): средняя cadence < 90 при заявленном `RUNNING` → подозрительно.
5. **Suspect scoring**: накапливаем `suspectScore` → > 50 = manual review, > 80 = auto-INVALID.
6. **Duplicate-track detection**: cosine-similarity нового трека к последним 10 → защита от replay.

---

## ПРИОРИТЕТЫ (что делаем в каком порядке)

### 🟢 P1 — В Expo Go, без dev-client (СЕЙЧАС)

Цель: видеть на экране Active Run **что я делаю прямо сейчас** — бегу/иду/стою/еду.

1. Установить `expo-sensors` (Pedometer + Accelerometer). ← следующий шаг
2. Хук `useStepCounter` — реал-тайм cadence (шагов/мин за 20 сек).
3. Хук `useActivityClassifier(speed, cadence)` — state-машина.
4. Active Run экран: badge со статусом (`Беги` / `Идёшь` / `Стоишь` / `Транспорт?`) + цвет.
5. Live-метрики: реальные `distance` и `pace` из GPS (вместо мок-инкрементов).
6. Если `VEHICLE` / `SUSPECT_VEHICLE` 5 секунд подряд → серый индикатор + текст «Бег не засчитывается».

**Ограничение Expo Go:** GPS работает только когда экран открыт. Если заблокировать — точки перестанут приходить. Для теста подойдёт.

### 🟡 P2 — Требует dev-client (`pnpm prebuild && pnpm ios`/`android`)

Цель: трекать когда экран заблокирован.

7. `expo-task-manager` background location task.
8. Foreground service на Android (persistent notification «Run-Fit отслеживает пробежку»).
9. iOS `UIBackgroundModes: location` (уже в `app.json`).
10. MMKV-буфер точек (`react-native-mmkv` уже в deps, но требует dev-client).
11. Батч-отправка точек на `/api/runs/:id/points` с retry / offline-queue.
12. Восстановление активной пробежки после рестарта приложения.

### 🔵 P3 — Бэкенд готов

13. POST принимает массив с `activity` и `cadence`.
14. На finalize запускается BullMQ-job `validateRun` (P1 и P2 серверной валидации выше).
15. UI Run Summary показывает: `INVALID` → причина (mock/spoof/vehicle).
16. Сохранение `AntiCheatEvent` в БД для манул-ревью.

### 🟣 P4 — Native Activity Recognition (точнее)

17. Android: `com.google.android.gms.location.ActivityRecognitionClient` через нативный модуль (или `react-native-activity-recognition`).
18. iOS: `CMMotionActivityManager` через нативный модуль (`expo-motion-activity` плагин или сами через Expo Modules).
19. Permission `ACTIVITY_RECOGNITION` (Android 10+), `NSMotionUsageDescription` (iOS — уже в `app.json`).
20. Гибрид: native activity + наша эвристика → финальный класс.

### 🔴 P5 — ML / расширенное

21. Локальная ML-модель (TensorFlow Lite) на акселерометре — детектит даже cycling.
22. Server-side cluster-detection: одинаковый трек с разных устройств = collusion.
23. Heatmap «нормальных» маршрутов района → точки выбивающиеся слишком далеко = suspect.

---

## Что доступно в Expo Go (важно знать ограничения)

| Возможность | Expo Go | Dev-client |
|---|---|---|
| Foreground GPS | ✅ | ✅ |
| Background GPS (экран заблокирован) | ❌ | ✅ |
| Pedometer (шаги в реал-тайме) | ✅ | ✅ |
| Accelerometer | ✅ | ✅ |
| MMKV (быстрый буфер) | ❌ (нужно AsyncStorage fallback) | ✅ |
| Foreground service Android | ❌ | ✅ |
| Native Activity Recognition | ❌ | ✅ + нативный модуль |
| react-native-maps | ❌ | ✅ |

Поэтому **сейчас P1**, потом prebuild → **P2/P4**.

---

## Связь с дорожной картой проекта

| Этап мобилки в `PLAN.md` | Какой пункт активности |
|---|---|
| M2 (Active Run) — fg-трекинг | P1 |
| M2 финал — bg-трекинг | P2 |
| M3 (захват улиц) — server-side | P3 + Valhalla |
| M5 (PvP) — анти-чит критичен | P4, P5 |
