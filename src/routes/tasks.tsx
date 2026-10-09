import { createFileRoute } from "@tanstack/react-router";
import { Pause, Play, Plus, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/Header";
import { Card } from "@/components/Widgets";
import { playSound } from "@/lib/audio";
import { type Category, type Priority, uid, streak, useHabits, useNotes, usePomoLog, useTasks, ymd } from "@/lib/store";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Tasks & Focus — Muhi's Room" },
      { name: "description", content: "To-dos, quick notes, Pomodoro timer and weekly habit tracker." },
      { property: "og:title", content: "Tasks & Focus — Muhi's Room" },
      { property: "og:description", content: "To-dos, quick notes, Pomodoro timer and weekly habit tracker." },
    ],
  }),
  component: TasksPage,
});

const PRI_STYLE: Record<Priority, string> = { High: "text-destructive", Medium: "text-warning", Low: "text-success" };

function TodoList() {
  const [tasks, setTasks] = useTasks();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Work");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState<"All" | "Pending" | "Completed">("All");
  const shown = tasks.filter((t) => filter === "All" || (filter === "Completed" ? t.done : !t.done));
  const add = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setTasks((p) => [{ id: uid(), title: title.trim(), category, priority, due, done: false }, ...p]);
    setTitle(""); setDue("");
  };
  return (
    <Card title="To-Do List" className="lg:col-span-2">
      <form onSubmit={add} className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto_auto]">
        <input className="field" placeholder="What needs doing?" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="field" value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {["Work", "Study", "Personal"].map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className="field" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          {["High", "Medium", "Low"].map((c) => <option key={c}>{c}</option>)}
        </select>
        <input type="date" className="field" value={due} onChange={(e) => setDue(e.target.value)} />
        <button className="btn btn-primary"><Plus className="h-4 w-4" />Add</button>
      </form>
      <div className="my-4 flex gap-2">
        {(["All", "Pending", "Completed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`btn !py-1 text-xs ${filter === f ? "btn-primary" : "btn-ghost"}`}>{f}</button>
        ))}
      </div>
      <ul className="space-y-2">
        {shown.length === 0 && <p className="text-sm text-muted-foreground">Nothing here.</p>}
        {shown.map((t) => (
          <li key={t.id} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${t.done ? "border-success/40 bg-success/10 shadow-glow-success" : "border-border bg-muted/40"}`}>
            <input type="checkbox" checked={t.done} onChange={() => setTasks((p) => p.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} className="h-4 w-4 accent-[var(--primary)]" />
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm ${t.done ? "text-muted-foreground line-through" : ""}`}>{t.title}</p>
              <p className="text-xs text-muted-foreground">
                {t.category} · <span className={PRI_STYLE[t.priority]}>{t.priority}</span>{t.due && ` · due ${t.due}`}
              </p>
            </div>
            <button onClick={() => setTasks((p) => p.filter((x) => x.id !== t.id))} className="text-muted-foreground hover:text-destructive" aria-label="Delete task"><Trash2 className="h-4 w-4" /></button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

const MODES = { Work: 25, "Short Break": 5, "Long Break": 15 } as const;
type Mode = keyof typeof MODES;
function Pomodoro() {
  const [mode, setMode] = useState<Mode>("Work");
  const [left, setLeft] = useState(MODES.Work * 60);
  const [running, setRunning] = useState(false);
  const [log, setLog] = usePomoLog();
  const sessions = log[ymd(new Date())] ?? 0;
  const pStreak = streak(Object.keys(log).filter((k) => (log[k] ?? 0) > 0));
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => {
    if (left > 0) return;
    playSound("bell");
    setRunning(false);
    if (mode === "Work") setLog((p) => { const k = ymd(new Date()); return { ...p, [k]: (p[k] ?? 0) + 1 }; });
    setLeft(MODES[mode] * 60);
  }, [left, mode, setLog]);
  const pick = (m: Mode) => { setMode(m); setRunning(false); setLeft(MODES[m] * 60); };
  const pct = 1 - left / (MODES[mode] * 60);
  return (
    <Card title="Pomodoro">
      <div className="mb-4 flex flex-wrap gap-2">
        {(Object.keys(MODES) as Mode[]).map((m) => (
          <button key={m} onClick={() => pick(m)} className={`btn !py-1 text-xs ${mode === m ? "btn-primary" : "btn-ghost"}`}>{m}</button>
        ))}
      </div>
      <div className="relative mx-auto grid h-44 w-44 place-items-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--muted)" strokeWidth="6" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" strokeDasharray={283} strokeDashoffset={283 * (1 - pct)} className="transition-all duration-1000" />
        </svg>
        <span className="font-mono text-4xl font-bold tabular-nums">{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</span>
      </div>
      <div className="mt-4 flex justify-center gap-2">
        <button className="btn btn-primary" onClick={() => setRunning((r) => !r)}>{running ? <><Pause className="h-4 w-4" />Pause</> : <><Play className="h-4 w-4" />Start</>}</button>
        <button className="btn btn-ghost" onClick={() => pick(mode)}><RotateCcw className="h-4 w-4" />Reset</button>
      </div>
      <p className="mt-3 text-center text-sm text-muted-foreground">Today: <span className="font-semibold text-foreground">{sessions}</span> · 🔥 Streak: <span className="font-semibold text-warning">{pStreak} day{pStreak === 1 ? "" : "s"}</span></p>
    </Card>
  );
}

const NOTE_TINTS = ["border-primary/40 bg-primary/10", "border-success/40 bg-success/10", "border-warning/40 bg-warning/10", "border-indigo/40 bg-indigo/10"];
function Notes() {
  const [notes, setNotes] = useNotes();
  return (
    <Card title="Quick Notes" className="lg:col-span-2">
      <button className="btn btn-ghost mb-3" onClick={() => setNotes((p) => [{ id: uid(), text: "", color: p.length % 4 }, ...p])}><Plus className="h-4 w-4" />New note</button>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {notes.map((n) => (
          <div key={n.id} className={`relative rounded-xl border p-3 ${NOTE_TINTS[n.color]}`}>
            <textarea className="h-28 w-full resize-none bg-transparent text-sm outline-none" placeholder="Type… (auto-saved)" value={n.text}
              onChange={(e) => setNotes((p) => p.map((x) => (x.id === n.id ? { ...x, text: e.target.value } : x)))} />
            <button onClick={() => setNotes((p) => p.filter((x) => x.id !== n.id))} className="absolute right-2 bottom-2 text-muted-foreground hover:text-destructive" aria-label="Delete note"><Trash2 className="h-3.5 w-3.5" /></button>
          </div>
        ))}
        {notes.length === 0 && <p className="text-sm text-muted-foreground">No notes yet.</p>}
      </div>
    </Card>
  );
}

function Habits() {
  const [habits, setHabits] = useHabits();
  const [name, setName] = useState("");
  const week = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return x; });
  }, []);
  const toggle = (id: string, day: string) => setHabits((p) => p.map((h) => h.id !== id ? h : { ...h, checks: h.checks.includes(day) ? h.checks.filter((c) => c !== day) : [...h.checks, day] }));
  return (
    <Card title="Habit Tracker">
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (name.trim()) { setHabits((p) => [...p, { id: uid(), name: name.trim(), checks: [] }]); setName(""); } }}>
        <input className="field flex-1" placeholder="New habit" value={name} onChange={(e) => setName(e.target.value)} />
        <button className="btn btn-primary !px-3" aria-label="Add habit"><Plus className="h-4 w-4" /></button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr><th />{week.map((d) => <th key={d.toISOString()} className="pb-2 text-xs font-normal text-muted-foreground">{d.toLocaleDateString(undefined, { weekday: "narrow" })}</th>)}<th /></tr></thead>
          <tbody>
            {habits.map((h) => (
              <tr key={h.id}>
                <td className="max-w-28 truncate py-1 pr-2">{h.name} <span className="text-xs text-warning">🔥{streak(h.checks)}</span></td>
                {week.map((d) => { const k = ymd(d); const on = h.checks.includes(k); return (
                  <td key={k} className="p-0.5 text-center">
                    <button onClick={() => toggle(h.id, k)} className={`h-7 w-7 rounded-lg border transition ${on ? "check-pop border-success bg-success/80 shadow-glow-success" : "border-border bg-muted/40 hover:border-primary"}`} aria-label={`${h.name} ${k}`} />
                  </td>); })}
                <td><button onClick={() => setHabits((p) => p.filter((x) => x.id !== h.id))} className="pl-1 text-muted-foreground hover:text-destructive" aria-label="Delete habit"><Trash2 className="h-3.5 w-3.5" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {habits.length === 0 && <p className="text-sm text-muted-foreground">Add a habit to start tracking.</p>}
      </div>
    </Card>
  );
}

function TasksPage() {
  return (
    <>
      <PageTitle title="Productivity" sub="Plan, focus and build good habits." />
      <div className="grid gap-5 lg:grid-cols-3">
        <TodoList />
        <Pomodoro />
        <Notes />
        <Habits />
      </div>
    </>
  );
}
