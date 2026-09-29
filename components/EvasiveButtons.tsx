"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, PartyPopper, RotateCcw, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import StitchMascot from "@/components/StitchMascot";
import { celebrate, heartBurst, stopConfetti } from "@/lib/confetti";
import { firstName } from "@/lib/config";
import { playChime, playHappy, playPop, playSad, playSparkle, playSwoosh } from "@/lib/sound";

/** How many times the "Still Mad" button runs away before it gives up. */
const MAX_DODGES = 8;

/* ------------------------------------------------------------------ */
/*  Play-area geometry                                                 */
/*                                                                     */
/*  Every number below is measured in the play area's own padding-box   */
/*  coordinates, which is exactly the coordinate space the runaway      */
/*  button is positioned in. That means on *any* screen the button      */
/*  always stays inside the dashed border, never covers the pink one    */
/*  and never sits under a bubble.                                      */
/* ------------------------------------------------------------------ */

/** Breathing room from the dashed border. */
const EDGE_PAD = 12;
/** Reserved for the "the play area" label at the top. */
const TOP_BAND = 38;
/** Reserved for the taunt bubble at the bottom (two lines on phones). */
const BOTTOM_BAND = 84;
/** Keeps the runaway button from hugging the pink button. */
const AVOID_GAP = 18;
/** Extra slack so a hiding pocket is never a pixel-perfect squeeze. */
const POCKET_SLACK = 6;
/** How big the pink button is allowed to get. */
const MAX_GROWTH = 2.1;

