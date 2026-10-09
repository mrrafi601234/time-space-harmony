import { useEffect, useState } from "react";
import { useClock } from "@/hooks/useClock";
import { backgroundScene, solarMinute } from "@/lib/background-scene";
import type { WeatherData } from "@/services/weatherService";
import day from "@/assets/background-day.jpg";
import night from "@/assets/background-night.jpg";
import sunrise from "@/assets/background-sunrise.jpg";
import sunset from "@/assets/background-sunset.jpg";
import rain from "@/assets/background-rain.jpg";
import snow from "@/assets/background-snow.jpg";
import fog from "@/assets/background-fog.jpg";
import clouds from "@/assets/background-clouds.jpg";
import storm from "@/assets/background-storm.jpg";

const photos = { day, night, sunrise, sunset, rain, snow, fog, clouds, storm };

export function DynamicBackground({ weather }: { weather?: WeatherData }) {
  const now = useClock();
  const local = now && weather?.utc_offset_seconds !== undefined ? new Date(now.getTime() + weather.utc_offset_seconds * 1000) : null;
  const minute = local ? local.getUTCHours() * 60 + local.getUTCMinutes() : now ? now.getHours() * 60 + now.getMinutes() : 720;
  const date = local ? local.toISOString().slice(0, 10) : "";
  const dateIndex = Math.max(0, weather?.daily.time.indexOf(date) ?? 0);
  const scene = backgroundScene(weather?.current.weather_code, minute, solarMinute(weather?.daily.sunrise?.[dateIndex], 360), solarMinute(weather?.daily.sunset?.[dateIndex], 1080));
  const source = photos[scene];
  const [display, setDisplay] = useState<string | null>(null);
  const [previous, setPrevious] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => { if (!cancelled) { setDisplay((current) => { if (current !== source) setPrevious(current); return source; }); } };
    image.src = source;
    return () => { cancelled = true; };
  }, [source]);

  return <div aria-hidden className="weather-backdrop" data-scene={scene}>
    {previous && <img className="weather-photo" src={previous} alt="" />}
    {display && <img key={display} className="weather-photo weather-photo-enter" src={display} alt="" />}
    <div className="weather-overlay" />
  </div>;
}