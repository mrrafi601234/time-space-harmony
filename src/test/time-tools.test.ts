import { describe, expect, it } from "vitest";
import { EMPTY_STOPWATCH, EMPTY_TIMER, formatDuration, stopwatchElapsed, timerRemaining } from "@/lib/time-tools";

describe("dashboard time tools", () => {
  it("adds real elapsed time even when a background tab skips ticks", () => {
    expect(stopwatchElapsed({ ...EMPTY_STOPWATCH, elapsed: 2500, startedAt: 1000 }, 61000)).toBe(62500);
  });
  it("keeps a paused stopwatch unchanged", () => {
    expect(stopwatchElapsed({ ...EMPTY_STOPWATCH, elapsed: 2500 }, 61000)).toBe(2500);
  });
  it("counts down against a deadline and never goes below zero", () => {
    const timer = { ...EMPTY_TIMER, endsAt: 60000 };
    expect(timerRemaining(timer, 45000)).toBe(15000);
    expect(timerRemaining(timer, 61000)).toBe(0);
  });
  it("preserves paused countdown time", () => {
    expect(timerRemaining({ ...EMPTY_TIMER, remaining: 15000 }, 61000)).toBe(15000);
  });
  it("formats hours and rounds countdown seconds up", () => {
    expect(formatDuration(3661000)).toBe("01:01:01");
    expect(formatDuration(1501, true)).toBe("00:00:02");
  });
});