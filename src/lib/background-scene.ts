export type BackgroundScene = "day" | "night" | "sunrise" | "sunset" | "rain" | "snow" | "fog" | "clouds" | "storm";

const RAIN = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]);
const SNOW = new Set([71, 73, 75, 77, 85, 86]);

/** Minutes are local to the selected weather location, not the browser. */
export function backgroundScene(code: number | undefined, minute: number, sunrise = 360, sunset = 1080): BackgroundScene {
  if (code !== undefined) {
    if ([95, 96, 99].includes(code)) return "storm";
    if (SNOW.has(code)) return "snow";
    if (RAIN.has(code)) return "rain";
    if ([45, 48].includes(code)) return "fog";
    if ([2, 3].includes(code)) return "clouds";
  }
  if (Math.abs(minute - sunrise) <= 45) return "sunrise";
  if (Math.abs(minute - sunset) <= 45) return "sunset";
  return minute > sunrise && minute < sunset ? "day" : "night";
}

export function solarMinute(value: string | undefined, fallback: number): number {
  const match = value?.match(/T(\d{2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : fallback;
}