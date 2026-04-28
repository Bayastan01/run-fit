export type Activity =
  | "still"
  | "walking"
  | "running"
  | "fast_run"
  | "vehicle"
  | "suspect_vehicle"
  | "bike"
  | "low_gps"
  | "unknown";

export interface ActivityInfo {
  activity: Activity;
  /** Russian human label for UI. */
  label: string;
  /** Hex colour for badge. */
  color: string;
  /** True when the run is currently being credited as a real run. */
  scoring: boolean;
  /** Short motivational hint shown under metrics. */
  hint: string;
}

interface Input {
  /** Smoothed GPS speed (m/s) — caller should pass an EWMA-smoothed value. */
  speedMps: number;
  /** Cadence in steps/min averaged over last ~20s. */
  cadence: number;
  /** Most recent GPS accuracy in metres (HDOP). */
  accuracyM: number | null;
  /** Whether Pedometer is available — affects how we treat zero cadence. */
  pedometerAvailable: boolean;
  /** ms since run started — used to grant cadence a warm-up window. */
  runDurationMs?: number;
}

const ACCURACY_BAD = 30;
const PED_WARMUP_MS = 12_000;

function rawClassify({
  speedMps, cadence, accuracyM, pedometerAvailable, runDurationMs = 60_000,
}: Input): ActivityInfo {
  if (accuracyM != null && accuracyM > ACCURACY_BAD) {
    return badge("low_gps", "GPS слабый", "#71717a", false, "Жди фикс — точки сейчас не пишутся");
  }

  // VEHICLE: fast and (no cadence | very low cadence). Pedometer warm-up window:
  // в первые 12 секунд игнорируем cadence-based vehicle detection.
  const cadenceTrustworthy = pedometerAvailable && runDurationMs >= PED_WARMUP_MS;

  if (speedMps > 9) {
    return badge("vehicle", "Транспорт", "#ef4444", false, "Бег не засчитывается — ты едешь");
  }
  if (speedMps > 7 && cadenceTrustworthy && cadence < 60) {
    return badge("suspect_vehicle", "Подозрительно", "#f59e0b", false, "Скорость как у транспорта — проверяем");
  }
  if (speedMps >= 7) {
    return badge("fast_run", "Спринт", "#00ff88", true, "Огонь, держи темп!");
  }
  if (speedMps >= 2.2) {
    if (cadenceTrustworthy && cadence > 0 && cadence < 60) {
      return badge("bike", "Велосипед", "#06b6d4", false, "Похоже на велик — не зачёт для бега");
    }
    return badge("running", "Бег", "#00ff88", true, "Хороший темп — продолжай");
  }
  if (speedMps >= 0.4) {
    return badge("walking", "Ходьба", "#a1a1aa", false, "Ходьба — захват зон не идёт");
  }
  return badge("still", "Стоишь", "#71717a", false, "Стоишь на месте");
}

/**
 * Classifier with hysteresis. State machine prevents flapping near thresholds:
 * a new state must be observed for `STICKY_MS` before we accept the transition.
 */
export class ActivityHysteresis {
  private currentInfo: ActivityInfo | null = null;
  private candidateInfo: ActivityInfo | null = null;
  private candidateSince = 0;

  constructor(
    /** ms a new candidate must hold before promoting to current. */
    public stickyMs: number = 2500,
    /** Some transitions should be instant (e.g. anything → low_gps). */
    private readonly instantInto: Activity[] = ["low_gps", "vehicle"],
  ) {}

  classify(input: Input, now: number): ActivityInfo {
    const raw = rawClassify(input);

    if (!this.currentInfo) {
      this.currentInfo = raw;
      this.candidateInfo = null;
      return raw;
    }

    if (raw.activity === this.currentInfo.activity) {
      this.candidateInfo = null;
      return this.currentInfo;
    }

    // Instant promotions (safety: leaving low_gps / hard vehicle).
    if (this.instantInto.includes(raw.activity)) {
      this.currentInfo = raw;
      this.candidateInfo = null;
      return raw;
    }

    if (this.candidateInfo?.activity !== raw.activity) {
      this.candidateInfo = raw;
      this.candidateSince = now;
    }

    if (now - this.candidateSince >= this.stickyMs) {
      this.currentInfo = raw;
      this.candidateInfo = null;
      return raw;
    }

    return this.currentInfo;
  }

  reset() {
    this.currentInfo = null;
    this.candidateInfo = null;
  }
}

// Backwards-compatible function (used by other places).
export function classifyActivity(input: Input): ActivityInfo {
  return rawClassify(input);
}

function badge(activity: Activity, label: string, color: string, scoring: boolean, hint: string): ActivityInfo {
  return { activity, label, color, scoring, hint };
}
