import { useQuery } from "@tanstack/react-query";
import { Droplets, Moon, Wind } from "lucide-react";
import type { ReactNode } from "react";
import { useClock } from "@/hooks/useClock";
import { useSettings, useTasks, ymd } from "@/lib/store";
import { fetchPrayerTimes, getPrayerGap, getPrayerWindow, type PrayerName, PRAYERS, to12h, toDate } from "@/services/prayerService";
import { fetchWeather, weatherInfo } from "@/services/weatherService";

export function Card({ title, icon, children, className = "" }: { title?: string; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`glass p-5 ${className}`}>
      {title && (
        <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {icon} {title}
        </h2>
      )}
      {children}
    </section>
  );
}
const Skel = ({ className = "" }: { className?: string }) => <div className={`animate-pulse rounded-lg bg-muted ${className}`} />;
const Err = ({ msg, retry }: { msg: string; retry: () => void }) => (
  <div className="text-sm text-destructive">{msg} <button className="ml-2 underline" onClick={retry}>Retry</button></div>
);

export function ClockWidget() {
  const now = useClock();
  const sec = now?.getSeconds() ?? 0;
  return (
    <Card className="flex flex-col justify-between">
      <p className="text-sm text-muted-foreground">{now?.toLocaleDateString(undefined, { weekday: "long" }) ?? " "}</p>
      <p className="my-3 font-mono text-5xl font-bold tabular-nums text-gradient sm:text-6xl">
        {now ? now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: true }).replace(/\s?[AP]M/i, "") : "--:--"}
        <span className="ml-2 text-2xl text-muted-foreground">{now ? String(sec).padStart(2, "0") : "--"}</span>
        <span className="ml-2 text-lg text-muted-foreground">{now && (now.getHours() >= 12 ? "PM" : "AM")}</span>
      </p>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full bg-gradient-accent transition-all duration-1000 ease-linear" style={{ width: `${(sec / 59) * 100}%` }} />
      </div>
      <p className="mt-3 text-sm">{now?.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}</p>
    </Card>
  );
}

function useWeather() {
  const [s] = useSettings();
  return useQuery({ queryKey: ["weather", s.lat, s.lon, s.unit], queryFn: () => fetchWeather(s.lat, s.lon, s.unit), staleTime: 10 * 60000 });
}

export function WeatherWidget() {
  const [s, setS] = useSettings();
  const q = useWeather();
  return (
    <Card title="Weather">
      {q.isPending ? (
        <div className="space-y-3"><Skel className="h-14 w-32" /><Skel className="h-4 w-48" /></div>
      ) : q.isError ? <Err msg="Couldn't load weather." retry={() => q.refetch()} /> : (() => {
        const c = q.data.current; const { label, Icon } = weatherInfo(c.weather_code);
        return (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-5xl font-bold">{Math.round(c.temperature_2m)}°<span className="text-2xl text-muted-foreground">{s.unit}</span></p>
                <p className="mt-1 text-muted-foreground">{label}</p>
              </div>
              <Icon className="h-16 w-16 text-primary" strokeWidth={1.4} />
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Droplets className="h-4 w-4 text-primary" />{c.relative_humidity_2m}%</span>
              <span className="flex items-center gap-1"><Wind className="h-4 w-4 text-success" />{Math.round(c.wind_speed_10m)} {s.unit === "F" ? "mph" : "km/h"}</span>
              <button className="btn btn-ghost ml-auto !px-2 !py-1 text-xs" onClick={() => setS({ ...s, unit: s.unit === "C" ? "F" : "C" })}>°{s.unit === "C" ? "F" : "C"}</button>
            </div>
          </>
        );
      })()}
    </Card>
  );
}

export function ForecastWidget() {
  const q = useWeather();
  return (
    <Card title="7-Day Forecast">
      {q.isPending ? <div className="flex gap-3">{Array.from({ length: 7 }, (_, i) => <Skel key={i} className="h-28 w-20 shrink-0" />)}</div>
        : q.isError ? <Err msg="Couldn't load forecast." retry={() => q.refetch()} /> : (
          <div className="flex gap-3 overflow-x-auto pb-1">
            {q.data.daily.time.map((t, i) => {
              const { Icon, label } = weatherInfo(q.data.daily.weather_code[i] ?? 0);
              const d = new Date(t + "T12:00");
              return (
                <div key={t} title={label} className="flex min-w-20 flex-1 flex-col items-center gap-2 rounded-xl border border-border bg-muted/40 p-3">
                  <span className="text-xs text-muted-foreground">{i === 0 ? "Today" : d.toLocaleDateString(undefined, { weekday: "short" })}</span>
                  <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                  <span className="text-sm font-semibold">{Math.round(q.data.daily.temperature_2m_max[i] ?? 0)}°</span>
                  <span className="text-xs text-muted-foreground">{Math.round(q.data.daily.temperature_2m_min[i] ?? 0)}°</span>
                </div>
              );
            })}
          </div>
        )}
    </Card>
  );
}

