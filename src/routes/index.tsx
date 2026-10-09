import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClockWidget, ForecastWidget, PrayerWidget, TodayTasksWidget, WeatherWidget } from "@/components/Widgets";
import { ClassScheduleWidget } from "@/components/Classes";
import { useSettings } from "@/lib/store";
import { QuickLinks } from "@/components/QuickLinks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Muhi's Room" },
      { name: "description", content: "Clock, weather, forecast, prayer times and today's tasks at a glance." },
      { property: "og:title", content: "Dashboard — Muhi's Room" },
      { property: "og:description", content: "Clock, weather, forecast, prayer times and today's tasks at a glance." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [{ widgets: w }] = useSettings();
  return (
    <>
      <section className="glass-sheet dashboard-sheet" aria-labelledby="dashboard-heading">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-border px-6 py-5 sm:px-8">
          <Link to="/" className="flex items-center gap-3 text-sm font-semibold" aria-label="Muhi's Room home"><span className="h-2 w-2 rounded-full bg-foreground shadow-glow" />LOGO<span className="hidden font-normal text-muted-foreground xl:inline"> / Muhi’s Room</span></Link>
          <nav aria-label="Dashboard navigation" className="flex flex-wrap items-center gap-3 text-[10px] font-medium sm:gap-5 sm:text-xs">
            <Link to="/" className="glass-top-link" aria-current="page">HOME</Link><span className="text-muted-foreground">|</span>
            <a href="#overview" className="glass-top-link">OVERVIEW</a><span className="text-muted-foreground">|</span>
            <Link to="/tasks" className="glass-top-link">REPORTS</Link><span className="text-muted-foreground">|</span>
            <Link to="/settings" className="glass-top-link">SUPPORT</Link>
          </nav>
        </div>
        <div className="flex flex-wrap items-end justify-between gap-5 px-6 pb-7 pt-9 sm:px-8">
          <div><p className="mb-2 text-xs text-muted-foreground">PERSONAL SPACE / 01</p><h1 id="dashboard-heading" className="text-3xl font-semibold sm:text-4xl">DASHBOARD</h1><p className="mt-3 text-sm text-muted-foreground">Welcome back, Muhi. Your day, in focus.</p></div>
          <Button variant="glass" asChild className="h-12 gap-5 px-5 text-xs"><a href="#quick-links-heading">EXPLORE<ArrowUpRight /></a></Button>
        </div>
      <div id="overview" className="grid scroll-mt-24 gap-0 divide-y divide-border px-1 pb-3 sm:px-3 md:grid-cols-2 xl:grid-cols-3">
        {w.clock && <ClockWidget />}
        {w.weather && <WeatherWidget />}
        {w.prayer && <div className="md:row-span-2"><PrayerWidget /></div>}
        {w.forecast && <div className="min-w-0 md:col-span-2"><ForecastWidget /></div>}
        {w.classes !== false && <ClassScheduleWidget />}
        {w.tasks && <div className="md:col-span-2"><TodayTasksWidget /></div>}
      </div>
      </section>
      <QuickLinks />
    </>
  );
}
