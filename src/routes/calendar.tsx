import { createFileRoute } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { PageTitle } from "@/components/Header";
import { Card } from "@/components/Widgets";
import { useClock } from "@/hooks/useClock";
import { daysUntil, type EventType, uid, useEvents, ymd } from "@/lib/store";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — Muhi's Room" },
      { name: "description", content: "Monthly calendar for events, exams, classes, deadlines and countdowns." },
      { property: "og:title", content: "Calendar — Muhi's Room" },
      { property: "og:description", content: "Monthly calendar for events, exams, classes, deadlines and countdowns." },
    ],
  }),
  component: CalendarPage,
});

const TYPE_DOT: Record<EventType, string> = { Event: "bg-primary", Exam: "bg-destructive", Class: "bg-success", Deadline: "bg-warning" };

function CalendarPage() {
  const now = useClock();
  const [events, setEvents] = useEvents();
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [selected, setSelected] = useState<string>(() => ymd(new Date()));
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("Event");
  const today = now ? ymd(now) : "";

  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1))];
  const move = (n: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  const dayEvents = events.filter((e) => e.date === selected);
  const upcoming = events.filter((e) => daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8);

  return (
    <>
      <PageTitle title="Calendar" sub="Tap a date to add events, exams, classes or deadlines." />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
            <div className="flex gap-2">
              <button className="btn btn-ghost !p-2" onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></button>
              <button className="btn btn-ghost !p-2" onClick={() => move(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => <div key={d} className="py-2">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (!d) return <div key={i} />;
              const k = ymd(d); const evs = events.filter((e) => e.date === k);
              return (
                <button key={k} onClick={() => setSelected(k)} className={`flex aspect-square flex-col items-center justify-start rounded-xl border p-1 text-sm transition sm:aspect-[4/3] ${k === selected ? "border-primary bg-primary/15" : "border-border bg-muted/30 hover:border-primary/50"} ${k === today ? "font-bold text-primary" : ""}`}>
                  {d.getDate()}
                  <div className="mt-auto flex flex-wrap justify-center gap-0.5">{evs.slice(0, 4).map((e) => <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT[e.type]}`} />)}</div>
                </button>
              );
            })}
          </div>
        </Card>
        <div className="space-y-5">
          <Card title={new Date(selected + "T12:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}>
            <form className="mb-3 grid gap-2" onSubmit={(e) => { e.preventDefault(); if (title.trim()) { setEvents((p) => [...p, { id: uid(), date: selected, title: title.trim(), type }]); setTitle(""); } }}>
              <input className="field" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <div className="flex gap-2">
                <select className="field flex-1" value={type} onChange={(e) => setType(e.target.value as EventType)}>
                  {(["Event", "Exam", "Class", "Deadline"] as const).map((t) => <option key={t}>{t}</option>)}
                </select>
                <button className="btn btn-primary"><Plus className="h-4 w-4" />Add</button>
              </div>
            </form>
            <ul className="space-y-2">
              {dayEvents.length === 0 && <p className="text-sm text-muted-foreground">No items on this day.</p>}
              {dayEvents.map((e) => (
                <li key={e.id} className="flex items-center gap-2 text-sm">
                  <span className={`h-2 w-2 rounded-full ${TYPE_DOT[e.type]}`} />
                  <span className="flex-1 truncate">{e.title}</span>
                  <span className="text-xs text-muted-foreground">{e.type}</span>
                  <button onClick={() => setEvents((p) => p.filter((x) => x.id !== e.id))} className="text-muted-foreground hover:text-destructive" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Upcoming Countdowns">
            <ul className="space-y-2">
              {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Nothing coming up.</p>}
              {upcoming.map((e) => { const n = daysUntil(e.date); return (
                <li key={e.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="truncate">{e.type === "Event" ? "" : e.type + ": "}{e.title}</span>
                  <span className="shrink-0 font-semibold text-primary">{n === 0 ? "Today" : n === 1 ? "Tomorrow" : `in ${n} days`}</span>
                </li>); })}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
