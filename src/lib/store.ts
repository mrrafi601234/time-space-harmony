import { useLocalStorage } from "@/hooks/useLocalStorage";

export type WidgetKey = "clock" | "weather" | "forecast" | "prayer" | "tasks";
export interface Settings {
  city: string;
  lat: number;
  lon: number;
  unit: "C" | "F";
  method: number;
  widgets: Record<WidgetKey, boolean>;
}
export const DEFAULT_SETTINGS: Settings = {
  city: "Brockton, MA",
  lat: 42.0834,
  lon: -71.0184,
  unit: "F",
  method: 2,
  widgets: { clock: true, weather: true, forecast: true, prayer: true, tasks: true },
};
export const useSettings = () => useLocalStorage<Settings>("settings", DEFAULT_SETTINGS);

export type Category = "Work" | "Study" | "Personal";
export type Priority = "High" | "Medium" | "Low";
export interface Task { id: string; title: string; category: Category; priority: Priority; due: string; done: boolean }
const NO_TASKS: Task[] = [];
export const useTasks = () => useLocalStorage<Task[]>("tasks", NO_TASKS);

export interface Note { id: string; text: string; color: number }
const NO_NOTES: Note[] = [];
export const useNotes = () => useLocalStorage<Note[]>("notes", NO_NOTES);

export interface Habit { id: string; name: string; checks: string[] }
const NO_HABITS: Habit[] = [];
export const useHabits = () => useLocalStorage<Habit[]>("habits", NO_HABITS);

export type EventType = "Event" | "Exam" | "Class" | "Deadline";
export interface CalEvent { id: string; date: string; title: string; type: EventType }
const NO_EVENTS: CalEvent[] = [];
export const useEvents = () => useLocalStorage<CalEvent[]>("events", NO_EVENTS);

export type SoundKey = "beep" | "chime" | "digital";
export interface Alarm { id: string; label: string; time: string; days: number[]; enabled: boolean; sound: SoundKey }
const NO_ALARMS: Alarm[] = [];
export const useAlarms = () => useLocalStorage<Alarm[]>("alarms", NO_ALARMS);

export const uid = () => Math.random().toString(36).slice(2, 10);
export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const daysUntil = (date: string) => {
  const [y, m, d] = date.split("-").map(Number);
  const t = new Date(y, m - 1, d).getTime();
  const n = new Date(); n.setHours(0, 0, 0, 0);
  return Math.round((t - n.getTime()) / 86400000);
};