interface Point {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

/** A rectangle in play-area coordinates. */
interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Everything we need to know about the current play area layout. */
interface Metrics {
  width: number;
  height: number;
  /** The pink button's *unscaled* size. */
  forgive: Size;
  /** The runaway button's *unscaled* size. */
  mad: Size;
}

const TAUNTS = [
  "Nope! That button is on strike today 😅",
  "Whoa — missed me! 🏃‍♂️💨",
  "It's shy. The pink one likes you though 🥺",
  "That button is taking a nap. Try the other one 😴",
  "You can't catch me — I'm a work in progress 💙",
  "Wrong button! The pink one gives you coupons 🎟️",
  "Even the button is on my side now 🙈",
  "Okay… it ran out of hiding spots, but it's still broken 💔",
];

const STILL_MAD_LABELS = [
  "Still Mad 😤",
  "Still Mad 😤",
  "Still Mad…? 😅",
  "Still a little mad 😾",
  "Fine, slightly mad 🫤",
  "Not that mad 😐",
  "Basically happy 😌",
  "Just click the pink one 🥺",
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function widthOf(box: Box): number {
  return box.right - box.left;
}

function heightOf(box: Box): number {
  return box.bottom - box.top;
}

/** Does a button of `size` fit inside this pocket? */
function fitsIn(box: Box, size: Size): boolean {
  return widthOf(box) >= size.width && heightOf(box) >= size.height;
}

/** A random spot inside `box` that keeps the whole button inside it. */
function spotIn(box: Box, size: Size): Point {
  return {
    x: box.left + Math.random() * Math.max(0, widthOf(box) - size.width),
    y: box.top + Math.random() * Math.max(0, heightOf(box) - size.height),
  };
}

/** The four pockets of free space around the pink button. */
function pocketsAround(metrics: Metrics, avoid: Box): Box[] {
  const left = EDGE_PAD;
  const right = Math.max(left, metrics.width - EDGE_PAD);
  const top = TOP_BAND;
  const bottom = Math.max(top, metrics.height - BOTTOM_BAND);

  // The pink button (inflated by AVOID_GAP) can eat the whole band on small
  // phones, so every pocket is clamped into the playable band instead of
  // trusting the maths to behave.
  const blocked = {
    left: clamp(avoid.left - AVOID_GAP, left, right),
    top: clamp(avoid.top - AVOID_GAP, top, bottom),
    right: clamp(avoid.right + AVOID_GAP, left, right),
    bottom: clamp(avoid.bottom + AVOID_GAP, top, bottom),
  };

  const pockets: Box[] = [
    // above the pink button
    { left, top, right, bottom: blocked.top },
    // below it
    { left, top: blocked.bottom, right, bottom },
    // to its left
    { left, top: blocked.top, right: blocked.left, bottom: blocked.bottom },
    // to its right
    { left: blocked.right, top: blocked.top, right, bottom: blocked.bottom },
  ];

  const usable = pockets.filter((pocket) => fitsIn(pocket, metrics.mad));
  if (usable.length > 0) return usable;

  // A really tiny play area: hand back the roomiest pocket anyway, so the
  // button still ends up as far from the pink one as the screen allows.
  return [
    [...pockets].sort((a, b) => widthOf(b) * heightOf(b) - widthOf(a) * heightOf(a))[0] ??
      pockets[0]!,
  ];
}

/** Is the button, parked at `point`, fully inside one of the pockets? */
function insideAnyPocket(point: Point, pockets: Box[], size: Size): boolean {
  return pockets.some(
    (pocket) =>
      point.x >= pocket.left &&
      point.y >= pocket.top &&
      point.x + size.width <= pocket.right &&
      point.y + size.height <= pocket.bottom,
  );
}

/**
 * Picks a dodge target: as far away from `from` as the pockets allow, with a
 * pinch of randomness so it never feels robotic.
 */
function pickSpot(pockets: Box[], size: Size, from: Point, minDistance: number): Point {
  const samples = pockets.flatMap((pocket) =>
    Array.from({ length: 3 }, () => {
      const spot = spotIn(pocket, size);
      return { spot, distance: Math.hypot(spot.x - from.x, spot.y - from.y) };
    }),
  );

  const far = samples.filter((sample) => sample.distance >= minDistance);
  const ranked = (far.length > 0 ? far : samples).sort((a, b) => b.distance - a.distance);
  const shortlist = ranked.slice(0, Math.min(3, ranked.length));
  const choice = shortlist[Math.floor(Math.random() * shortlist.length)] ?? ranked[0];
  return choice?.spot ?? { x: pockets[0]?.left ?? 0, y: pockets[0]?.top ?? 0 };
}

/** Where the runaway button rests: centred in the roomiest pocket below the pink one. */
function homeSpot(metrics: Metrics, pockets: Box[]): Point {
  const band: Box = {
    left: EDGE_PAD,
    top: TOP_BAND,
    right: Math.max(EDGE_PAD, metrics.width - EDGE_PAD),
    bottom: Math.max(TOP_BAND, metrics.height - BOTTOM_BAND),
  };

  const middle = band.top + heightOf(band) / 2;
  const below = pockets.filter((pocket) => pocket.top >= middle);
  const pool = below.length > 0 ? below : pockets;
  const roomiest = [...pool].sort((a, b) => widthOf(b) * heightOf(b) - widthOf(a) * heightOf(a))[0];
  const target = roomiest ?? band;

  return {
    x: clamp(
      target.left + (widthOf(target) - metrics.mad.width) / 2,
      band.left,
      Math.max(band.left, band.right - metrics.mad.width),
    ),
    y: clamp(
      target.top + (heightOf(target) - metrics.mad.height) / 2,
      band.top,
      Math.max(band.top, band.bottom - metrics.mad.height),
    ),
  };
}

/**
 * How far the pink button may grow before it would spill out of the play area
 * — or before it would leave the runaway button with nowhere to hide.
 */
function growthCapOf(metrics: Metrics): number {
  const byWidth = (metrics.width - EDGE_PAD * 2) / Math.max(1, metrics.forgive.width);
  // The band has to keep AVOID_GAP + the runaway button's height free on at
  // least one side, otherwise the two buttons would collide at full growth.
  const pocketRoom = (AVOID_GAP + metrics.mad.height + POCKET_SLACK) * 2;
  const byHeight =
    (metrics.height - TOP_BAND - BOTTOM_BAND - pocketRoom) / Math.max(1, metrics.forgive.height);
  return Math.max(1, Math.min(byWidth, byHeight, MAX_GROWTH));
}

/**
 * The forgiveness game.
 *
 * "Forgive Me" grows with every dodge while "Still Mad" keeps teleporting away
 * inside the play area — until it runs out of hiding spots and one of the two
 * buttons finally wins.
 */
export default function EvasiveButtons() {
  const reduceMotion = useReducedMotion();
  const playRef = useRef<HTMLDivElement>(null);
  const forgiveRef = useRef<HTMLButtonElement>(null);
  const stillMadRef = useRef<HTMLButtonElement>(null);
  const lastDodgeRef = useRef(0);

  /* Live layout + where the runaway button currently sits. Kept in refs as well
     so the pointer handlers always read fresh values without being re-created. */
  const metricsRef = useRef<Metrics | null>(null);
  const homeRef = useRef<Point>({ x: 0, y: 0 });
  const spotRef = useRef<Point | null>(null);

  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [spot, setSpot] = useState<Point | null>(null);
  const [finePointer, setFinePointer] = useState(false);
  const [tauntKey, setTauntKey] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [dodgeCount, setDodgeCount] = useState(0);
  const [taunt, setTaunt] = useState<string | null>(null);
  const [forgiven, setForgiven] = useState(false);
  const [showTriumph, setShowTriumph] = useState(false);

  /* The pink button grows with every dodge — but never further than the play
     area can hold, so it can't spill off a phone screen. */
  const forgiveScale = Math.min(
    1 + dodgeCount * 0.14,
    metrics ? growthCapOf(metrics) : MAX_GROWTH,
  );
  const stillMadScale = Math.max(1 - dodgeCount * 0.055, 0.62);
  const resting = spot ?? { x: 0, y: 0 };

  /** Shows (or refreshes) the cheeky taunt bubble. */
  const showTaunt = useCallback((message: string) => {
    setTaunt(message);
    setTauntKey((key) => key + 1);
  }, []);

  /** Moves the runaway button (ref + state stay in sync). */
  const moveTo = useCallback((next: Point | null) => {
    spotRef.current = next;
    setSpot(next);
  }, []);

  /**
   * Measures the play area and re-places the runaway button.
   *
   * Runs before the first paint and again on every resize, so the buttons are
   * always exactly where they belong — on a 320px phone, a tablet, a laptop or
   * an ultrawide monitor.
   */
  const measure = useCallback(() => {
    const play = playRef.current;
    const forgive = forgiveRef.current;
    const mad = stillMadRef.current;
    if (!play || !forgive || !mad) return;

    const next: Metrics = {
      width: play.clientWidth,
      height: play.clientHeight,
      forgive: { width: forgive.offsetWidth, height: forgive.offsetHeight },
      mad: { width: mad.offsetWidth, height: mad.offsetHeight },
    };

    // Where the pink button actually *is* right now (its scale included), in
    // play-area coordinates.
    const playRect = play.getBoundingClientRect();
    const forgiveRect = forgive.getBoundingClientRect();
    const avoid: Box = {
      left: forgiveRect.left - playRect.left - play.clientLeft,
      top: forgiveRect.top - playRect.top - play.clientTop,
      right: forgiveRect.right - playRect.left - play.clientLeft,
      bottom: forgiveRect.bottom - playRect.top - play.clientTop,
    };

    const pockets = pocketsAround(next, avoid);
    homeRef.current = homeSpot(next, pockets);
    metricsRef.current = next;

    const current = spotRef.current;
    if (!current) moveTo(homeRef.current);
    else if (!insideAnyPocket(current, pockets, next.mad)) {
      moveTo(pickSpot(pockets, next.mad, current, 0));
    }

    setMetrics((previous) =>
      previous &&
      previous.width === next.width &&
      previous.height === next.height &&
      previous.forgive.width === next.forgive.width &&
      previous.forgive.height === next.forgive.height &&
      previous.mad.width === next.mad.width &&
      previous.mad.height === next.mad.height
        ? previous
        : next,
    );
  }, [moveTo]);

  useLayoutEffect(() => {
    measure();

    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);

    const observer = new ResizeObserver(onResize);
    if (playRef.current) observer.observe(playRef.current);
    if (forgiveRef.current) observer.observe(forgiveRef.current);

    // Web fonts land after the first paint and can change the button sizes.
    void document.fonts?.ready.then(onResize).catch(() => undefined);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      observer.disconnect();
    };
  }, [measure]);