export function PrayerWidget() {
  const [s] = useSettings();
  const now = useClock();
  const q = useQuery({ queryKey: ["prayer", s.lat, s.lon, s.method, now ? ymd(now) : ""], queryFn: () => fetchPrayerTimes(s.lat, s.lon, s.method), enabled: !!now, staleTime: 3600000 });
  let current: PrayerName | null = null, next: PrayerName = PRAYERS[0], diff = 0;
  if (q.data && now) {
    for (const p of PRAYERS) if (toDate(q.data[p], now) <= now) current = p;
    const up = PRAYERS.find((p) => toDate(q.data[p], now) > now);
    if (!current) current = "Isha";
    next = up ?? "Fajr";
    const nd = toDate(q.data[next], now); if (!up) nd.setDate(nd.getDate() + 1);
    diff = Math.max(0, Math.floor((nd.getTime() - now.getTime()) / 1000));
  }
  const fmt = (n: number) => String(n).padStart(2, "0");
  const win = q.data && now ? getPrayerWindow(q.data, now) : null;
  if (q.data && now) current = win?.name ?? null;
  const gap = q.data && now ? getPrayerGap(q.data, now) : null;
  const rem = win ? `${Math.floor(win.remaining / 3600)}h ${Math.floor((win.remaining % 3600) / 60)}m` : "";
  return (
    <Card title="Prayer Times" icon={<Moon className="h-3.5 w-3.5" />}>
      {q.isPending ? <div className="space-y-2">{PRAYERS.map((p) => <Skel key={p} className="h-9" />)}</div>
        : q.isError ? <Err msg="Couldn't load prayer times." retry={() => q.refetch()} /> : (
          <>
            <div className="mb-4 rounded-xl bg-gradient-accent p-4 text-primary-foreground">
              <p className="text-xs font-semibold uppercase opacity-80">Next · {next}</p>
              <p className="font-mono text-3xl font-bold tabular-nums">{fmt(Math.floor(diff / 3600))}:{fmt(Math.floor((diff % 3600) / 60))}:{fmt(diff % 60)}</p>
            </div>
            <ul className="space-y-1.5">
              {PRAYERS.map((p) => (
                <li key={p} className={`flex justify-between rounded-lg px-3 py-2 text-sm ${p === current ? "border border-primary/40 bg-primary/10 text-primary" : "text-muted-foreground"}`}>
                  <span className="font-medium">{p}{p === current && " · now"}</span>
                  <span className="font-mono">{to12h(q.data[p])}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              {win ? (
                <>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-gradient-accent shadow-glow transition-all duration-1000 ease-linear" style={{ width: `${win.pct}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{Math.floor(win.pct)}% elapsed • {rem} remaining until {win.endLabel}</p>
                </>
              ) : gap && (
                <div className={`rounded-xl border p-3 ${gap.kind === "qiyam" ? "border-violet/40 bg-violet/10 shadow-glow-violet" : "border-warning/40 bg-warning/10"}`}>
                  <p className={`text-sm font-semibold ${gap.kind === "qiyam" ? "text-violet" : "text-warning"}`}>{gap.label}</p>
                  <p className="text-xs text-muted-foreground">{gap.next} in <span className="font-mono">{fmt(Math.floor(gap.remaining / 3600))}:{fmt(Math.floor((gap.remaining % 3600) / 60))}:{fmt(gap.remaining % 60)}</span></p>
                </div>
              )}
            </div>
          </>
        )}
    </Card>
  );
}

export function TodayTasksWidget() {
  const [tasks, setTasks] = useTasks();
  const now = useClock();
  const today = now ? ymd(now) : "";
  const list = tasks.filter((t) => t.priority === "High" || (t.due && t.due <= today)).slice(0, 6);
  return (
    <Card title="Today's Focus">
      {list.length === 0 ? <p className="text-sm text-muted-foreground">No high-priority tasks. Enjoy the calm.</p> : (
        <ul className="space-y-2">
          {list.map((t) => (
            <li key={t.id} className={`flex items-center gap-3 rounded-lg px-2 py-1 transition ${t.done ? "bg-success/10 shadow-glow-success" : ""}`}>
              <input type="checkbox" checked={t.done} onChange={() => setTasks((p) => p.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} className={`h-4 w-4 accent-[var(--success)] ${t.done ? "check-pop" : ""}`} />
              <span className={`flex-1 truncate text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</span>
              <span className="text-xs text-muted-foreground">{t.category}</span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
