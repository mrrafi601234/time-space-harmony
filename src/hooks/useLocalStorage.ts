import { useCallback, useSyncExternalStore } from "react";

export const STORAGE_PREFIX = "muhi:";
const EVT = "muhi-ls-change";
const cache = new Map<string, { raw: string | null; val: unknown }>();

function read<T>(key: string, def: T): T {
  const raw = localStorage.getItem(STORAGE_PREFIX + key);
  const c = cache.get(key);
  if (c && c.raw === raw) return c.val as T;
  let val: T = def;
  if (raw) {
    try { val = JSON.parse(raw); } catch { val = def; }
  }
  cache.set(key, { raw, val });
  return val;
}

function subscribe(cb: () => void) {
  window.addEventListener(EVT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function useLocalStorage<T>(key: string, def: T) {
  const value = useSyncExternalStore(subscribe, () => read(key, def), () => def);
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = read(key, def);
      const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(v));
      window.dispatchEvent(new Event(EVT));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  return [value, set] as const;
}

export function notifyStorageChange() {
  cache.clear();
  window.dispatchEvent(new Event(EVT));
}
