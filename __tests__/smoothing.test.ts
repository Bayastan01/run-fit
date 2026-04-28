/// <reference types="jest" />
import { EWMA, SlidingMean } from "../src/features/tracking/smoothing";

describe("EWMA", () => {
  it("first value equals input", () => {
    const e = new EWMA(0.4);
    expect(e.push(5)).toBe(5);
  });

  it("smooths sequential values", () => {
    const e = new EWMA(0.5);
    e.push(0);
    const v = e.push(10);
    expect(v).toBeCloseTo(5, 5);
  });

  it("reset clears state", () => {
    const e = new EWMA(0.4);
    e.push(100);
    e.reset();
    expect(e.push(7)).toBe(7);
  });
});

describe("SlidingMean", () => {
  it("averages within window", () => {
    const s = new SlidingMean(10_000);
    s.push(0, 2);
    s.push(1000, 4);
    const last = s.push(2000, 6);
    expect(last).toBe(4);
  });

  it("drops oldest beyond window", () => {
    const s = new SlidingMean(2_000);
    s.push(0, 2);
    s.push(1500, 4);
    const v = s.push(5000, 10);
    expect(v).toBe(10);
  });
});
