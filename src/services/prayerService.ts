export const PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type PrayerName = (typeof PRAYERS)[number];
export type PrayerTimes = Record<PrayerName | "Sunrise", string>;

export const METHODS: { id: number; name: string }[] = [
  { id: 2, name: "ISNA (North America)" },
  { id: 3, name: "Muslim World League" },
  { id: 4, name: "Umm Al-Qura, Makkah" },
  { id: 5, name: "Egyptian General Authority" },
  { id: 1, name: "University of Islamic Sciences, Karachi" },
  { id: 7, name: "University of Tehran" },
  { id: 8, name: "Gulf Region" },
  { id: 9, name: "Kuwait" },
  { id: 10, name: "Qatar" },
  { id: 11, name: "Singapore" },
  { id: 13, name: "Diyanet, Turkey" },
  { id: 15, name: "Moonsighting Committee" },
];

export async function fetchPrayerTimes(lat: number, lon: number, method: number): Promise<PrayerTimes> {
  const d = new Date();
  const date = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
  const r = await fetch(`https://api.aladhan.com/v1/timings/${date}?latitude=${lat}&longitude=${lon}&method=${method}`);
  if (!r.ok) throw new Error("Prayer times unavailable");
  const t = (await r.json()).data.timings;
  return Object.fromEntries([...PRAYERS, "Sunrise"].map((p) => [p, String(t[p]).slice(0, 5)])) as PrayerTimes;
}

export const toDate = (hhmm: string, base = new Date()) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const d = new Date(base); d.setHours(h, m, 0, 0);
  return d;
};

export function to12h(hhmm: string) {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export interface PrayerWindow { name: PrayerName; start: Date; end: Date; endLabel: string; pct: number; remaining: number }

/** Active prayer window: Fajr→Sunrise, Dhuhr→Asr, Asr→Maghrib, Maghrib→Isha, Isha→next Fajr. Null between Sunrise and Dhuhr. */
export function getPrayerWindow(t: PrayerTimes, now: Date): PrayerWindow | null {
  const at = (k: keyof PrayerTimes, add = 0) => { const d = toDate(t[k], now); d.setDate(d.getDate() + add); return d; };
  const wins: [PrayerName, Date, Date, string][] = [
    ["Isha", at("Isha", -1), at("Fajr"), "Fajr"],
    ["Fajr", at("Fajr"), at("Sunrise"), "Sunrise"],
    ["Dhuhr", at("Dhuhr"), at("Asr"), "Asr"],
    ["Asr", at("Asr"), at("Maghrib"), "Maghrib"],
    ["Maghrib", at("Maghrib"), at("Isha"), "Isha"],
    ["Isha", at("Isha"), at("Fajr", 1), "Fajr"],
  ];
  const w = wins.find(([, s, e]) => now >= s && now < e);
  if (!w) return null;
  const [name, start, end, endLabel] = w;
  const total = end.getTime() - start.getTime();
  const el = now.getTime() - start.getTime();
  return { name, start, end, endLabel, pct: Math.min(100, Math.max(0, (el / total) * 100)), remaining: Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000)) };
}
