/**
 * Background GPS via expo-task-manager + foreground service notification.
 *
 * В Expo Go startLocationUpdatesAsync с foregroundService не поддерживается;
 * все функции обёрнуты в try/catch — UI продолжает работать на foreground GPS.
 */
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { pointBuffer } from "./pointBuffer";

export const BACKGROUND_LOCATION_TASK = "run-fit-background-location";

interface TaskData {
  locations?: Location.LocationObject[];
}

try {
  TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
    if (error) return;
    const { locations } = (data ?? {}) as TaskData;
    if (!locations || locations.length === 0) return;

    for (const loc of locations) {
      const { latitude, longitude, accuracy, speed, altitude } = loc.coords;
      pointBuffer.push({
        ts: loc.timestamp ?? Date.now(),
        lat: latitude,
        lng: longitude,
        accuracyM: accuracy ?? null,
        speedMps: Math.max(0, speed ?? 0),
        altitude: altitude ?? null,
      });
    }
    await pointBuffer.flush();
  });
} catch {
  // TaskManager unavailable in Expo Go — silently degrade.
}

export async function startBackgroundLocation(runId: string): Promise<boolean> {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== "granted") return false;

    const bg = await Location.requestBackgroundPermissionsAsync().catch(() => ({ status: "denied" as const }));
    pointBuffer.attachRun(runId);

    if (bg.status !== "granted") {
      // Foreground-only buffer: still works, just no foreground service.
      return false;
    }

    const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
    if (isRunning) return true;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 2000,
      distanceInterval: 5,
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
      activityType: Location.ActivityType.Fitness,
      foregroundService: {
        notificationTitle: "Run-Fit отслеживает пробежку",
        notificationBody: "GPS работает в фоне. Тапни, чтобы вернуться.",
        notificationColor: "#00ff88",
      },
    });
    return true;
  } catch {
    return false;
  }
}

export async function stopBackgroundLocation(): Promise<void> {
  try {
    const isRunning = await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK).catch(() => false);
    if (isRunning) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }
  } catch {}
  pointBuffer.detachRun();
}
