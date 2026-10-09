import { Link } from "@tanstack/react-router";
import { Maximize, MapPin, Minimize, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useClock } from "@/hooks/useClock";
import { useSettings } from "@/lib/store";

export function Header() {
  const now = useClock();
  const [settings] = useSettings();
  const [fs, setFs] = useState(false);
  useEffect(() => {
    const h = () => setFs(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", h);
    return () => document.removeEventListener("fullscreenchange", h);
  }, []);
  const toggle = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());

  return (
    <header className="glass sticky top-3 z-20 mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <MapPin className="h-4 w-4 shrink-0 text-primary" />
        <span className="truncate text-sm font-medium">{settings.city}</span>
        <span className="hidden truncate text-sm text-muted-foreground md:inline">
          · {now?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm tabular-nums text-gradient font-semibold">
          {now?.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }) ?? "--:--:--"}
        </span>
        <button onClick={toggle} className="btn btn-ghost !p-2" aria-label="Toggle full screen">
          {fs ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
        <Link to="/settings" className="btn btn-ghost !p-2" aria-label="Settings">
          <Settings className="h-4 w-4" />
        </Link>
      </div>
    </header>
  );
}

export function PageTitle({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
    </div>
  );
}
