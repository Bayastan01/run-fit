import { useEffect, useRef, useState } from "react";
import * as Location from "expo-location";
import * as Battery from "expo-battery";
import { useStepCounter } from "./useStepCounter";
import {
  ActivityHysteresis,
  classifyActivity,
  type ActivityInfo,
} from "./useActivityClassifier";
import { EWMA } from "./smoothing";
import { chooseGpsProfile, profilesDiffer, type AdaptiveProfile } from "./adaptiveGps";

export interface RunPointSample {
  ts: number;
  lat: number;
  lng: number;
  accuracyM: number | null;
  /** Raw GPS speed (m/s). */
  speedMps: number;
  /** Smoothed speed used for classification. */
  speedSmoothMps: number;
  altitude: number | null;
  cadence: number | null;
  steps: number | null;
  activity: ActivityInfo["activity"];
  /** Active chain multiplier at the time the point was accepted. */
  chainMultiplier: number;
}

export interface RunTrackerState {
  paused: boolean;
  autoPaused: boolean;
  scoredDistanceM: number;
  rawDistanceM: number;
  /** Sum of (segment_m × chainMultiplier) — what backend will count. */
  weightedDistanceM: number;
  speedMps: number;
  cadence: number;
  activity: ActivityInfo;
  points: RunPointSample[];
  unflushedCount: number;
  /** Current GPS sampling profile (debug + UI). */
  gpsProfile: AdaptiveProfile;
  /** ms classified as STILL since last movement. */
  stationaryMs: number;
}

export interface RunTrackerControls {
  pause: () => void;
  resume: () => void;
  /** Force an auto-pause (used by hooks watching idle time). */
  autoPause: () => void;
  flushPoints: () => RunPointSample[];
  /** Live chain multiplier — caller passes this in via setter. */
  setChainMultiplier: (m: number) => void;
  /** Whether user is in a privacy-zone (no points are recorded). */
  setInPrivacyZone: (inside: boolean) => void;
}

interface Options {
  maxAccuracyM?: number;
  maxSpeedMps?: number;
  /** Auto-pause after this much continuous still time. Default 90 sec. */
  autoPauseAfterMs?: number;
  ewmaAlpha?: number;
  hysteresisStickyMs?: number;
}

