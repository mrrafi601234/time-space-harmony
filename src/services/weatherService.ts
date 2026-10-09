import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun, type LucideIcon } from "lucide-react";

export interface WeatherData {
  current: { temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number; weather_code: number };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
}

export async function fetchWeather(lat: number, lon: number, unit: "C" | "F"): Promise<WeatherData> {
  const p = new URLSearchParams({
    latitude: String(lat), longitude: String(lon),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    temperature_unit: unit === "F" ? "fahrenheit" : "celsius",
    wind_speed_unit: unit === "F" ? "mph" : "kmh",
    timezone: "auto", forecast_days: "7",
  });
  const r = await fetch(`https://api.open-meteo.com/v1/forecast?${p}`);
  if (!r.ok) throw new Error("Weather unavailable");
  return r.json();
}

export interface GeoResult { name: string; admin1?: string; country?: string; latitude: number; longitude: number }
export async function searchCity(q: string): Promise<GeoResult[]> {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=6&name=${encodeURIComponent(q)}`);
  if (!r.ok) throw new Error("Search failed");
  return (await r.json()).results ?? [];
}

export function weatherInfo(code: number): { label: string; Icon: LucideIcon } {
  if (code === 0) return { label: "Clear sky", Icon: Sun };
  if (code <= 2) return { label: "Partly cloudy", Icon: CloudSun };
  if (code === 3) return { label: "Overcast", Icon: Cloud };
  if (code <= 48) return { label: "Fog", Icon: CloudFog };
  if (code <= 57) return { label: "Drizzle", Icon: CloudDrizzle };
  if (code <= 67 || (code >= 80 && code <= 82)) return { label: "Rain", Icon: CloudRain };
  if (code <= 77 || code === 85 || code === 86) return { label: "Snow", Icon: CloudSnow };
  return { label: "Thunderstorm", Icon: CloudLightning };
}