  /** Teleport the "Still Mad" button to a fresh hiding spot. */
  const dodge = useCallback(() => {
    const layout = metricsRef.current;
    const mad = stillMadRef.current;
    if (!layout || !mad) return;

    // One hover-then-click shouldn't count as two separate dodges.
    const now = Date.now();
    if (now - lastDodgeRef.current < 240) return;
    lastDodgeRef.current = now;

    if (reduceMotion) {
      showTaunt("I'm not running anywhere — but I'd still rather you pressed the pink one 🙃");
      playPop();
      return;
    }

    if (dodgeCount >= MAX_DODGES) {
      showTaunt(TAUNTS[TAUNTS.length - 1] ?? "Okay… I give up, please press the pink one 🥺");
      playSad();
      return;
    }

    // The label changes with every dodge (and so does the button's width), so
    // always measure the live element before choosing where it can hide.
    const live: Metrics = {
      ...layout,
      mad: { width: mad.offsetWidth, height: mad.offsetHeight },
    };

    const play = playRef.current;
    const forgive = forgiveRef.current;
    const current = spotRef.current ?? homeRef.current;

    // Never land on top of "Forgive Me" — and keep clear of how big it is about
    // to become, so a dodge can't be swallowed by the next growth spurt.
    let avoid: Box = {
      left: live.width / 2,
      top: live.height / 2,
      right: live.width / 2,
      bottom: live.height / 2,
    };

    if (play && forgive) {
      const ring = forgive.getBoundingClientRect();
      const playRect = play.getBoundingClientRect();
      const left = ring.left - playRect.left - play.clientLeft;
      const top = ring.top - playRect.top - play.clientTop;
      const right = ring.right - playRect.left - play.clientLeft;
      const bottom = ring.bottom - playRect.top - play.clientTop;

      const nextScale = Math.min(1 + (dodgeCount + 1) * 0.14, growthCapOf(live));
      const ratio = nextScale / Math.max(0.01, forgiveScale);
      const midX = (left + right) / 2;
      const midY = (top + bottom) / 2;
      const halfWidth = ((right - left) / 2) * ratio;
      const halfHeight = ((bottom - top) / 2) * ratio;

      avoid = {
        left: midX - halfWidth,
        top: midY - halfHeight,
        right: midX + halfWidth,
        bottom: midY + halfHeight,
      };
    }

    const pockets = pocketsAround(live, avoid);
    const minDistance = Math.min(
      300,
      Math.max(140, Math.hypot(live.width, live.height) * 0.28),
    );

    moveTo(pickSpot(pockets, live.mad, current, minDistance));
    setTilt(Math.random() * 18 - 9);
    setDodgeCount((count) => count + 1);
    showTaunt(TAUNTS[dodgeCount % TAUNTS.length] ?? "Nope! 🙃");
    playSwoosh();
  }, [dodgeCount, forgiveScale, moveTo, reduceMotion, showTaunt]);

