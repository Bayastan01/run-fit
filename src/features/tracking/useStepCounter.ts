import { useEffect, useRef, useState } from "react";
import { Pedometer } from "expo-sensors";

export interface StepStats {
  /** Cadence (steps per minute) over the last `windowMs` window. */
  cadence: number;
  /** Total step count delta since hook mount. */
  totalSteps: number;
  /** Whether Pedometer is available on this device. */
  available: boolean;
  /** Whether we've received any step events since mount. */
  hasData: boolean;
}

interface SampleEntry {
  ts: number;
  count: number;
}

interface Options {
  /** Sliding window length in ms over which cadence is averaged. Default 20s. */
  windowMs?: number;
}

/**
 * Wraps `expo-sensors` Pedometer with a sliding-window cadence calculation.
 *
 * - On iOS uses CMPedometer (system-level activity classifier).
 * - On Android uses TYPE_STEP_COUNTER hardware sensor.
 *
 * Note: Pedometer events on iOS arrive in batches (~1 sec); cadence stabilises
 * after ~5 seconds.
 */
export function useStepCounter({ windowMs = 20_000 }: Options = {}): StepStats {
  const [available, setAvailable] = useState(false);
  const [totalSteps, setTotalSteps] = useState(0);
  const [cadence, setCadence] = useState(0);
  const [hasData, setHasData] = useState(false);

  const samplesRef = useRef<SampleEntry[]>([]);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let cancelled = false;
    let baseCount = 0;
    let firstSampleSeen = false;

    (async () => {
      const isAvailable = await Pedometer.isAvailableAsync();
      if (!cancelled) setAvailable(isAvailable);
      if (!isAvailable) return;

      sub = Pedometer.watchStepCount((result) => {
        if (cancelled) return;
        const now = Date.now();

        // The first event gives us the baseline (Android counter is monotonic since boot).
        if (!firstSampleSeen) {
          baseCount = result.steps;
          firstSampleSeen = true;
          samplesRef.current = [{ ts: now, count: 0 }];
          setHasData(true);
          return;
        }

        const delta = result.steps - baseCount;
        samplesRef.current.push({ ts: now, count: delta });
        // Trim to window
        const cutoff = now - windowMs;
        while (samplesRef.current.length > 1 && samplesRef.current[0].ts < cutoff) {
          samplesRef.current.shift();
        }
        const first = samplesRef.current[0];
        const last  = samplesRef.current[samplesRef.current.length - 1];
        const elapsedSec = Math.max(1, (last.ts - first.ts) / 1000);
        const stepsInWindow = last.count - first.count;
        const newCadence = (stepsInWindow / elapsedSec) * 60;

        setTotalSteps(delta);
        setCadence(Math.max(0, Math.round(newCadence)));
      });
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [windowMs]);

  return { cadence, totalSteps, available, hasData };
}
