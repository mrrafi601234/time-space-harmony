import { describe, expect, it } from "vitest";
import { getPrayerWindow, type PrayerTimes } from "@/services/prayerService";

const t: PrayerTimes = { Fajr: "05:00", Sunrise: "06:30", Dhuhr: "12:00", Asr: "15:00", Maghrib: "18:00", Isha: "19:30" };
const at = (h: number, m = 0) => new Date(2026, 9, 9, h, m);

describe("prayer window", () => {
  it("Dhuhr ends at Asr, 50% halfway", () => {
    const w = getPrayerWindow(t, at(13, 30))!;
    expect(w.name).toBe("Dhuhr"); expect(w.endLabel).toBe("Asr"); expect(w.pct).toBeCloseTo(50);
  });
  it("Fajr ends at Sunrise", () => expect(getPrayerWindow(t, at(5, 45))!.endLabel).toBe("Sunrise"));
  it("no window between Sunrise and Dhuhr", () => expect(getPrayerWindow(t, at(9))).toBeNull());
  it("Isha continues past midnight until Fajr", () => {
    const w = getPrayerWindow(t, at(2))!;
    expect(w.name).toBe("Isha"); expect(w.endLabel).toBe("Fajr"); expect(w.remaining).toBe(3 * 3600);
  });
});
