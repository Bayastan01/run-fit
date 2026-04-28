/**
 * Exponentially-weighted moving average. Smooths noisy GPS speed readings.
 *
 *   ewma_t = α × x_t + (1 - α) × ewma_{t-1}
 *
 * α ∈ (0, 1] — higher = follows latest reading faster (less smooth).
 */
export class EWMA {
  private value: number = 0;
  private initialised = false;
  constructor(private alpha: number = 0.4) {}

  push(x: number): number {
    if (!this.initialised) {
      this.value = x;
      this.initialised = true;
    } else {
      this.value = this.alpha * x + (1 - this.alpha) * this.value;
    }
    return this.value;
  }

  get(): number { return this.value; }
  reset() { this.value = 0; this.initialised = false; }
}

/** Sliding-window numeric mean. */
export class SlidingMean {
  private samples: { t: number; v: number }[] = [];
  constructor(private windowMs: number) {}

  push(t: number, v: number): number {
    this.samples.push({ t, v });
    const cutoff = t - this.windowMs;
    while (this.samples.length > 1 && this.samples[0].t < cutoff) this.samples.shift();
    const sum = this.samples.reduce((s, x) => s + x.v, 0);
    return sum / this.samples.length;
  }

  get count(): number { return this.samples.length; }
}
