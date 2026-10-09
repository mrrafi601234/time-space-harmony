import { Link } from "@tanstack/react-router";
import { AlarmClock, CalendarDays, LayoutDashboard, ListChecks, Settings } from "lucide-react";

export const NAV = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard },
  { to: "/tasks", label: "Tasks", Icon: ListChecks },
  { to: "/calendar", label: "Calendar", Icon: CalendarDays },
  { to: "/alarms", label: "Alarms", Icon: AlarmClock },
  { to: "/settings", label: "Settings", Icon: Settings },
] as const;

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar p-5 backdrop-blur-xl lg:flex">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-accent font-bold text-primary-foreground shadow-glow">M</div>
        <div>
          <p className="font-bold leading-tight">Muhi's Room</p>
          <p className="text-xs text-muted-foreground">Dashboard</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map(({ to, label, Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground"
            activeProps={{ className: "bg-sidebar-accent !text-foreground shadow-glow ring-1 ring-primary/40" }}
          >
            <Icon className="h-4 w-4" /> {label}
          </Link>
        ))}
      </nav>
      <p className="mt-auto px-2 text-xs text-muted-foreground">Works offline · Data stays on this device</p>
    </aside>
  );
}

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-sidebar-border bg-sidebar pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      {NAV.map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          activeOptions={{ exact: true }}
          className="flex flex-col items-center gap-1 py-2.5 text-[11px] text-muted-foreground"
          activeProps={{ className: "!text-primary drop-shadow-[0_0_8px_var(--primary)]" }}
        >
          <Icon className="h-5 w-5" /> {label}
        </Link>
      ))}
    </nav>
  );
}
