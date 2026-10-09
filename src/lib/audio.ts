import type { SoundKey } from "./store";

let ctx: AudioContext | null = null;
const ac = () => (ctx ??= new AudioContext());

let gainMul = 1;
function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.3) {
  const c = ac();
  vol = Math.max(0.0011, vol * gainMul);
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, c.currentTime + start);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + start);
  o.stop(c.currentTime + start + dur + 0.05);
}

export function playSound(s: SoundKey | "bell") {
  if (ac().state === "suspended") void ac().resume();
  if (s === "beep") { tone(880, 0, 0.15, "square", 0.15); tone(880, 0.25, 0.15, "square", 0.15); }
  else if (s === "chime") { tone(659, 0, 0.8); tone(784, 0.2, 0.8); tone(1047, 0.4, 1.2); }
  else if (s === "digital") { [0, 0.1, 0.2, 0.3].forEach((t) => tone(1400, t, 0.07, "square", 0.12)); }
  else { tone(523, 0, 2, "sine", 0.35); tone(1046, 0, 1.6, "sine", 0.15); tone(1568, 0, 1, "sine", 0.08); }
}

export function loopSound(s: SoundKey) {
  playSound(s);
  const id = setInterval(() => playSound(s), 1500);
  return () => clearInterval(id);
}

/** Plays the chime for `ms` (default 60s) at volume 0-1. Returns stop fn and whether audio is allowed. */
export function playFor(ms = 60000, volume = 0.7): { stop: () => void; blocked: boolean } {
  let blocked = false;
  try {
    const c = ac();
    if (c.state === "suspended") void c.resume();
    blocked = c.state !== "running";
  } catch { return { stop: () => {}, blocked: true }; }
  const play = () => { gainMul = volume * 2; try { playSound("chime"); } finally { gainMul = 1; } };
  play();
  const id = setInterval(play, 1800);
  const t = setTimeout(() => clearInterval(id), ms);
  return { stop: () => { clearInterval(id); clearTimeout(t); }, blocked };
}
