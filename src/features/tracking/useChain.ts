import { useEffect, useRef, useState } from "react";
import * as Haptics from "expo-haptics";
import * as Speech from "expo-speech";

export interface ChainState {
  /** Current chain count, 0..MAX_CHAIN. */
  current: number;
  /** Current multiplier (1.0..MAX_MULTIPLIER). */
  multiplier: number;
  /** Time since last pulse in ms (for UI ring progress). */
  pulseAge: number;
  /** Whether the user just hit a milestone (5, 10, 20, 50). */
  milestoneJustHit: number | null;
  /** Highest chain reached this run. */
  best: number;
}

interface Options {
  /** ms between pulses. Default 6000 (INTVL-canonical). */
  pulseMs?: number;
  /** Hard cap on chain. Default 50. */
  maxChain?: number;
  /** Multiplier curve: 1 + chain * step, capped. */
  step?: number;
  maxMultiplier?: number;
  /** Whether to play haptic on each pulse. */
  haptic?: boolean;
  /** Speak milestones via TTS. */
  voice?: boolean;
}

export const CHAIN_DEFAULTS: Required<Options> = {
  pulseMs: 6_000,
  maxChain: 50,
  step: 0.05,
  maxMultiplier: 5.0,
  haptic: true,
  voice: true,
};

/**
 * Chain mechanic — INTVL-DNA.
 *
 * Каждые `pulseMs` миллисекунд непрерывного активного бега (caller передаёт `isScoring=true`)
 * счётчик растёт на 1, мультипликатор обновляется по кривой `1 + n × step` (cap maxMultiplier).
 * При выпадении из режима бега (пауза, ходьба, транспорт) chain сбрасывается, генерируется
 * "chainBroken" haptic.
 */
export function useChain(isScoring: boolean, options: Options = {}): ChainState {
  const opts = { ...CHAIN_DEFAULTS, ...options };
  const [state, setState] = useState<ChainState>({
    current: 0, multiplier: 1.0, pulseAge: 0, milestoneJustHit: null, best: 0,
  });

  const pulseTsRef = useRef<number>(Date.now());
  const isScoringRef = useRef(isScoring);
  isScoringRef.current = isScoring;

  // 100 ms tick for UI smoothness (pulseAge progresses for ring animation)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setState((prev) => {
        const scoring = isScoringRef.current;
        if (!scoring) {
          // chain broken
          if (prev.current > 0) {
            if (opts.haptic) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
            pulseTsRef.current = now;
            return { current: 0, multiplier: 1.0, pulseAge: 0, milestoneJustHit: null, best: prev.best };
          }
          pulseTsRef.current = now;
          return { ...prev, pulseAge: 0, milestoneJustHit: null };
        }

        const age = now - pulseTsRef.current;
        if (age < opts.pulseMs) {
          return { ...prev, pulseAge: age, milestoneJustHit: null };
        }

        // pulse hit
        pulseTsRef.current = now;
        const next = Math.min(opts.maxChain, prev.current + 1);
        const multiplier = Math.min(opts.maxMultiplier, 1 + next * opts.step);
        const milestone = MILESTONES.includes(next) ? next : null;

        if (opts.haptic) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
        if (opts.voice && milestone) {
          Speech.speak(`Цепь ${milestone}`, { language: "ru-RU", pitch: 1, rate: 1 });
        }

        return {
          current: next,
          multiplier,
          pulseAge: 0,
          milestoneJustHit: milestone,
          best: Math.max(prev.best, next),
        };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [opts.pulseMs, opts.maxChain, opts.step, opts.maxMultiplier, opts.haptic, opts.voice]);

  return state;
}

const MILESTONES = [5, 10, 20, 30, 50];
