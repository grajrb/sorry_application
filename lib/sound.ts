"use client";

/**
 * Tiny Web-Audio-powered sound effects.
 *
 * Everything is synthesised on the fly (no .mp3 assets to ship, nothing to
 * load) so the page stays a pure static bundle. Sounds are muted by default
 * only if the visitor asks us to via the speaker button in the top nav.
 */

type Listener = (muted: boolean) => void;

let muted = false;
const listeners = new Set<Listener>();
let audioCtx: AudioContext | null = null;

/* ------------------------------------------------------------------ */
/*  Engine                                                            */
/* ------------------------------------------------------------------ */

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!audioCtx) audioCtx = new Ctor();
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

interface ToneOptions {
  type?: OscillatorType;
  gain?: number;
  /** When present the pitch glides from `freq` to `sweepTo`. */
  sweepTo?: number;
}

function tone(freq: number, delay: number, duration: number, options: ToneOptions = {}): void {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    const start = ctx.currentTime + delay;
    const peak = options.gain ?? 0.05;

    osc.type = options.type ?? "sine";
    osc.frequency.setValueAtTime(freq, start);
    if (options.sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(40, options.sweepTo), start + duration);
    }

    amp.gain.setValueAtTime(0.0001, start);
    amp.gain.exponentialRampToValueAtTime(peak, start + 0.02);
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(amp).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  } catch {
    /* audio is a nice-to-have — never break the page over it */
  }
}

/* ------------------------------------------------------------------ */
/*  Cute little sounds                                                */
/* ------------------------------------------------------------------ */

export function playPop(): void {
  if (muted) return;
  tone(660, 0, 0.12, { type: "triangle", gain: 0.05 });
  tone(990, 0.06, 0.12, { type: "triangle", gain: 0.035 });
}

export function playSparkle(): void {
  if (muted) return;
  [880, 1174.66, 1567.98, 2093].forEach((f, i) =>
    tone(f, i * 0.05, 0.2, { type: "sine", gain: 0.03 }),
  );
}

export function playHappy(): void {
  if (muted) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    tone(f, i * 0.11, 0.55, { type: "triangle", gain: 0.05 }),
  );
}

export function playSad(): void {
  if (muted) return;
  [415.3, 349.23, 293.66].forEach((f, i) => tone(f, i * 0.14, 0.32, { type: "sine", gain: 0.04 }));
}

export function playSwoosh(): void {
  if (muted) return;
  tone(880, 0, 0.22, { type: "sine", gain: 0.03, sweepTo: 220 });
}

export function playChime(): void {
  if (muted) return;
  [659.25, 987.77, 1318.51].forEach((f, i) => tone(f, i * 0.08, 0.4, { type: "sine", gain: 0.035 }));
}

/* ------------------------------------------------------------------ */
/*  Mute state (shared, React-friendly)                               */
/* ------------------------------------------------------------------ */

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  // Don't let a preview sound fire while we're switching to muted.
  if (!next) playPop();
  listeners.forEach((listener) => listener(muted));
}

export function toggleMuted(): void {
  setMuted(!muted);
}

export function subscribeMuted(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
