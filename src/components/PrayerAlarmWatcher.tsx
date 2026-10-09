import { Moon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { playFor } from "@/lib/audio";
import { useSettings, ymd } from "@/lib/store";
import { fetchPrayerTimes, type PrayerName, PRAYERS } from "@/services/prayerService";

export function PrayerAlarmWatcher() {
  const [s] = useSettings();
  const [day, setDay] = useState("");
  useEffect(() => { setDay(ymd(new Date())); }, []);
  const q = useQuery({ queryKey: ["prayer", s.lat, s.lon, s.method, day], queryFn: () => fetchPrayerTimes(s.lat, s.lon, s.method), enabled: !!day, staleTime: 3600000 });
  const [active, setActive] = useState<{ name: PrayerName; silent: boolean } | null>(null);
  const fired = useRef("");
  const stop = useRef<(() => void) | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      if (ymd(n) !== day) setDay(ymd(n));
      if (!q.data || s.prayerAlarm === false) return;
      const hm = `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`;
      const p = PRAYERS.find((x) => q.data[x] === hm);
      const key = p ? p + hm + n.toDateString() : "";
      if (p && fired.current !== key) {
        fired.current = key;
        stop.current?.();
        const r = playFor(60000, s.prayerVolume ?? 0.7);
        stop.current = r.stop;
        setActive({ name: p, silent: r.blocked });
        setTimeout(() => setActive((a) => (a?.name === p ? null : a)), 60000);
        if ("Notification" in window && Notification.permission === "granted") new Notification(`PRAYER TIME - ${p.toUpperCase()}`);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [q.data, day, s.prayerAlarm, s.prayerVolume]);

  if (!active) return null;
  const dismiss = () => { stop.current?.(); stop.current = null; setActive(null); };
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-md">
      <div className="glass w-full max-w-sm p-8 text-center shadow-glow">
        <Moon className="mx-auto h-14 w-14 animate-pulse text-primary" />
        <p className="mt-4 text-3xl font-bold tracking-wide text-gradient">PRAYER TIME - {active.name.toUpperCase()}</p>
        {active.silent && <p className="mt-2 text-sm text-muted-foreground">Sound is blocked by your browser — tap anywhere on the page once to allow it.</p>}
        <button className="btn btn-primary mt-6 w-full" onClick={dismiss}>Dismiss Alarm</button>
      </div>
    </div>
  );
}
