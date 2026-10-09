import { GraduationCap, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Card } from "@/components/Widgets";
import { useClock } from "@/hooks/useClock";
import { type ClassItem, uid, useClasses } from "@/lib/store";
import { to12h, toDate } from "@/services/prayerService";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function ClassScheduleWidget() {
  const [classes] = useClasses();
  const now = useClock();
  if (!now) return <Card title="Today's Class Schedule"><div className="h-16 animate-pulse rounded-lg bg-muted" /></Card>;
  const today = classes.filter((c) => c.days.includes(now.getDay())).sort((a, b) => a.start.localeCompare(b.start));
  const left = today.filter((c) => toDate(c.end, now) > now);
  return (
    <Card title="Today's Class Schedule" icon={<GraduationCap className="h-3.5 w-3.5" />}>
      {today.length === 0 ? <p className="text-sm text-muted-foreground">No classes scheduled today. Add them in Settings.</p>
        : left.length === 0 ? <p className="text-sm text-success">No more classes today!</p> : (
          <ul className="space-y-2">
            {left.map((c) => {
              const s = toDate(c.start, now), e = toDate(c.end, now);
              const live = now >= s && now < e;
              const pct = live ? ((now.getTime() - s.getTime()) / (e.getTime() - s.getTime())) * 100 : 0;
              const mins = Math.ceil((e.getTime() - now.getTime()) / 60000);
              return (
                <li key={c.id} className={`rounded-xl border p-3 ${live ? "border-success/50 bg-success/10 shadow-glow-success" : "border-border bg-muted/40"}`}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-semibold">{c.subject}</p>
                    {live && <span className="animate-pulse rounded-full bg-success px-2 py-0.5 text-[10px] font-bold text-primary-foreground">LIVE NOW</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{to12h(c.start)}–{to12h(c.end)}{c.room && ` · ${c.room}`}{c.instructor && ` · ${c.instructor}`}</p>
                  {live && (
                    <>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-success transition-all duration-1000" style={{ width: `${pct}%` }} /></div>
                      <p className="mt-1 text-xs text-muted-foreground">{mins} min remaining</p>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
    </Card>
  );
}

const EMPTY = { subject: "", instructor: "", room: "", start: "09:00", end: "10:00" };
export function ClassManager() {
  const [classes, setClasses] = useClasses();
  const [f, setF] = useState(EMPTY);
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.subject.trim() || f.end <= f.start || days.length === 0) return;
    setClasses((p) => [...p, { id: uid(), ...f, subject: f.subject.trim(), days } satisfies ClassItem]);
    setF(EMPTY);
  };
  return (
    <Card title="Class Routine" className="lg:col-span-2">
      <form onSubmit={add} className="grid gap-2 sm:grid-cols-3">
        <input className="field" placeholder="Subject" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
        <input className="field" placeholder="Instructor" value={f.instructor} onChange={(e) => setF({ ...f, instructor: e.target.value })} />
        <input className="field" placeholder="Room / building" value={f.room} onChange={(e) => setF({ ...f, room: e.target.value })} />
        <label className="flex items-center gap-2 text-sm">Start<input type="time" className="field flex-1" value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></label>
        <label className="flex items-center gap-2 text-sm">End<input type="time" className="field flex-1" value={f.end} onChange={(e) => setF({ ...f, end: e.target.value })} /></label>
        <button className="btn btn-primary"><Plus className="h-4 w-4" />Add class</button>
        <div className="flex flex-wrap gap-1 sm:col-span-3">
          {DAYS.map((d, i) => (
            <button type="button" key={d} onClick={() => setDays((p) => (p.includes(i) ? p.filter((x) => x !== i) : [...p, i]))} className={`btn !px-2.5 !py-1 text-xs ${days.includes(i) ? "btn-primary" : "btn-ghost"}`}>{d}</button>
          ))}
        </div>
      </form>
      <ul className="mt-4 space-y-2">
        {classes.length === 0 && <p className="text-sm text-muted-foreground">No classes yet.</p>}
        {classes.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{c.subject}</p>
              <p className="text-xs text-muted-foreground">{c.days.map((d) => DAYS[d]).join(", ")} · {to12h(c.start)}–{to12h(c.end)}{c.room && ` · ${c.room}`}</p>
            </div>
            <button onClick={() => setClasses((p) => p.filter((x) => x.id !== c.id))} className="text-muted-foreground hover:text-destructive" aria-label="Delete class"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </Card>
  );
}
