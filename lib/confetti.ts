"use client";

/**
 * Heart-flavoured confetti helpers built on top of canvas-confetti.
 *
 * `canvas-confetti` touches the DOM the moment it is imported, so it is
 * pulled in lazily (browser only) — this keeps the static prerender happy
 * while every helper below stays fire-and-forget for the UI.
 */

import type confettiLib from "canvas-confetti";

type ConfettiFn = typeof confettiLib;
type ConfettiShape = ReturnType<ConfettiFn["shapeFromText"]>;
type ConfettiOptions = Parameters<ConfettiFn>[0];

const PALETTE = [
  "#4299E1",
  "#2B6CB0",
  "#9F7AEA",
  "#B794F4",
  "#ED64A6",
  "#FBB6CE",
  "#E9C79A",
  "#38A169",
];

let loader: Promise<ConfettiFn | null> | null = null;
let heartShapes: ConfettiShape[] | undefined;

function loadConfetti(): Promise<ConfettiFn | null> {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!loader) {
    loader = import("canvas-confetti")
      .then((mod) => {
        const maybeInterop = mod as unknown as { default?: ConfettiFn };
        return maybeInterop.default ?? (mod as unknown as ConfettiFn);
      })
      .catch(() => null);
  }
  return loader;
}

/** Emoji shapes for the heart explosions (falls back to plain confetti). */
function getHeartShapes(confetti: ConfettiFn): ConfettiShape[] | undefined {
  if (typeof confetti.shapeFromText !== "function") return undefined;
  if (!heartShapes) {
    try {
      heartShapes = [
        confetti.shapeFromText({ text: "💙", scalar: 2 }),
        confetti.shapeFromText({ text: "💖", scalar: 2 }),
        confetti.shapeFromText({ text: "🌺", scalar: 1.8 }),
        confetti.shapeFromText({ text: "⭐", scalar: 1.6 }),
      ];
    } catch {
      heartShapes = undefined;
    }
  }
  return heartShapes;
}

const base = (confetti: ConfettiFn, shapes: ConfettiShape[] | undefined): ConfettiOptions => ({
  colors: PALETTE,
  shapes,
  disableForReducedMotion: true,
  zIndex: 90,
});

/* ------------------------------------------------------------------ */
/*  Effects                                                           */
/* ------------------------------------------------------------------ */

/** A single juicy pop of hearts + confetti from one spot on the screen. */
export async function heartBurst(options: {
  x?: number;
  y?: number;
  count?: number;
}): Promise<void> {
  const confetti = await loadConfetti();
  if (!confetti) return;
  void confetti({
    ...base(confetti, getHeartShapes(confetti)),
    particleCount: options.count ?? 70,
    spread: 110,
    startVelocity: 46,
    decay: 0.92,
    scalar: 1.15,
    ticks: 240,
    origin: { x: options.x ?? 0.5, y: options.y ?? 0.62 },
  });
}

/** Two side cannons firing hearts inward, for the big "she forgave me" moment. */
export async function heartCannon(): Promise<void> {
  const confetti = await loadConfetti();
  if (!confetti) return;
  const shapes = getHeartShapes(confetti);
  [0, 120].forEach((delay, i) => {
    window.setTimeout(() => {
      void confetti({
        ...base(confetti, shapes),
        particleCount: 110,
        angle: i === 0 ? 60 : 120,
        spread: 75,
        startVelocity: 62,
        scalar: 1.2,
        ticks: 260,
        origin: { x: i === 0 ? 0 : 1, y: 0.78 },
      });
    }, delay);
  });
}

/** Slow, floaty hearts drifting down from the sky. */
export async function heartRain(durationMs = 2200): Promise<void> {
  const confetti = await loadConfetti();
  if (!confetti) return;
  const shapes = getHeartShapes(confetti);
  const end = Date.now() + durationMs;
  const tick = (): void => {
    if (Date.now() > end) return;
    void confetti({
      ...base(confetti, shapes),
      particleCount: 4,
      spread: 180,
      startVelocity: 12,
      gravity: 0.6,
      drift: Math.random() * 1.6 - 0.8,
      scalar: 0.95,
      ticks: 320,
      origin: { x: Math.random(), y: -0.1 },
    });
    window.setTimeout(tick, 180);
  };
  tick();
}

/** The full celebration: cannons, a long rattle of hearts and a star finale. */
export async function celebrate(durationMs = 2800): Promise<void> {
  const confetti = await loadConfetti();
  if (!confetti) return;
  const shapes = getHeartShapes(confetti);

  void heartCannon();
  void heartRain(durationMs);

  const end = Date.now() + durationMs;
  const rattle = (): void => {
    if (Date.now() > end) return;
    void confetti({
      ...base(confetti, shapes),
      particleCount: 5,
      angle: 90,
      spread: 360,
      startVelocity: 24,
      scalar: 1,
      ticks: 200,
      origin: { x: 0.2 + Math.random() * 0.6, y: 0.3 + Math.random() * 0.4 },
    });
    window.setTimeout(rattle, 230);
  };
  rattle();

  window.setTimeout(() => {
    void confetti({
      ...base(confetti, shapes),
      particleCount: 160,
      spread: 160,
      startVelocity: 40,
      scalar: 1.3,
      ticks: 300,
      origin: { x: 0.5, y: 0.55 },
    });
  }, durationMs - 400);
}

/** Small burst anchored to a DOM element (used when a coupon is redeemed). */
export async function burstFromElement(element: HTMLElement | null): Promise<void> {
  if (!element || typeof window === "undefined") return;
  const rect = element.getBoundingClientRect();
  const x = (rect.left + rect.width / 2) / window.innerWidth;
  const y = (rect.top + rect.height / 2) / window.innerHeight;
  await heartBurst({ x, y, count: 45 });
}

/** Lets us stop everything (used when the triumph screen is dismissed). */
export async function stopConfetti(): Promise<void> {
  const confetti = await loadConfetti();
  confetti?.reset();
}
