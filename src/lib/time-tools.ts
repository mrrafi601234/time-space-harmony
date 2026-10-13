export interface StopwatchState { elapsed: number; startedAt: number | null; laps: number[] }
export interface TimerState { duration: number; remaining: number; endsAt: number | null; finished: boolean }
export const EMPTY_STOPWATCH: StopwatchState = { elapsed: 0, startedAt: null, laps: [] };
export const EMPTY_TIMER: TimerState = { duration: 300000, remaining: 300000, endsAt: null, finished: false };
export function stopwatchElapsed(state: StopwatchState, now: number) {
  return state.elapsed + (state.startedAt === null ? 0 : Math.max(0, now - state.startedAt));
}
export function timerRemaining(state: TimerState, now: number) {
  return state.endsAt === null ? state.remaining : Math.max(0, state.endsAt - now);
}
export function formatDuration(ms: number, roundUp = false) {
  const seconds = roundUp ? Math.ceil(ms / 1000) : Math.floor(ms / 1000);
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((n) => String(n).padStart(2, "0")).join(":");
}