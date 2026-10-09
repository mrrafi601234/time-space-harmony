import { useQuery } from "@tanstack/react-query";
import confetti from "canvas-confetti";
import { useEffect, useRef } from "react";
import { useSettings, useTasks, ymd } from "@/lib/store";
import { fetchWeather } from "@/services/weatherService";

type Mode = "rain" | "night" | "day";
const RAIN = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99]);

/** Animated canvas behind the glass panels; reacts to weather and time of day. */
export function AmbientBackground() {
  const [s] = useSettings();
  const ref = useRef<HTMLCanvasElement>(null);
  const q = useQuery({ queryKey: ["weather", s.lat, s.lon, s.unit], queryFn: () => fetchWeather(s.lat, s.lon, s.unit), staleTime: 10 * 60000 });
  const code = q.data?.current.weather_code;
  const on = s.ambient !== false;

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !on) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const h = new Date().getHours();
    const mode: Mode = code !== undefined && RAIN.has(code) ? "rain" : h < 6 || h >= 19 ? "night" : "day";
    const css = getComputedStyle(document.documentElement);
    const col = { primary: css.getPropertyValue("--primary").trim(), violet: css.getPropertyValue("--violet").trim(), warning: css.getPropertyValue("--warning").trim(), fg: css.getPropertyValue("--foreground").trim() };
    let W = 0, H = 0, raf = 0;
    const resize = () => { W = cv.width = window.innerWidth; H = cv.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const n = mode === "rain" ? 120 : mode === "night" ? 90 : 35;
    const ps = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * (mode === "day" ? 60 : 1.6) + (mode === "day" ? 20 : 0.4), v: Math.random() * 0.6 + 0.2, p: Math.random() * Math.PI * 2 }));
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (const o of ps) {
        if (mode === "rain") {
          ctx.globalAlpha = 0.25; ctx.strokeStyle = col.primary; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(o.x - 2, o.y + 14); ctx.stroke();
          o.y += o.v * 14; o.x -= 0.6; if (o.y > H) { o.y = -20; o.x = Math.random() * W; }
        } else if (mode === "night") {
          o.p += 0.02; ctx.globalAlpha = 0.3 + Math.sin(o.p) * 0.3; ctx.fillStyle = o.r > 1.4 ? col.violet : col.fg;
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
          o.y -= o.v * 0.08; if (o.y < 0) o.y = H;
        } else {
          o.p += 0.005; const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
          g.addColorStop(0, o.v > 0.5 ? col.warning : col.primary); g.addColorStop(1, "transparent");
          ctx.globalAlpha = 0.06 + Math.sin(o.p) * 0.03; ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill();
          o.y -= o.v * 0.3; o.x += Math.sin(o.p) * 0.3; if (o.y < -o.r) o.y = H + o.r;
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [code, on]);

  if (!on) return null;
  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0" />;
}

/** Confetti when every high-priority task due today (or undated) is done. */
export function TaskCelebration() {
  const [tasks] = useTasks();
  const prev = useRef<boolean | null>(null);
  useEffect(() => {
    const today = ymd(new Date());
    const hi = tasks.filter((t) => t.priority === "High" && (!t.due || t.due <= today));
    const all = hi.length > 0 && hi.every((t) => t.done);
    if (prev.current === false && all) void confetti({ particleCount: 160, spread: 90, origin: { y: 0.7 } });
    prev.current = all;
  }, [tasks]);
  return null;
}
