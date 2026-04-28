import * as Location from "expo-location";

export interface AdaptiveProfile {
  accuracy: Location.Accuracy;
  timeInterval: number;
  distanceInterval: number;
  /** Human label for debug UI. */
  label: string;
}

interface Input {
  speedMps: number;
  /** 0..1 (0.10 = 10%). When null we don't downgrade. */
  batteryFraction: number | null;
  /** ms since user has been classed STILL. */
  stationaryMs: number;
}

/**
 * Returns the best LocationOptions for current state.
 * Power-budget aware: lowers accuracy on low battery / long stationary.
 */
export function chooseGpsProfile({ speedMps, batteryFraction, stationaryMs }: Input): AdaptiveProfile {
  if (batteryFraction != null && batteryFraction < 0.10) {
    return { accuracy: Location.Accuracy.Balanced, timeInterval: 5_000, distanceInterval: 20, label: "low-battery" };
  }
  if (stationaryMs > 120_000) {
    return { accuracy: Location.Accuracy.Low, timeInterval: 15_000, distanceInterval: 30, label: "long-still" };
  }
  if (speedMps < 0.5) {
    return { accuracy: Location.Accuracy.Balanced, timeInterval: 8_000, distanceInterval: 10, label: "still" };
  }
  if (speedMps < 2.5) {
    return { accuracy: Location.Accuracy.High, timeInterval: 3_000, distanceInterval: 5, label: "walk" };
  }
  if (speedMps < 7) {
    return { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1_000, distanceInterval: 0, label: "run" };
  }
  return { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1_500, distanceInterval: 0, label: "fast" };
}

/** Whether two profiles differ enough to warrant resubscribe. */
export function profilesDiffer(a: AdaptiveProfile, b: AdaptiveProfile): boolean {
  return a.accuracy !== b.accuracy
      || a.timeInterval !== b.timeInterval
      || a.distanceInterval !== b.distanceInterval;
}
