import { createFileRoute } from "@tanstack/react-router";
import { PageTitle } from "@/components/Header";
import { ClockWidget, ForecastWidget, PrayerWidget, TodayTasksWidget, WeatherWidget } from "@/components/Widgets";
import { ClassScheduleWidget } from "@/components/Classes";
import { useSettings } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Muhi's Room" },
      { name: "description", content: "Clock, weather, forecast, prayer times and today's tasks at a glance." },
      { property: "og:title", content: "Dashboard — Muhi's Room" },
      { property: "og:description", content: "Clock, weather, forecast, prayer times and today's tasks at a glance." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [{ widgets: w }] = useSettings();
  return (
    <>
      <PageTitle title="Welcome back, Muhi" sub="Here's your room at a glance." />
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {w.clock && <ClockWidget />}
        {w.weather && <WeatherWidget />}
        {w.prayer && <div className="md:row-span-2"><PrayerWidget /></div>}
        {w.forecast && <div className="md:col-span-2"><ForecastWidget /></div>}
        {w.classes !== false && <ClassScheduleWidget />}
        {w.tasks && <div className="md:col-span-2"><TodayTasksWidget /></div>}
      </div>
    </>
  );
}