  const handleForgive = useCallback(() => {
    setForgiven(true);
    setTaunt(null);
    playHappy();
    void celebrate();
    window.setTimeout(() => {
      setShowTriumph(true);
      playChime();
    }, 950);
  }, []);

  /** Sends the runaway button home and clears the scoreboard. */
  const resetGame = useCallback(() => {
    setDodgeCount(0);
    setTilt(0);
    setTaunt(null);
    moveTo(homeRef.current);
    playPop();
  }, [moveTo]);

  const closeTriumph = useCallback(() => {
    setShowTriumph(false);
    void stopConfetti();
  }, []);

  /** Back to the very beginning of the game (used by the triumph screen). */
  const replayGame = useCallback(() => {
    setForgiven(false);
    closeTriumph();
    resetGame();
  }, [closeTriumph, resetGame]);

  const extraLove = useCallback(() => {
    playSparkle();
    void heartBurst({ x: 0.5, y: 0.4, count: 90 });
  }, []);

  /* Hover-dodging only makes sense with a real mouse. */
  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setFinePointer(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  /* There is no phone/desktop special-casing left: the pink button's growth
     ceiling is measured from the play area itself (see `growthCapOf`), so it is
     always exactly as big as the screen can hold. */

  /* Escape closes the triumph screen; the page stops scrolling behind it. */
  useEffect(() => {
    if (!showTriumph) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeTriumph();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeTriumph, showTriumph]);

  return (
    <section id="forgive" className="relative scroll-mt-24 px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-hibiscus-200 bg-white/80 px-4 py-1.5 text-sm font-semibold text-hibiscus-500 shadow-sm backdrop-blur">
          <PartyPopper className="size-4" aria-hidden="true" />
          the part where you decide my fate
        </span>
        <h2 className="font-display mt-4 text-3xl font-semibold text-stitch-900 sm:text-4xl">
          So… do I get forgiven? 🥺
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-stitch-800/80">
          Two buttons. One of them is a bit of a coward. No pressure — although the pink one does
          come with coupons 💙
        </p>
      </div>

      {/* The play area is a fixed-size stage: the pink button sits dead centre
          and the runaway one teleports around it inside these exact bounds. */}
      <div
        ref={playRef}
        className="relative mx-auto mt-8 h-[22rem] max-w-3xl overflow-hidden rounded-[2rem] border-2 border-dashed border-stitch-200 bg-white/55 sm:h-[26rem]"
      >
        <span className="pointer-events-none absolute top-3 left-5 z-30 text-[0.7rem] font-bold tracking-widest text-stitch-700/40 uppercase">
          the play area
        </span>

        {/* Forgive Me — grows bigger every time the other button runs away.
            The padding reserves the label strip and the taunt strip, so a grown
            button never crowds them on any screen size. */}
        <div
          className="absolute inset-0 grid place-items-center"
          style={{ padding: `${TOP_BAND}px ${EDGE_PAD}px ${BOTTOM_BAND}px` }}
        >
          <motion.button
            ref={forgiveRef}
            type="button"
            onClick={handleForgive}
            animate={{ scale: forgiveScale }}
            whileHover={{ rotate: [0, -2, 2, 0] }}
            whileTap={{ scale: forgiveScale * 0.94 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="relative z-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-hibiscus-400 to-hibiscus-500 px-5 py-3 text-base font-bold whitespace-nowrap text-white shadow-[0_18px_35px_-15px_rgba(213,63,140,0.9)] sm:px-7 sm:py-4 sm:text-lg"
          >
            <Heart className="size-6" aria-hidden="true" />
            Forgive Me ❤️
          </motion.button>
        </div>

        {/* Still Mad — a moving target */}
        <motion.button
          ref={stillMadRef}
          type="button"
          aria-label="Still mad (good luck catching this one)"
          onPointerEnter={() => {
            if (finePointer && !forgiven) dodge();
          }}
          onPointerDown={() => {
            if (!forgiven) dodge();
          }}
          onClick={() => {
            if (forgiven) {
              extraLove();
              return;
            }
            if (dodgeCount >= MAX_DODGES) playSad();
            else playPop();
          }}
          animate={{
            opacity: metrics ? 1 : 0,
            x: resting.x,
            y: resting.y,
            scale: stillMadScale,
            rotate: tilt,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{ visibility: metrics ? "visible" : "hidden" }}
          className="absolute top-0 left-0 z-20 inline-flex cursor-pointer items-center gap-2 rounded-full border-2 border-stitch-300 bg-white px-6 py-3.5 font-bold whitespace-nowrap text-stitch-800 shadow-[0_14px_30px_-14px_rgba(31,78,130,0.7)]"
        >
          {forgiven
            ? "Aw, come here 🫂"
            : (STILL_MAD_LABELS[Math.min(dodgeCount, STILL_MAD_LABELS.length - 1)] ??
              "Still Mad 😤")}
        </motion.button>

        {/* cheeky commentary */}
        <AnimatePresence>
          {taunt && (
            <motion.p
              key={tauntKey}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              className="pointer-events-none absolute bottom-4 left-1/2 z-30 max-w-[90%] -translate-x-1/2 rounded-full bg-stitch-900/90 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg sm:text-sm"
            >
              {taunt}
            </motion.p>
          )}
        </AnimatePresence>

        {/* forgiven badge */}
        <AnimatePresence>
          {forgiven && (
            <motion.div
              initial={{ opacity: 0, y: -14, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-2 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-stitch-600 to-lavender-500 px-5 py-2 text-sm font-bold text-white shadow-lg"
            >
              <Sparkles className="size-4" aria-hidden="true" />
              forgiven — officially 🥹💙
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mx-auto mt-4 flex max-w-3xl flex-wrap items-center justify-center gap-3 text-sm">
        <span className="rounded-full bg-stitch-100 px-3 py-1.5 font-semibold text-stitch-700">
          attempts dodged: {dodgeCount}
        </span>
        <span className="rounded-full bg-hibiscus-100 px-3 py-1.5 font-semibold text-hibiscus-500">
          forgive button: {Math.round(forgiveScale * 100)}%
        </span>
        {dodgeCount > 0 && (
          <button
            type="button"
            onClick={resetGame}
            className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold text-stitch-700 shadow-sm transition hover:-translate-y-0.5 hover:text-hibiscus-500"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            put the button back
          </button>
        )}
      </div>

      {/* 🎉 The triumph screen */}
      <AnimatePresence>
        {showTriumph && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="triumph-title"
            onClick={closeTriumph}
            className="fixed inset-0 z-80 flex items-center justify-center overflow-y-auto bg-gradient-to-br from-stitch-600/95 via-lavender-500/95 to-hibiscus-400/95 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 160, damping: 18 }}
              onClick={(event) => event.stopPropagation()}
              className="relative my-auto w-full max-w-lg rounded-[2.5rem] border-4 border-white/70 bg-cream-50 p-7 text-center shadow-2xl sm:p-9"
            >
              <button
                type="button"
                onClick={closeTriumph}
                aria-label="Close the celebration"
                className="absolute top-4 right-4 grid size-9 place-items-center rounded-full bg-stitch-100 text-stitch-700 transition hover:bg-hibiscus-100 hover:text-hibiscus-500"
              >
                <X className="size-4" aria-hidden="true" />
              </button>

              <StitchMascot
                mood="love"
                className="mx-auto w-40 sm:w-48"
                label="A little sparkly apology-bot hugging a big pink heart"
              />

              <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-stitch-100 px-4 py-1.5 text-xs font-bold tracking-widest text-stitch-700 uppercase">
                <PartyPopper className="size-3.5" aria-hidden="true" />
                forgiveness shipped
              </p>

              <h2
                id="triumph-title"
                className="font-display mt-3 text-3xl font-bold text-stitch-900 sm:text-4xl"
              >
                You forgave me! 🥳
              </h2>

              <p className="mt-3 text-stitch-800/85">
                Thank you, {firstName()}. I don&apos;t take it for granted — I&apos;ll keep earning
                it. 💙
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <a
                  href="#date-builder"
                  onClick={closeTriumph}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-stitch-600 to-lavender-500 px-6 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                >
                  Let&apos;s plan our makeup date 🌸
                </a>
                <button
                  type="button"
                  onClick={extraLove}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-hibiscus-200 bg-white px-6 py-3.5 font-bold text-hibiscus-500 transition hover:-translate-y-0.5 hover:border-hibiscus-400"
                >
                  <Heart className="size-5" aria-hidden="true" />
                  I love you too 💙 (tap for more hearts)
                </button>
                <button
                  type="button"
                  onClick={replayGame}
                  className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-stitch-700/70 transition hover:text-stitch-900"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  replay the apology game
                </button>
              </div>

              <p className="mt-5 text-xs text-stitch-800/50">
                (psst — press Escape or tap outside to close this)
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}


