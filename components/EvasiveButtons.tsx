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

const TAUNTS = [
  "Nope! That button is on strike today 😅",
  "Whoa — missed me! 🏃‍♂️💨",
  "It's shy. The pink one likes you though 🥺",
  "That button is taking a nap. Try the other one 😴",
  "You can't catch a Stitch 💙",
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
  const slotRef = useRef<HTMLSpanElement>(null);
  const stillMadRef = useRef<HTMLButtonElement>(null);

  const [home, setHome] = useState({ x: 0, y: 0 });
  const [finePointer, setFinePointer] = useState(false);
  const [compact, setCompact] = useState(false);
  const forgiveRef = useRef<HTMLButtonElement>(null);
  const lastDodgeRef = useRef(0);
  const [tauntKey, setTauntKey] = useState(0);
  const [parked, setParked] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [tilt, setTilt] = useState(0);
  const [dodgeCount, setDodgeCount] = useState(0);
  const [taunt, setTaunt] = useState<string | null>(null);
  const [forgiven, setForgiven] = useState(false);
  const [showTriumph, setShowTriumph] = useState(false);

  const forgiveScale = Math.min(1 + dodgeCount * 0.14, compact ? 1.4 : 2.15);
  const stillMadScale = Math.max(1 - dodgeCount * 0.055, 0.62);
  const resting = pos ?? home;

  /** Shows (or refreshes) the cheeky taunt bubble. */
  const showTaunt = useCallback((message: string) => {
    setTaunt(message);
    setTauntKey((key) => key + 1);
  }, []);

  /* Keep the runaway button parked exactly over its invisible slot. */
  const park = useCallback(() => {
    const play = playRef.current;
    const slot = slotRef.current;
    const button = stillMadRef.current;
    if (!play || !slot) return;

    const playRect = play.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    setHome({
      x: slotRect.left - playRect.left - play.clientLeft,
      y: slotRect.top - playRect.top - play.clientTop,
    });
    setParked(true);

    if (!button) return;
    setPos((current) => {
      if (!current) return current;
      const maxX = Math.max(0, play.clientWidth - button.offsetWidth);
      const maxY = Math.max(0, play.clientHeight - button.offsetHeight);
      return {
        x: Math.min(Math.max(current.x, 0), maxX),
        y: Math.min(Math.max(current.y, 0), maxY),
      };
    });
  }, []);

  useLayoutEffect(() => {
    park();
    window.addEventListener("resize", park);
    const observer = new ResizeObserver(park);
    if (playRef.current) observer.observe(playRef.current);
    return () => {
      window.removeEventListener("resize", park);
      observer.disconnect();
    };
  }, [park]);

  /** Teleport the "Still Mad" button to a fresh random spot. */
  const dodge = useCallback(() => {
    const play = playRef.current;
    const button = stillMadRef.current;
    if (!play || !button) return;

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
      showTaunt(TAUNTS[TAUNTS.length - 1]);
      playSad();
      return;
    }

    const maxX = Math.max(0, play.clientWidth - button.offsetWidth);
    const maxY = Math.max(0, play.clientHeight - button.offsetHeight);
    const current = pos ?? home;
    const minDistance = Math.min(280, Math.max(130, Math.hypot(maxX, maxY) * 0.35));

    // Never land on top of "Forgive Me" — she must always be able to press it.
    const forgive = forgiveRef.current;
    let avoid: { left: number; top: number; right: number; bottom: number } | null = null;
    if (forgive) {
      const playRect = play.getBoundingClientRect();
      const forgiveRect = forgive.getBoundingClientRect();
      avoid = {
        left: forgiveRect.left - playRect.left - play.clientLeft - 16,
        top: forgiveRect.top - playRect.top - play.clientTop - 16,
        right: forgiveRect.right - playRect.left - play.clientLeft + 16,
        bottom: forgiveRect.bottom - playRect.top - play.clientTop + 16,
      };
    }

    const isFree = (candidate: { x: number; y: number }): boolean => {
      const travelled = Math.hypot(candidate.x - current.x, candidate.y - current.y);
      if (travelled < minDistance) return false;
      if (!avoid) return true;
      return (
        candidate.x + button.offsetWidth < avoid.left ||
        candidate.x > avoid.right ||
        candidate.y + button.offsetHeight < avoid.top ||
        candidate.y > avoid.bottom
      );
    };

    let target = { x: Math.random() * maxX, y: Math.random() * maxY };
    for (let attempt = 0; attempt < 32; attempt += 1) {
      const candidate = { x: Math.random() * maxX, y: Math.random() * maxY };
      target = candidate;
      if (isFree(candidate)) break;
    }

    setPos(target);
    setTilt(Math.random() * 18 - 9);
    setDodgeCount((count) => count + 1);
    showTaunt(TAUNTS[dodgeCount % TAUNTS.length]);
    playSwoosh();
  }, [dodgeCount, home, pos, reduceMotion, showTaunt]);

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

  const closeTriumph = useCallback(() => {
    setShowTriumph(false);
    void stopConfetti();
  }, []);

  const resetGame = useCallback(() => {
    setDodgeCount(0);
    setPos(null);
    setTilt(0);
    setTaunt(null);
    playPop();
  }, []);

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

  /* Phones get a smaller growth cap so nothing spills off-screen. */
  useEffect(() => {
    const query = window.matchMedia("(max-width: 640px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

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

      <div
        ref={playRef}
        className="relative mx-auto mt-8 flex min-h-[21rem] max-w-3xl flex-wrap items-center justify-center gap-6 rounded-[2rem] border-2 border-dashed border-stitch-200 bg-white/55 p-5 sm:min-h-[17rem] sm:gap-8 sm:p-8"
      >
        <span className="pointer-events-none absolute top-3 left-5 text-[0.7rem] font-bold tracking-widest text-stitch-700/40 uppercase">
          the play area
        </span>

        {/* Forgive Me — grows bigger every time the other button runs away */}
        <motion.button
          ref={forgiveRef}
          type="button"
          onClick={handleForgive}
          animate={{ scale: forgiveScale }}
          whileHover={{ rotate: [0, -2, 2, 0] }}
          whileTap={{ scale: forgiveScale * 0.94 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="relative z-10 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-hibiscus-400 to-hibiscus-500 px-5 py-3 text-base font-bold text-white shadow-[0_18px_35px_-15px_rgba(213,63,140,0.9)] sm:px-7 sm:py-4 sm:text-lg"
        >
          <Heart className="size-6" aria-hidden="true" />
          Forgive Me ❤️
        </motion.button>

        {/* invisible slot the runaway button is parked over */}
        <span ref={slotRef} aria-hidden="true" className="inline-block h-14 w-40" />

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
            opacity: parked ? 1 : 0,
            x: resting.x,
            y: resting.y,
            scale: stillMadScale,
            rotate: tilt,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
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
              className="pointer-events-none absolute bottom-4 left-1/2 max-w-[90%] -translate-x-1/2 rounded-full bg-stitch-900/90 px-4 py-2 text-center text-sm font-semibold text-white shadow-lg"
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
              className="absolute -top-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-to-r from-stitch-600 to-lavender-500 px-5 py-2 text-sm font-bold text-white shadow-lg"
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
                label="Stitch hugging a big pink heart"
              />

              <p className="mt-1 inline-flex items-center gap-2 rounded-full bg-stitch-100 px-4 py-1.5 text-xs font-bold tracking-widest text-stitch-700 uppercase">
                <PartyPopper className="size-3.5" aria-hidden="true" />
                ohana achieved
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
                  onClick={() => {
                    resetGame();
                    closeTriumph();
                  }}
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


