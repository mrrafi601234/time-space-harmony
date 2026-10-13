import { Flag, Pause, Play, RotateCcw, Timer, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/Widgets";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { playSound } from "@/lib/audio";
import { EMPTY_STOPWATCH, EMPTY_TIMER, formatDuration, stopwatchElapsed, timerRemaining } from "@/lib/time-tools";

function useTick(active: boolean) {
  const [now, setNow] = useState(0);
  useEffect(() => {
    setNow(Date.now());
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

function ToolButton({ label, children, ...props }: React.ComponentProps<typeof Button> & { label: string }) {
  return <Button size="icon" variant="secondary" className="h-12 w-12" aria-label={label} title={label} {...props}>{children}</Button>;
}

export function StopwatchWidget() {
  const [state, setState] = useLocalStorage("stopwatch", EMPTY_STOPWATCH);
  const running = state.startedAt !== null;
  const now = useTick(running);
  const elapsed = stopwatchElapsed(state, now || state.startedAt || 0);
  return (
    <Card title="Stopwatch" icon={<Timer className="h-5 w-5" />} className="time-tool">
      <div className="time-reading font-mono font-bold tabular-nums text-foreground" role="timer" aria-label="Stopwatch elapsed time">{formatDuration(elapsed)}</div>
      <p className="mt-1 text-lg text-muted-foreground">{running ? "Running" : elapsed ? "Paused" : "Ready"}<span className="ml-3 font-mono tabular-nums">.{String(Math.floor((elapsed % 1000) / 10)).padStart(2, "0")}</span></p>
      <div className="mt-5 flex gap-3">
        <ToolButton label={running ? "Pause stopwatch" : "Start stopwatch"} variant="default" onClick={() => setState((s) => running ? { ...s, elapsed: stopwatchElapsed(s, Date.now()), startedAt: null } : { ...s, startedAt: Date.now() })}>{running ? <Pause /> : <Play />}</ToolButton>
        <ToolButton label="Record lap" disabled={!running} onClick={() => setState((s) => ({ ...s, laps: [...s.laps, stopwatchElapsed(s, Date.now())] }))}><Flag /></ToolButton>
        <ToolButton label="Reset stopwatch" onClick={() => setState(EMPTY_STOPWATCH)}><RotateCcw /></ToolButton>
      </div>
      {state.laps.length > 0 && <ol className="mt-4 max-h-40 overflow-y-auto border-t border-border pt-3">
        {state.laps.map((lap, i) => <li key={i} className="flex justify-between py-1 text-lg"><span className="text-muted-foreground">Lap {i + 1}</span><span className="font-mono tabular-nums">{formatDuration(lap)}.{String(Math.floor((lap % 1000) / 10)).padStart(2, "0")}</span></li>).reverse()}
      </ol>}
    </Card>
  );
}

export function TimerWidget() {
  const [state, setState] = useLocalStorage("timer", EMPTY_TIMER);
  const running = state.endsAt !== null;
  const now = useTick(running);
  const remaining = timerRemaining(state, now || 0);
  const sounded = useRef<number | null>(null);
  useEffect(() => {
    if (!state.endsAt || !now || remaining > 0) return;
    if (sounded.current !== state.endsAt) {
      sounded.current = state.endsAt;
      try { playSound("chime"); } catch { /* The visual alert remains available when audio is blocked. */ }
    }
    setState((s) => ({ ...s, endsAt: null, remaining: 0, finished: true }));
  }, [state.endsAt, now, remaining, setState]);
  const setDuration = (seconds: number) => {
    const duration = Math.max(0, Math.min(359999, seconds)) * 1000;
    setState({ duration, remaining: duration, endsAt: null, finished: false });
  };
  const totalSeconds = Math.floor(state.duration / 1000);
  return (
    <Card title="Countdown Timer" icon={<Timer className="h-5 w-5" />} className="time-tool">
      <div className={`time-reading font-mono font-bold tabular-nums ${state.finished ? "text-success" : "text-foreground"}`} role="timer" aria-label="Timer remaining time">{formatDuration(remaining, true)}</div>
      <p className={`mt-1 text-lg ${state.finished ? "text-success" : "text-muted-foreground"}`} role={state.finished ? "alert" : undefined}>{state.finished ? "Time’s up!" : running ? "Counting down" : remaining !== state.duration ? "Paused" : "Ready"}</p>
      <fieldset disabled={running || (!state.finished && state.remaining !== state.duration)} className="mt-4 grid grid-cols-3 gap-2">
        {[{ label: "Hours", value: Math.floor(totalSeconds / 3600), multiplier: 3600 }, { label: "Minutes", value: Math.floor((totalSeconds % 3600) / 60), multiplier: 60 }, { label: "Seconds", value: totalSeconds % 60, multiplier: 1 }].map(({ label, value, multiplier }) => (
          <label key={label} className="min-w-0 text-sm text-muted-foreground">{label}<input aria-label={`Timer ${label.toLowerCase()}`} type="number" min="0" max={label === "Hours" ? 99 : 59} className="field mt-1 w-full !rounded-md !text-xl disabled:opacity-50" value={value} onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) setDuration(totalSeconds + (Math.min(label === "Hours" ? 99 : 59, Math.max(0, Math.floor(n))) - value) * multiplier); }} /></label>
        ))}
      </fieldset>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <ToolButton label={running ? "Pause timer" : "Start timer"} variant="default" disabled={!running && remaining <= 0} onClick={() => {
          if (running) setState((s) => ({ ...s, remaining: timerRemaining(s, Date.now()), endsAt: null }));
          else { try { playSound("beep"); } catch { /* Silent fallback. */ } setState((s) => ({ ...s, endsAt: Date.now() + s.remaining, finished: false })); }
        }}>{running ? <Pause /> : <Play />}</ToolButton>
        <ToolButton label="Reset timer" onClick={() => setState((s) => ({ ...s, remaining: s.duration, endsAt: null, finished: false }))}><RotateCcw /></ToolButton>
        {state.finished && <ToolButton label="Dismiss timer alert" onClick={() => setState((s) => ({ ...s, remaining: s.duration, finished: false }))}><X /></ToolButton>}
      </div>
    </Card>
  );
}