export function useRunTracker(active: boolean, options: Options = {}): [RunTrackerState, RunTrackerControls] {
  const {
    // Tighter accuracy gate (was 50): drops the worst noise that makes
    // the dot jump to a parallel street.
    maxAccuracyM = 25,
    // Cap at 12 m/s ≈ 43 km/h — covers fastest sprinters & cycling but
    // rejects clear teleports. (Was 25.)
    maxSpeedMps = 12,
    autoPauseAfterMs = 90_000,
    ewmaAlpha = 0.4,
    hysteresisStickyMs = 2500,
  } = options;

  const { cadence, available: pedometerAvailable } = useStepCounter({ windowMs: 20_000 });

  const [paused, setPaused] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [points, setPoints] = useState<RunPointSample[]>([]);
  const [scoredDistanceM, setScoredDistanceM] = useState(0);
  const [rawDistanceM, setRawDistanceM] = useState(0);
  const [weightedDistanceM, setWeightedDistanceM] = useState(0);
  const [speedMps, setSpeedMps] = useState(0);
  const [activity, setActivity] = useState<ActivityInfo>(() =>
    classifyActivity({ speedMps: 0, cadence: 0, accuracyM: null, pedometerAvailable: false }),
  );
  const [gpsProfile, setGpsProfile] = useState<AdaptiveProfile>(() =>
    chooseGpsProfile({ speedMps: 0, batteryFraction: null, stationaryMs: 0 }),
  );
  const [stationaryMs, setStationaryMs] = useState(0);

  const ewmaRef = useRef(new EWMA(ewmaAlpha));
  const hysteresisRef = useRef(new ActivityHysteresis(hysteresisStickyMs));
  const lastPointRef = useRef<RunPointSample | null>(null);
  const flushedUpToRef = useRef<number>(0);
  const runStartedAtRef = useRef<number>(Date.now());
  const stillSinceRef = useRef<number | null>(null);
  const chainMultiplierRef = useRef<number>(1);
  const inPrivacyRef = useRef(false);
  const batteryRef = useRef<number | null>(null);
  const subRef = useRef<Location.LocationSubscription | null>(null);
  const profileRef = useRef<AdaptiveProfile>(gpsProfile);
  // Mirror pause state into refs so the GPS callback (closure-captured)
  // always reads the latest value instead of a stale render snapshot.
  const pausedRef = useRef(paused);
  const autoPausedRef = useRef(autoPaused);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { autoPausedRef.current = autoPaused; }, [autoPaused]);

  // Battery polling — every 30s
  useEffect(() => {
    if (!active) return;
    let mounted = true;
    Battery.getBatteryLevelAsync().then((b) => mounted && (batteryRef.current = b)).catch(() => {});
    const t = setInterval(() => {
      Battery.getBatteryLevelAsync().then((b) => mounted && (batteryRef.current = b)).catch(() => {});
    }, 30_000);
    return () => { mounted = false; clearInterval(t); };
  }, [active]);

  // Subscribe / re-subscribe on profile change
  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    runStartedAtRef.current = Date.now();
    ewmaRef.current.reset();
    hysteresisRef.current.reset();

    async function subscribe(profile: AdaptiveProfile) {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (cancelled || perm.status !== "granted") return;

      subRef.current?.remove();
      subRef.current = await Location.watchPositionAsync(
        {
          accuracy: profile.accuracy,
          timeInterval: profile.timeInterval,
          distanceInterval: profile.distanceInterval,
        },
        (loc) => onLocation(loc),
      );
    }

    function maybeRetune(speed: number, stillMs: number) {
      const next = chooseGpsProfile({
        speedMps: speed,
        batteryFraction: batteryRef.current,
        stationaryMs: stillMs,
      });
      if (profilesDiffer(profileRef.current, next)) {
        profileRef.current = next;
        setGpsProfile(next);
        subscribe(next);
      }
    }

    function onLocation(loc: Location.LocationObject) {
      if (cancelled || pausedRef.current || autoPausedRef.current) return;
      if (inPrivacyRef.current) return;

      const { latitude, longitude, accuracy, speed, altitude } = loc.coords;
      const ts = loc.timestamp ?? Date.now();
      const acc = accuracy ?? null;
      const rawSpeed = Math.max(0, speed ?? 0);

      if (acc != null && acc > maxAccuracyM) return;

      const prev = lastPointRef.current;
      let segM = 0;
      if (prev) {
        segM = haversineMeters(prev.lat, prev.lng, latitude, longitude);
        const dtS = Math.max(0.1, (ts - prev.ts) / 1000);
        if (segM / dtS > maxSpeedMps) return; // teleport reject
        // Drop tiny GPS noise: <2 m or <0.4 s since last sample.
        // Without this each sub-step jitters the polyline back & forth.
        if (segM < 2 || dtS < 0.4) return;
      }

      const smooth = ewmaRef.current.push(rawSpeed);
      const runDuration = ts - runStartedAtRef.current;
      const a = hysteresisRef.current.classify(
        { speedMps: smooth, cadence, accuracyM: acc, pedometerAvailable, runDurationMs: runDuration },
        ts,
      );

      // Stationary tracking (auto-pause)
      if (a.activity === "still") {
        if (stillSinceRef.current == null) stillSinceRef.current = ts;
        const stillFor = ts - (stillSinceRef.current ?? ts);
        setStationaryMs(stillFor);
        if (stillFor >= autoPauseAfterMs && !autoPausedRef.current) {
          setAutoPaused(true);
        }
      } else {
        stillSinceRef.current = null;
        setStationaryMs(0);
        if (autoPausedRef.current) setAutoPaused(false);
      }

      const pt: RunPointSample = {
        ts, lat: latitude, lng: longitude,
        accuracyM: acc,
        speedMps: rawSpeed,
        speedSmoothMps: smooth,
        altitude: altitude ?? null,
        cadence: pedometerAvailable ? cadence : null,
        steps: null,
        activity: a.activity,
        chainMultiplier: chainMultiplierRef.current,
      };
      lastPointRef.current = pt;

      setSpeedMps(smooth);
      setActivity(a);
      setPoints((prev) => [...prev, pt]);

      if (segM > 0) {
        setRawDistanceM((d) => d + segM);
        if (a.scoring) {
          setScoredDistanceM((d) => d + segM);
          setWeightedDistanceM((d) => d + segM * chainMultiplierRef.current);
        }
      }

      // Adapt sampling
      maybeRetune(smooth, stillSinceRef.current ? ts - stillSinceRef.current : 0);
    }

    subscribe(profileRef.current);
    return () => {
      cancelled = true;
      subRef.current?.remove();
      subRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const controls: RunTrackerControls = {
    pause: () => setPaused(true),
    resume: () => { setPaused(false); setAutoPaused(false); },
    autoPause: () => setAutoPaused(true),
    flushPoints: () => {
      const drained = points.slice(flushedUpToRef.current);
      flushedUpToRef.current = points.length;
      return drained;
    },
    setChainMultiplier: (m) => { chainMultiplierRef.current = m; },
    setInPrivacyZone: (inside) => { inPrivacyRef.current = inside; },
  };

  return [
    {
      paused, autoPaused,
      scoredDistanceM, rawDistanceM, weightedDistanceM,
      speedMps, cadence,
      activity, points,
      unflushedCount: points.length - flushedUpToRef.current,
      gpsProfile, stationaryMs,
    },
    controls,
  ];
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
