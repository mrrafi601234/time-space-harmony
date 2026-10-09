import { describe, expect, it } from "vitest";
import { getPrayerGap, getPrayerWindow, type PrayerTimes } from "@/services/prayerService";
import { streak } from "@/lib/store";

const t: PrayerTimes = { Fajr: "05:00", Sunrise: "06:30", Dhuhr: "12:00", Asr: "15:00", Maghrib: "18:00", Isha: "19:30" };
const at = (h: number, m = 0) => new Date(2026, 9, 9, h, m);

describe("prayer window", () => {
  it("Dhuhr ends at Asr, 50% halfway", () => {
    const w = getPrayerWindow(t, at(13, 30))!;
    expect(w.name).toBe("Dhuhr"); expect(w.endLabel).toBe("Asr"); expect(w.pct).toBeCloseTo(50);
  });
  it("Fajr ends at Sunrise", () => expect(getPrayerWindow(t, at(5, 45))!.endLabel).toBe("Sunrise"));
  it("Asr ends at Maghrib (sunset)", () => expect(getPrayerWindow(t, at(17))!.end).toEqual(at(18)));
  it("Isha ends at Islamic midnight (halfway Maghrib→Fajr = 23:30)", () => {
    const w = getPrayerWindow(t, at(21))!;
    expect(w.name).toBe("Isha"); expect(w.end).toEqual(at(23, 30));
  });
  it("Sunrise→Dhuhr is the Duha period", () => {
    expect(getPrayerWindow(t, at(9))).toBeNull();
    expect(getPrayerGap(t, at(9))!.kind).toBe("duha");
  });
  it("after midnight until Fajr is Qiyam with countdown to Fajr", () => {
    const g = getPrayerGap(t, at(2))!;
    expect(g.kind).toBe("qiyam"); expect(g.remaining).toBe(3 * 3600);
  });
  it("Qiyam starts the same night after 23:30", () => {
    const g = getPrayerGap(t, at(23, 45))!;
    expect(g.kind).toBe("qiyam"); expect(g.remaining).toBe(5 * 3600 + 15 * 60);
  });
});

describe("streak", () => {
  it("counts consecutive days ending today", () => expect(streak(["2026-10-07", "2026-10-08", "2026-10-09"], at(10))).toBe(3));
  it("still counts when today not done yet", () => expect(streak(["2026-10-07", "2026-10-08"], at(10))).toBe(2));
  it("breaks on a gap", () => expect(streak(["2026-10-06", "2026-10-09"], at(10))).toBe(1));
});
