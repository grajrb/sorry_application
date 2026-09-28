"use client";

import { motion, useReducedMotion, type Transition } from "framer-motion";
import { useId } from "react";

export type StitchMood = "sorry" | "sad" | "happy" | "love" | "curious";

interface StitchMascotProps {
  mood?: StitchMood;
  /** Tailwind sizing classes, e.g. "w-40 sm:w-56" */
  className?: string;
  /** Gentle idle floating motion. */
  float?: boolean;
  /** Screen-reader description. */
  label?: string;
}

/**
 * A hand-drawn, animated Stitch (Lilo & Stitch) mascot.
 *
 * Everything is inline SVG so the site stays a self-contained static bundle:
 * no GIFs to fetch, crisp at every screen size, and each `mood` swaps the
 * ears, mouth, cheeks and little extras (tears / sparkles / a hugged heart).
 */
export default function StitchMascot({
  mood = "sorry",
  className = "w-40 sm:w-52",
  float = true,
  label = "A cute little blue alien named Stitch, looking very sorry",
}: StitchMascotProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const reduceMotion = useReducedMotion();

  const smiling = mood === "happy" || mood === "love";
  const worried = mood === "sorry" || mood === "sad";
  const inLove = mood === "love";

  /* Ears: droop when sorry, perk up when happy, tilt when curious. */
  const earAnimation: Record<StitchMood, { left: number | number[]; right: number | number[] }> = {
    sorry: { left: 9, right: -9 },
    sad: { left: 12, right: -12 },
    happy: { left: [-18, -6, -18], right: [18, 6, 18] },
    love: { left: -8, right: 8 },
    curious: { left: -20, right: 7 },
  };

  const ears = earAnimation[mood];
  const earTransition: Transition =
    smiling && !reduceMotion
      ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" }
      : { type: "spring", stiffness: 110, damping: 12 };

  const blinkTransition: Transition = reduceMotion
    ? { duration: 0 }
    : { duration: 5.2, repeat: Infinity, times: [0, 0.86, 0.92, 1], ease: "easeInOut" };

  const bodyBounce = float && !reduceMotion ? { y: smiling ? [0, -12, 0] : [0, -7, 0] } : { y: 0 };

  return (
    <motion.div
      className={className}
      animate={bodyBounce}
      transition={{ duration: smiling ? 1.4 : 4.2, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg
        viewBox="0 0 220 220"
        role="img"
        aria-label={label}
        className="h-auto w-full drop-shadow-[0_16px_28px_rgba(43,108,176,0.28)]"
      >
        <defs>
          <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#63b3ed" />
            <stop offset="55%" stopColor="#4299e1" />
            <stop offset="100%" stopColor="#2b6cb0" />
          </linearGradient>
          <linearGradient id={`${uid}-ear`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#4299e1" />
            <stop offset="100%" stopColor="#1f4e82" />
          </linearGradient>
          <radialGradient id={`${uid}-mask`} cx="50%" cy="45%" r="65%">
            <stop offset="0%" stopColor="#dff1fc" />
            <stop offset="100%" stopColor="#a8d8f0" />
          </radialGradient>
        </defs>

        {/* soft ground shadow */}
        <ellipse cx="110" cy="214" rx="56" ry="5.5" fill="#1a365d" opacity="0.12" />

        {/* body, tummy + feet */}
        <ellipse cx="110" cy="180" rx="48" ry="36" fill={`url(#${uid}-body)`} />
        <ellipse cx="110" cy="184" rx="28" ry="22" fill="#c9e8fa" opacity="0.7" />
        <ellipse cx="78" cy="206" rx="18" ry="9" fill={`url(#${uid}-ear)`} />
        <ellipse cx="142" cy="206" rx="18" ry="9" fill={`url(#${uid}-ear)`} />

        {/* arms + little claws */}
        <g transform="rotate(-16 54 178)">
          <ellipse cx="54" cy="178" rx="15" ry="19" fill={`url(#${uid}-ear)`} />
        </g>
        <g transform="rotate(16 166 178)">
          <ellipse cx="166" cy="178" rx="15" ry="19" fill={`url(#${uid}-ear)`} />
        </g>
        <g stroke="#a8d8f0" strokeWidth="3" strokeLinecap="round" fill="none">
          <path d="M45 189 L41 196" />
          <path d="M51 193 L49 201" />
          <path d="M57 195 L57 203" />
          <path d="M175 189 L179 196" />
          <path d="M169 193 L171 201" />
          <path d="M163 195 L163 203" />
        </g>
        {/* ears (behind the head) */}
        <motion.g
          style={{ transformOrigin: "44px 104px", transformBox: "view-box" }}
          animate={{ rotate: ears.left }}
          transition={earTransition}
        >
          <g transform="rotate(-24 42 64)">
            <ellipse cx="42" cy="64" rx="31" ry="39" fill={`url(#${uid}-ear)`} />
            <ellipse cx="44" cy="68" rx="17" ry="25" fill="#a8d8f0" opacity="0.9" />
          </g>
        </motion.g>
        <motion.g
          style={{ transformOrigin: "176px 104px", transformBox: "view-box" }}
          animate={{ rotate: ears.right }}
          transition={earTransition}
        >
          <g transform="rotate(24 178 64)">
            <ellipse cx="178" cy="64" rx="31" ry="39" fill={`url(#${uid}-ear)`} />
            <ellipse cx="176" cy="68" rx="17" ry="25" fill="#a8d8f0" opacity="0.9" />
          </g>
        </motion.g>

        {/* head + lighter face mask */}
        <ellipse cx="110" cy="98" rx="74" ry="68" fill={`url(#${uid}-body)`} />
        <ellipse cx="110" cy="116" rx="54" ry="46" fill={`url(#${uid}-mask)`} opacity="0.85" />

        {/* worried brows for the sorry faces */}
        {worried && (
          <g stroke="#1f4e82" strokeWidth="3.6" strokeLinecap="round" fill="none" opacity="0.85">
            <path d="M70 84 Q80 80 92 87" />
            <path d="M150 84 Q140 80 128 87" />
          </g>
        )}

        {/* eyes (with a slow blink) */}
        <motion.ellipse
          cx="84"
          cy="104"
          rx="17"
          fill="#14243f"
          animate={{ ry: reduceMotion ? 19 : [19, 19, 1.5, 19] }}
          transition={blinkTransition}
        />
        <motion.ellipse
          cx="136"
          cy="104"
          rx="17"
          fill="#14243f"
          animate={{ ry: reduceMotion ? 19 : [19, 19, 1.5, 19] }}
          transition={blinkTransition}
        />
        <circle cx="89" cy="96" r="5.6" fill="#ffffff" opacity="0.95" />
        <circle cx="141" cy="96" r="5.6" fill="#ffffff" opacity="0.95" />
        <circle cx="78" cy="112" r="2.6" fill="#ffffff" opacity="0.6" />
        <circle cx="130" cy="112" r="2.6" fill="#ffffff" opacity="0.6" />

        {/* nose + highlight */}
        <path
          d="M96 112 C100 104 120 104 124 112 C124 123 118 135 110 139 C102 135 96 123 96 112 Z"
          fill="#132c4e"
        />
        <ellipse cx="106" cy="115" rx="4" ry="2.6" fill="#63b3ed" opacity="0.55" />

        {/* mouth */}
        <g stroke="#132c4e" strokeWidth="3.6" strokeLinecap="round" fill="none">
          {smiling ? (
            <>
              <path d="M110 139 Q102 154 86 143" />
              <path d="M110 139 Q118 154 134 143" />
            </>
          ) : (
            <>
              <path d="M110 139 Q104 147 96 142" />
              <path d="M110 139 Q116 147 124 142" />
            </>
          )}
        </g>
        {smiling && <ellipse cx="110" cy="150" rx="11" ry="7" fill="#ed64a6" opacity="0.9" />}

        {/* blush */}
        <ellipse cx="66" cy="130" rx="11" ry="6.5" fill="#f687b3" opacity={smiling ? 0.75 : 0.45} />
        <ellipse cx="154" cy="130" rx="11" ry="6.5" fill="#f687b3" opacity={smiling ? 0.75 : 0.45} />

        {/* head tuft */}
        <g stroke="#2b6cb0" strokeWidth="7" strokeLinecap="round" fill="none">
          <path d="M102 34 Q104 16 114 8" />
          <path d="M111 31 Q119 15 133 13" />
          <path d="M117 35 Q129 25 143 29" />
        </g>
        {/* mood extras: tears, sparkles or a hugged heart */}
        {worried && <Tears reduceMotion={!!reduceMotion} />}
        {smiling && <Sparkles reduceMotion={!!reduceMotion} />}
        {inLove && (
          <g transform="translate(110 188) scale(0.72)">
            <motion.g
              animate={reduceMotion ? { opacity: 1 } : { opacity: [0.8, 1, 0.8], y: [0, 3, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <path
                d="M0 22 C-14 10 -20 2 -20 -6 C-20 -15 -11 -19 -6 -15 C-3 -12 -1 -9 0 -7 C1 -9 3 -12 6 -15 C11 -19 20 -15 20 -6 C20 2 14 10 0 22 Z"
                fill="#ed64a6"
              />
              <ellipse cx="-8" cy="-6" rx="4" ry="6" fill="#ffffff" opacity="0.35" />
            </motion.g>
          </g>
        )}
      </svg>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mood decorations                                                  */
/* ------------------------------------------------------------------ */

function Tears({ reduceMotion }: { reduceMotion: boolean }) {
  const drops = [
    { cx: 78, delay: 0 },
    { cx: 142, delay: 1.1 },
  ];
  return (
    <g>
      {drops.map((drop) => (
        <motion.ellipse
          key={drop.cx}
          cx={drop.cx}
          rx="4.6"
          ry="6.6"
          fill="#7bc0e8"
          opacity="0.9"
          animate={reduceMotion ? { cy: 130 } : { cy: [120, 178], opacity: [0, 0.95, 0] }}
          transition={{ duration: 2.2, delay: drop.delay, repeat: Infinity, ease: "easeIn" }}
        />
      ))}
    </g>
  );
}

function Sparkles({ reduceMotion }: { reduceMotion: boolean }) {
  const stars = [
    { x: 26, y: 46, delay: 0 },
    { x: 196, y: 54, delay: 0.5 },
    { x: 24, y: 144, delay: 0.9 },
    { x: 198, y: 138, delay: 1.3 },
  ];
  return (
    <g>
      {stars.map((star) => (
        <g key={`${star.x}-${star.y}`} transform={`translate(${star.x} ${star.y})`}>
          <motion.path
            d="M0 -7 C1.2 -2 2 -1.2 7 0 C2 1.2 1.2 2 0 7 C-1.2 2 -2 1.2 -7 0 C-2 -1.2 -1.2 -2 0 -7 Z"
            fill="#f6dfbe"
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0.2, 1, 0.2], y: [-2, 2, -2] }}
            transition={{ duration: 2.4, delay: star.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        </g>
      ))}
    </g>
  );
}
