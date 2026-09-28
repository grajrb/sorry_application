"use client";

import { motion } from "framer-motion";
import { ArrowDown, Heart, Sparkles } from "lucide-react";
import { useState } from "react";
import StitchMascot from "@/components/StitchMascot";
import Typewriter from "@/components/Typewriter";
import { apology, siteConfig } from "@/lib/config";

const FLOATERS = [
  { emoji: "🌺", className: "left-[3%] top-[16%] text-4xl animate-float", delay: "0s" },
  { emoji: "🐚", className: "right-[6%] top-[24%] text-3xl animate-float-slow", delay: "1.1s" },
  { emoji: "🌴", className: "left-[6%] bottom-[12%] text-5xl animate-float-slow", delay: "0.6s" },
  { emoji: "☀️", className: "right-[10%] bottom-[8%] text-4xl animate-float", delay: "1.7s" },
  { emoji: "💙", className: "left-[46%] top-[5%] text-3xl animate-float", delay: "0.9s" },
];

/** Hero: the typed-out apology headline, the mascot and the letter itself. */
export default function Hero() {
  const [typedDone, setTypedDone] = useState(false);

  return (
    <section className="relative isolate px-4 pt-28 pb-6 sm:pt-32">
      {/* soft tropical background blobs + floating stickers */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-8 size-72 animate-blob rounded-full bg-stitch-200/60 blur-3xl" />
        <div
          className="absolute -right-24 top-28 size-80 animate-blob rounded-full bg-hibiscus-200/60 blur-3xl"
          style={{ animationDelay: "3s" }}
        />
        <div
          className="absolute bottom-0 left-1/3 size-72 animate-blob rounded-full bg-lavender-200/60 blur-3xl"
          style={{ animationDelay: "6s" }}
        />
        {FLOATERS.map((floater) => (
          <span
            key={floater.emoji}
            className={`absolute select-none opacity-70 ${floater.className}`}
            style={{ animationDelay: floater.delay }}
          >
            {floater.emoji}
          </span>
        ))}
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="text-center lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="inline-flex items-center gap-2 rounded-full border border-stitch-200 bg-white/80 px-4 py-1.5 text-sm font-semibold text-stitch-700 shadow-sm backdrop-blur"
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {apology.kicker}
          </motion.span>

          <h1 className="font-display mt-5 text-3xl leading-tight font-semibold text-stitch-900 sm:text-4xl lg:text-5xl">
            <Typewriter
              text={apology.headline}
              speed={42}
              startDelay={550}
              reserveSpace
              onDone={() => setTypedDone(true)}
              cursorClassName="text-hibiscus-400"
            />
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: typedDone ? 1 : 0, y: typedDone ? 0 : 16 }}
            transition={{ duration: 0.6 }}
            className="mx-auto mt-5 max-w-xl text-lg text-stitch-800/85 lg:mx-0"
          >
            Hi {siteConfig.herName} 🥺 I didn&apos;t know how to say this properly, so I built you a
            whole page instead. There are hearts, coupons and one very slippery button.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: typedDone ? 1 : 0, y: typedDone ? 0 : 16 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start"
          >
            <a
              href="#forgive"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-stitch-600 to-lavender-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-stitch-300/60 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Heart
                className="size-5 transition group-hover:scale-125 group-hover:text-hibiscus-200"
                aria-hidden="true"
              />
              Okay, let&apos;s fix this
            </a>
            <a
              href="#coupons"
              className="inline-flex items-center gap-2 rounded-full border-2 border-stitch-200 bg-white/85 px-6 py-3.5 font-semibold text-stitch-800 shadow-sm transition hover:-translate-y-0.5 hover:border-hibiscus-300 hover:text-hibiscus-500"
            >
              Show me my coupons 🎟️
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: typedDone ? 1 : 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-4 text-sm text-stitch-800/60"
          >
            psst — scroll down, one of those buttons is a little… shy 🙈
          </motion.p>
        </div>
        <div className="relative mx-auto flex w-full max-w-xs flex-col items-center sm:max-w-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.6, type: "spring", stiffness: 120, damping: 14 }}
            className="relative z-10 mb-1 max-w-[16rem] rounded-3xl rounded-bl-md border border-stitch-100 bg-white/90 px-4 py-3 text-center text-sm font-semibold text-stitch-800 shadow-lg backdrop-blur"
          >
            &ldquo;I even made you redeemable coupons… please look at the coupons 🥺&rdquo;
          </motion.div>
          <StitchMascot mood="sorry" className="w-52 sm:w-64" />
        </div>
      </div>

      <motion.a
        href="#letter"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6 }}
        className="mx-auto mt-4 flex w-fit flex-col items-center gap-1 text-sm font-semibold text-stitch-700 transition hover:text-hibiscus-500"
      >
        read the actual apology
        <ArrowDown className="size-5 animate-bounce" aria-hidden="true" />
      </motion.a>

      <Letter />
    </section>
  );
}
/** The heartfelt note itself — staggered fade-in as she scrolls. */
function Letter() {
  return (
    <section id="letter" className="mx-auto mt-8 max-w-3xl scroll-mt-24">
      <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_25px_60px_-30px_rgba(43,108,176,0.55)] backdrop-blur sm:p-10">
        <div className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-2xl bg-hibiscus-100 text-2xl">
            💌
          </span>
          <div>
            <h2 className="font-display text-2xl font-semibold text-stitch-900">
              The actual apology
            </h2>
            <p className="text-sm text-stitch-800/70">no excuses, just the truth</p>
          </div>
        </div>

        <div className="mt-6 space-y-4 text-lg leading-relaxed text-stitch-800/90">
          {apology.paragraphs.map((paragraph, index) => (
            <motion.p
              key={paragraph.slice(0, 24)}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {apology.promises.map((promise, index) => (
            <motion.div
              key={promise.title}
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-100 to-stitch-50 p-4"
            >
              <span className="text-2xl" aria-hidden="true">
                {promise.emoji}
              </span>
              <p className="font-display mt-2 font-semibold text-stitch-900">{promise.title}</p>
              <p className="text-sm text-stitch-800/75">{promise.text}</p>
            </motion.div>
          ))}
        </div>

        <p className="font-display mt-7 text-lg text-hibiscus-500 italic">{apology.signature}</p>
        <p className="mt-2 flex items-center gap-2 text-sm text-stitch-800/60">
          <Heart className="size-4 text-hibiscus-400" aria-hidden="true" />
          and every one of those promises is redeemable — coupons below 👇
        </p>
      </div>
    </section>
  );
}


