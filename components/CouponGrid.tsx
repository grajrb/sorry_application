"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Gift, Heart, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { burstFromElement } from "@/lib/confetti";
import { playPop, playSparkle } from "@/lib/sound";

interface Coupon {
  id: string;
  emoji: string;
  title: string;
  tagline: string;
  finePrint: string;
  gradient: string;
}

const COUPONS: Coupon[] = [
  {
    id: "back-rub",
    emoji: "🧴",
    title: "One Full Back Rub",
    tagline: "30 whole minutes. No phone, no timer-watching, no 'are you done yet'.",
    finePrint: "Redeemable any day — even at 2am, even mid-series. Extra oil upgrade included.",
    gradient: "from-stitch-400 to-stitch-600",
  },
  {
    id: "boba",
    emoji: "🧋",
    title: "Boba & Dessert, On Me",
    tagline: "Your order, your size, extra pearls. I'll even take the long way home with you.",
    finePrint: "Valid for one (1) unlimited-topping order. May be redeemed on a random Tuesday.",
    gradient: "from-lavender-400 to-lavender-600",
  },
  {
    id: "win-argument",
    emoji: "🏆",
    title: "You Win This Argument",
    tagline: "Even if I'm technically… right. Claim it and I drop it forever, no rebuttals.",
    finePrint:
      "Single use, but it works on every argument from now on. Yes, including the old ones.",
    gradient: "from-hibiscus-400 to-hibiscus-500",
  },
  {
    id: "breakfast",
    emoji: "🍳",
    title: "Breakfast In Bed",
    tagline: "Pancakes, fruit and your favourite drink, delivered with a forehead kiss.",
    finePrint: "Kitchen mess is my responsibility. Crumbs in the bed are yours. 🤝",
    gradient: "from-sand-400 to-hibiscus-300",
  },
  {
    id: "movie",
    emoji: "🎬",
    title: "You Pick The Movie",
    tagline: "Any film, any genre, zero commentary from me — not even the smug ones.",
    finePrint: "Snacks included. Falling asleep during it is allowed exactly once.",
    gradient: "from-stitch-500 to-lavender-500",
  },
  {
    id: "hugs",
    emoji: "🫂",
    title: "Unlimited Hugs",
    tagline: "Forehead kisses, biggest hugs and 'I'm proud of you' texts. No expiry date.",
    finePrint: "Claims never run out. This one is a forever coupon — read the fine print again.",
    gradient: "from-hibiscus-300 to-lavender-400",
  },
];

const STORAGE_KEY = "stitch-sorry:redeemed-coupons";
const COUPONS_EVENT = "stitch-sorry:coupons-changed";

/* ------------------------------------------------------------------ */
/*  localStorage as an external store (useSyncExternalStore)           */
/* ------------------------------------------------------------------ */

function subscribeToCoupons(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(COUPONS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(COUPONS_EVENT, onChange);
  };
}

