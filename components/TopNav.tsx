"use client";

import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";
import { isMuted, subscribeMuted, toggleMuted } from "@/lib/sound";

const LINKS = [
  { href: "#letter", label: "Sorry note", emoji: "💌" },
  { href: "#forgive", label: "Forgive me?", emoji: "🥺" },
  { href: "#coupons", label: "Coupons", emoji: "🎟️" },
  { href: "#date-builder", label: "Makeup date", emoji: "🌺" },
];

/** Floating pill nav + the little speaker toggle for the playful sounds. */
export default function TopNav() {
  // The sound module is the source of truth; this lazy initialiser keeps the
  // first render honest without a setState-inside-an-effect dance.
  const [muted, setMutedState] = useState<boolean>(isMuted);

  useEffect(() => subscribeMuted(setMutedState), []);

  return (
    <motion.nav
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.35, type: "spring", stiffness: 90, damping: 14 }}
      className="fixed inset-x-0 top-3 z-50 flex justify-center px-3"
      aria-label="Page sections"
    >
      <div className="flex max-w-full items-center gap-1 rounded-full border border-white/70 bg-white/80 p-1.5 shadow-[0_10px_30px_-12px_rgba(43,108,176,0.55)] backdrop-blur-md">
        <span
          className="hidden items-center gap-1.5 rounded-full bg-gradient-to-r from-stitch-500 to-lavender-500 px-3 py-1.5 text-sm font-semibold text-white sm:flex"
          title="Ohana means family"
        >
          <span aria-hidden="true">💙</span> Ohana
        </span>

        <ul className="flex items-center gap-0.5 overflow-x-auto pretty-scroll">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-semibold text-stitch-800 transition hover:bg-stitch-100 hover:text-stitch-900 sm:px-3"
              >
                <span aria-hidden="true">{link.emoji}</span>
                <span className="hidden sm:inline">{link.label}</span>
                <span className="sr-only sm:hidden">{link.label}</span>
              </a>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={toggleMuted}
          aria-pressed={muted}
          aria-label={muted ? "Turn the cute sounds on" : "Turn the cute sounds off"}
          title={muted ? "Sounds off — tap to enable" : "Sounds on — tap to mute"}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-stitch-100 text-stitch-700 transition hover:bg-hibiscus-100 hover:text-hibiscus-500"
        >
          {muted ? (
            <VolumeX className="size-4.5" aria-hidden="true" />
          ) : (
            <Volume2 className="size-4.5" aria-hidden="true" />
          )}
        </button>
      </div>
    </motion.nav>
  );
}
