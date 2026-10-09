import { AlarmClock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { loopSound } from "@/lib/audio";
import { type Alarm, useAlarms } from "@/lib/store";

export function AlarmWatcher() {
  const [alarms, setAlarms] = useAlarms();
  const [ringing, setRinging] = useState<Alarm | null>(null);
  const fired = useRef<string>("");
  const stop = useRef<(() => void) | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      const hm = `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
      const a = alarms.find((x) => x.enabled && x.time === hm && (x.days.length === 0 || x.days.includes(n.getDay())));
      const key = a ? a.id + hm + n.toDateString() : "";
      if (a && fired.current !== key) {
        fired.current = key;
        setRinging(a);
        stop.current?.();
        stop.current = loopSound(a.sound);
        if ("Notification" in window && Notification.permission === "granted") new Notification(`⏰ ${a.label || "Alarm"}`, { body: hm });
        if (a.days.length === 0) setAlarms((p) => p.map((x) => (x.id === a.id ? { ...x, enabled: false } : x)));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [alarms, setAlarms]);

  const dismiss = () => { stop.current?.(); stop.current = null; setRinging(null); };
  const snooze = () => {
    if (!ringing) return;
    const d = new Date(Date.now() + 5 * 60000);
    const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    setAlarms((p) => [...p, { ...ringing, id: Math.random().toString(36).slice(2), time, days: [], enabled: true, label: `${ringing.label || "Alarm"} (snoozed)` }]);
    dismiss();
  };

  if (!ringing) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-md">
      <div className="glass w-full max-w-sm p-8 text-center shadow-glow">
        <AlarmClock className="mx-auto h-14 w-14 animate-bounce text-primary" />
        <p className="mt-4 font-mono text-5xl font-bold text-gradient">{ringing.time}</p>
        <p className="mt-2 text-lg">{ringing.label || "Alarm"}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="btn btn-ghost" onClick={snooze}>Snooze 5m</button>
          <button className="btn btn-primary" onClick={dismiss}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}
