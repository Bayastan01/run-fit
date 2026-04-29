import { useEffect, useState } from "react";
import * as Location from "expo-location";

export interface UserCoord {
  lat: number;
  lng: number;
  accuracyM: number | null;
  /** Источник: cache / live GPS update. */
  source: "last-known" | "watch";
  ts: number;
}

export interface UserLocationState {
  coord: UserCoord | null;
  /** "denied" | "permission" | "fetch" | "unavailable" — для UI-сообщения. */
  error: string | null;
  granted: boolean | null;
}

/**
 * Запрашивает foreground-разрешение, выдаёт last-known сразу,
 * затем подписывается на watchPositionAsync (1 сек / 5 м).
 *
 * Не требует always/background — этого хватит для центрирования карты
 * и подсветки текущего местоположения. Background-трекинг включается
 * отдельно при старте пробежки.
 */
export function useUserLocation(): UserLocationState {
  const [coord, setCoord] = useState<UserCoord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [granted, setGranted] = useState<boolean | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;

    (async () => {
      try {
        const services = await Location.hasServicesEnabledAsync();
        if (!services) {
          setError("unavailable");
          setGranted(false);
          return;
        }

        const perm = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;

        if (perm.status !== "granted") {
          setError("permission");
          setGranted(false);
          return;
        }
        setGranted(true);

        const last = await Location.getLastKnownPositionAsync({
          maxAge: 60_000,
          requiredAccuracy: 100,
        });
        if (!cancelled && last) {
          setCoord({
            lat: last.coords.latitude,
            lng: last.coords.longitude,
            accuracyM: last.coords.accuracy ?? null,
            source: "last-known",
            ts: last.timestamp ?? Date.now(),
          });
        }

        sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            timeInterval: 1000,
            distanceInterval: 1,
          },
          (loc) => {
            if (cancelled) return;
            setCoord({
              lat: loc.coords.latitude,
              lng: loc.coords.longitude,
              accuracyM: loc.coords.accuracy ?? null,
              source: "watch",
              ts: loc.timestamp ?? Date.now(),
            });
          },
        );
      } catch (e) {
        setError("fetch");
        console.warn("[useUserLocation]", e);
      }
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  return { coord, error, granted };
}