function readCouponSnapshot(): string {
  try {
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function readCouponServerSnapshot(): string {
  return "";
}

function parseCoupons(snapshot: string): string[] {
  if (!snapshot) return [];
  try {
    const parsed: unknown = JSON.parse(snapshot);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function writeCoupons(ids: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* private mode / blocked storage — the page still works */
  }
  window.dispatchEvent(new Event(COUPONS_EVENT));
}

/**
 * The Love Coupons — hand-flippable cards she can "redeem".
 *
 * Every claim is remembered in localStorage and celebrated with a little
 * confetti burst, because grand gestures should at least be fun.
 */
export default function CouponGrid() {
  const couponSnapshot = useSyncExternalStore(
    subscribeToCoupons,
    readCouponSnapshot,
    readCouponServerSnapshot,
  );
  const redeemed = useMemo(() => parseCoupons(couponSnapshot), [couponSnapshot]);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleRedeem = (coupon: Coupon, element: HTMLElement | null) => {
    if (!redeemed.includes(coupon.id)) {
      writeCoupons([...redeemed, coupon.id]);
    }
    void burstFromElement(element);
    playSparkle();
    setToast(`${coupon.emoji} "${coupon.title}" claimed! I'll honour it — pinky promise 💙`);
  };

  const resetCoupons = () => {
    writeCoupons([]);
    setToast("Coupons back in the book — no take-backs though 😌");
    playPop();
  };

  return (
    <section id="coupons" className="relative scroll-mt-24 px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-lavender-200 bg-white/80 px-4 py-1.5 text-sm font-semibold text-lavender-600 shadow-sm backdrop-blur">
          <Gift className="size-4" aria-hidden="true" />
          redeemable, no expiry, no arguments
        </span>
        <h2 className="font-display mt-4 text-3xl font-semibold text-stitch-900 sm:text-4xl">
          Your Love Coupons 🎟️
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-stitch-800/80">
          Tap a coupon to flip it over, read the fine print, and claim it whenever you want. I&apos;ll
          be doing the actual work — you just hold the card.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 font-semibold text-stitch-700 shadow-sm">
            <Sparkles className="size-4 text-lavender-500" aria-hidden="true" />
            {redeemed.length} of {COUPONS.length} claimed
          </span>
          {redeemed.length > 0 && (
            <button
              type="button"
              onClick={resetCoupons}
              className="rounded-full bg-white px-3 py-1.5 font-semibold text-stitch-700 shadow-sm transition hover:text-hibiscus-500"
            >
              put them back 🔄
            </button>
          )}
        </div>
      </div>

      <div className="mx-auto mt-8 grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {COUPONS.map((coupon, index) => (
          <motion.div
            key={coupon.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: (index % 3) * 0.08 }}
          >
            <CouponCard
              coupon={coupon}
              claimed={redeemed.includes(coupon.id)}
              onClaim={handleRedeem}
            />
          </motion.div>
        ))}
      </div>

      <p className="mx-auto mt-6 max-w-xl text-center text-sm text-stitch-800/65">
        Fine print you can actually trust: every coupon on this page is a real promise. Ask, and
        it&apos;s yours. 💙
      </p>

      {/* claim toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            className="fixed bottom-5 left-1/2 z-70 flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-full bg-stitch-900/92 px-5 py-3 text-center text-sm font-semibold text-white shadow-2xl"
            role="status"
          >
            <Heart className="size-4 shrink-0 text-hibiscus-300" aria-hidden="true" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  A single flip card                                                */
/* ------------------------------------------------------------------ */

function CouponCard({
  coupon,
  claimed,
  onClaim,
}: {
  coupon: Coupon;
  claimed: boolean;
  onClaim: (coupon: Coupon, element: HTMLElement | null) => void;
}) {
  const [flipped, setFlipped] = useState(false);
  const reduceMotion = useReducedMotion();
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={cardRef} className="flip-scene h-[19.5rem] w-full">
      <motion.div
        className="flip-inner relative h-full w-full"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={
          reduceMotion ? { duration: 0 } : { type: "spring", stiffness: 130, damping: 17 }
        }
      >
        {/* FRONT */}
        <button
          type="button"
          onClick={() => {
            setFlipped(true);
            playPop();
          }}
          aria-hidden={flipped}
          tabIndex={flipped ? -1 : 0}
          className={`flip-face absolute inset-0 flex flex-col items-center justify-between overflow-hidden rounded-[1.75rem] border-4 border-white/70 bg-gradient-to-br p-5 text-center text-white shadow-[0_22px_45px_-22px_rgba(31,78,130,0.85)] transition hover:-translate-y-1 ${
            coupon.gradient
          } ${flipped ? "pointer-events-none" : ""}`}
        >
          {/* dotted coupon perforation */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-3 top-1/2 border-t-2 border-dashed border-white/25"
          />
          <span className="inline-flex items-center gap-1 rounded-full bg-white/25 px-3 py-1 text-[0.65rem] font-bold tracking-widest uppercase">
            Love coupon
          </span>

          <span className="text-6xl drop-shadow-sm" aria-hidden="true">
            {coupon.emoji}
          </span>

          <span className="block">
            <span className="font-display block text-xl font-bold">{coupon.title}</span>
            <span className="mt-2 block text-sm text-white/90">{coupon.tagline}</span>
          </span>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/25 px-3 py-1.5 text-xs font-bold">
            <Sparkles className="size-3.5" aria-hidden="true" />
            tap to flip
          </span>
        </button>

        {/* BACK */}
        <div
          aria-hidden={!flipped}
          className={`flip-face flip-back absolute inset-0 flex flex-col justify-between rounded-[1.75rem] border-4 border-stitch-100 bg-cream-50 p-5 text-center shadow-[0_22px_45px_-22px_rgba(31,78,130,0.55)] ${
            flipped ? "" : "pointer-events-none"
          }`}
        >
          <div>
            <p className="text-[0.65rem] font-bold tracking-widest text-stitch-700/50 uppercase">
              the fine print
            </p>
            <p className="font-display mt-2 text-lg font-bold text-stitch-900">{coupon.title}</p>
            <p className="mt-2 text-sm text-stitch-800/80">{coupon.finePrint}</p>
          </div>

          <div className="flex flex-col items-center gap-2">
            {claimed ? (
              <span className="inline-flex -rotate-3 items-center gap-1.5 rounded-full border-2 border-palm-500/40 bg-palm-500/10 px-4 py-2 text-sm font-bold text-palm-500">
                <Check className="size-4" aria-hidden="true" />
                redeemed 💙
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onClaim(coupon, cardRef.current)}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-stitch-600 to-lavender-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5"
              >
                <Heart className="size-4" aria-hidden="true" />
                claim it
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setFlipped(false);
                playPop();
              }}
              className="text-xs font-semibold text-stitch-700/70 transition hover:text-hibiscus-500"
            >
              flip back ↻
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
