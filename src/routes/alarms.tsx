import { createFileRoute } from "@tanstack/react-router";
import { Bell, BellOff, Pencil, Plus, Trash2, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/Header";
import { Card } from "@/components/Widgets";
import { playSound } from "@/lib/audio";
import { type Alarm, type SoundKey, uid, useAlarms } from "@/lib/store";
import { to12h } from "@/services/prayerService";

export const Route = createFileRoute("/alarms")({
  head: () => ({
    meta: [
      { title: "Alarms — Muhi's Room" },
      { name: "description", content: "Recurring and one-off alarms with custom sounds." },
      { property: "og:title", content: "Alarms — Muhi's Room" },
      { property: "og:description", content: "Recurring and one-off alarms with custom sounds." },
    ],
  }),
  component: AlarmsPage,
});

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const SOUNDS: SoundKey[] = ["chime", "beep", "digital"];
const blank = (): Alarm => ({ id: "", label: "", time: "07:00", days: [], enabled: true, sound: "chime" });

function AlarmsPage() {
  const [alarms, setAlarms] = useAlarms();
  const [draft, setDraft] = useState<Alarm>(blank);
  const [perm, setPerm] = useState<string>("default");
  useEffect(() => { setPerm("Notification" in window ? Notification.permission : "unsupported"); }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (draft.id) setAlarms((p) => p.map((a) => (a.id === draft.id ? draft : a)));
    else setAlarms((p) => [...p, { ...draft, id: uid() }]);
    setDraft(blank());
  };
  const sorted = [...alarms].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <>
      <PageTitle title="Alarms & Audio" sub="Keep this tab open for alarms to ring." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title={draft.id ? "Edit alarm" : "New alarm"}>
          <form onSubmit={save} className="space-y-3">
            <input type="time" required className="field w-full font-mono text-2xl" value={draft.time} onChange={(e) => setDraft({ ...draft, time: e.target.value })} />
            <input className="field w-full" placeholder="Label (e.g. Fajr, Class)" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
            <div>
              <p className="mb-1.5 text-xs text-muted-foreground">Repeat (none = once)</p>
              <div className="flex gap-1.5">
                {DAYS.map((d, i) => { const on = draft.days.includes(i); return (
                  <button type="button" key={i} onClick={() => setDraft({ ...draft, days: on ? draft.days.filter((x) => x !== i) : [...draft.days, i] })} className={`h-8 w-8 rounded-full text-xs font-semibold ${on ? "bg-gradient-accent text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{d}</button>); })}
              </div>
            </div>
            <div className="flex gap-2">
              <select className="field flex-1 capitalize" value={draft.sound} onChange={(e) => setDraft({ ...draft, sound: e.target.value as SoundKey })}>
                {SOUNDS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <button type="button" className="btn btn-ghost" onClick={() => playSound(draft.sound)} aria-label="Preview sound"><Volume2 className="h-4 w-4" /></button>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-primary flex-1"><Plus className="h-4 w-4" />{draft.id ? "Save" : "Add alarm"}</button>
              {draft.id && <button type="button" className="btn btn-ghost" onClick={() => setDraft(blank())}>Cancel</button>}
            </div>
          </form>
          <div className="mt-5 flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm">
            {perm === "granted" ? <Bell className="h-4 w-4 text-success" /> : <BellOff className="h-4 w-4 text-warning" />}
            <span className="flex-1">Notifications: <span className="font-semibold capitalize">{perm}</span></span>
            {perm === "default" && <button className="btn btn-ghost !py-1 text-xs" onClick={async () => setPerm(await Notification.requestPermission())}>Enable</button>}
          </div>
        </Card>
        <Card title="Your alarms" className="lg:col-span-2">
          {sorted.length === 0 && <p className="text-sm text-muted-foreground">No alarms yet.</p>}
          <ul className="space-y-2">
            {sorted.map((a) => (
              <li key={a.id} className="flex items-center gap-4 rounded-xl border border-border bg-muted/40 p-4">
                <div className="min-w-0 flex-1">
                  <p className={`font-mono text-2xl font-bold ${a.enabled ? "" : "text-muted-foreground"}`}>{to12h(a.time)}</p>
                  <p className="truncate text-xs text-muted-foreground">{a.label || "Alarm"} · {a.days.length ? a.days.sort().map((d) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d]).join(", ") : "Once"} · {a.sound}</p>
                </div>
                <button onClick={() => setDraft(a)} className="text-muted-foreground hover:text-foreground" aria-label="Edit"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setAlarms((p) => p.filter((x) => x.id !== a.id))} className="text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
                <button role="switch" aria-checked={a.enabled} aria-label="Toggle alarm" onClick={() => setAlarms((p) => p.map((x) => (x.id === a.id ? { ...x, enabled: !x.enabled } : x)))} className={`relative h-6 w-11 shrink-0 rounded-full transition ${a.enabled ? "bg-gradient-accent" : "bg-muted"}`}>
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-foreground transition-all ${a.enabled ? "left-5.5" : "left-0.5"}`} />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
