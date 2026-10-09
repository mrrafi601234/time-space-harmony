import { createFileRoute } from "@tanstack/react-router";
import { Download, Search, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { playFor } from "@/lib/audio";
import { PageTitle } from "@/components/Header";
import { Card } from "@/components/Widgets";
import { ClassManager } from "@/components/Classes";
import { notifyStorageChange, STORAGE_PREFIX } from "@/hooks/useLocalStorage";
import { useSettings, type WidgetKey } from "@/lib/store";
import { METHODS } from "@/services/prayerService";
import { type GeoResult, searchCity } from "@/services/weatherService";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Muhi's Room" },
      { name: "description", content: "Location, units, prayer method, widgets and data backup." },
      { property: "og:title", content: "Settings — Muhi's Room" },
      { property: "og:description", content: "Location, units, prayer method, widgets and data backup." },
    ],
  }),
  component: SettingsPage,
});

const WIDGETS: { key: WidgetKey; label: string }[] = [
  { key: "clock", label: "Clock & Date" }, { key: "weather", label: "Current Weather" },
  { key: "forecast", label: "7-Day Forecast" }, { key: "prayer", label: "Prayer Times" }, { key: "tasks", label: "Today's Tasks" }, { key: "classes", label: "Class Schedule" },
];

function SettingsPage() {
  const [s, setS] = useSettings();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeoResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [lat, setLat] = useState(""); const [lon, setLon] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const stopTest = useRef<(() => void) | null>(null);

  const search = async (e: React.FormEvent) => {
    e.preventDefault(); if (!q.trim()) return;
    setBusy(true); setErr("");
    try { const r = await searchCity(q); setResults(r); if (!r.length) setErr("No matches."); } catch { setErr("Search failed."); }
    setBusy(false);
  };
  const exportData = () => {
    const data: Record<string, unknown> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(STORAGE_PREFIX)) continue;
      const value = localStorage.getItem(k);
      if (value) data[k.slice(STORAGE_PREFIX.length)] = JSON.parse(value);
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = `muhi-room-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const importData = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(STORAGE_PREFIX + k, JSON.stringify(v)));
      notifyStorageChange(); setMsg("Data restored ✓");
    } catch { setMsg("That file couldn't be read."); }
  };
  const reset = () => {
    if (!confirm("Erase all tasks, notes, habits, events, alarms and settings? This can't be undone.")) return;
    Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_PREFIX)).forEach((k) => localStorage.removeItem(k));
    notifyStorageChange(); setMsg("All data cleared.");
  };

  return (
    <>
      <PageTitle title="Settings" sub="Everything is stored on this device only." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Location">
          <p className="mb-3 text-sm">Current: <span className="font-semibold">{s.city}</span> <span className="text-muted-foreground">({s.lat.toFixed(3)}, {s.lon.toFixed(3)})</span></p>
          <form onSubmit={search} className="flex gap-2">
            <input className="field flex-1" placeholder="Search a city…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="btn btn-primary" disabled={busy}><Search className="h-4 w-4" />Search</button>
          </form>
          {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
          <ul className="mt-2 space-y-1">
            {results.map((r) => (
              <li key={`${r.latitude}${r.longitude}`}>
                <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-accent" onClick={() => { setS({ ...s, city: [r.name, r.admin1, r.country].filter(Boolean).join(", "), lat: r.latitude, lon: r.longitude }); setResults([]); setQ(""); }}>
                  {r.name}<span className="text-muted-foreground">{r.admin1 && `, ${r.admin1}`}{r.country && `, ${r.country}`}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 mb-2 text-xs text-muted-foreground">Or enter coordinates</p>
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); const la = parseFloat(lat), lo = parseFloat(lon); if (Math.abs(la) <= 90 && Math.abs(lo) <= 180) { setS({ ...s, lat: la, lon: lo, city: `${la.toFixed(2)}, ${lo.toFixed(2)}` }); setLat(""); setLon(""); } }}>
            <input className="field w-full" placeholder="Latitude" inputMode="decimal" value={lat} onChange={(e) => setLat(e.target.value)} />
            <input className="field w-full" placeholder="Longitude" inputMode="decimal" value={lon} onChange={(e) => setLon(e.target.value)} />
            <button className="btn btn-ghost">Set</button>
          </form>
        </Card>
        <Card title="Preferences">
          <p className="mb-2 text-sm">Temperature unit</p>
          <div className="mb-5 flex gap-2">
            {(["C", "F"] as const).map((u) => <button key={u} onClick={() => setS({ ...s, unit: u })} className={`btn ${s.unit === u ? "btn-primary" : "btn-ghost"}`}>°{u}</button>)}
          </div>
          <p className="mb-2 text-sm">Prayer calculation method</p>
          <select className="field w-full" value={s.method} onChange={(e) => setS({ ...s, method: Number(e.target.value) })}>
            {METHODS.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Card>
        <Card title="Prayer Settings">
          <label className="mb-4 flex items-center justify-between text-sm">Prayer time alarm (1 minute)
            <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={s.prayerAlarm !== false} onChange={(e) => setS({ ...s, prayerAlarm: e.target.checked })} />
          </label>
          <p className="mb-2 text-sm">Alarm volume: {Math.round((s.prayerVolume ?? 0.7) * 100)}%</p>
          <input type="range" min={0} max={1} step={0.05} className="mb-4 w-full accent-[var(--primary)]" value={s.prayerVolume ?? 0.7} onChange={(e) => setS({ ...s, prayerVolume: Number(e.target.value) })} />
          <div className="flex gap-2">
            <button className="btn btn-primary" onClick={() => { stopTest.current?.(); stopTest.current = playFor(60000, s.prayerVolume ?? 0.7).stop; }}>Test 1-minute alarm</button>
            <button className="btn btn-ghost" onClick={() => { stopTest.current?.(); stopTest.current = null; }}>Stop</button>
          </div>
        </Card>
        <Card title="Dashboard widgets">
          <ul className="space-y-2">
            {WIDGETS.map((w) => (
              <li key={w.key}>
                <label className="flex cursor-pointer items-center justify-between rounded-lg px-1 py-1.5 text-sm">
                  {w.label}
                  <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={s.widgets[w.key] !== false} onChange={(e) => setS({ ...s, widgets: { ...s.widgets, [w.key]: e.target.checked } })} />
                </label>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border pt-4">
            <p className="mb-3 text-sm">Background style</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Background style">
              <Button variant={s.backgroundMode !== "particles" ? "default" : "outline"} aria-pressed={s.backgroundMode !== "particles"} onClick={() => setS({ ...s, backgroundMode: "images" })}>Dynamic images</Button>
              <Button variant={s.backgroundMode === "particles" ? "default" : "outline"} aria-pressed={s.backgroundMode === "particles"} onClick={() => setS({ ...s, backgroundMode: "particles" })}>Canvas particles</Button>
            </div>
          </div>
          <label className="mt-3 flex items-center justify-between px-1 pt-3 text-sm">Ambient background
            <input type="checkbox" className="h-4 w-4 accent-[var(--primary)]" checked={s.ambient !== false} onChange={(e) => setS({ ...s, ambient: e.target.checked })} />
          </label>
        </Card>
        <ClassManager />
        <Card title="Data">
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-ghost" onClick={exportData}><Download className="h-4 w-4" />Export JSON</button>
            <button className="btn btn-ghost" onClick={() => file.current?.click()}><Upload className="h-4 w-4" />Import JSON</button>
            <input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ""; }} />
            <button className="btn border border-destructive/40 bg-destructive/15 text-destructive hover:bg-destructive/25" onClick={reset}><Trash2 className="h-4 w-4" />Reset all</button>
          </div>
          {msg && <p className="mt-3 text-sm text-muted-foreground">{msg}</p>}
        </Card>
      </div>
    </>
  );
}
