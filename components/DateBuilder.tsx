"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Copy, Heart, MessageCircle, RotateCcw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { isWhatsappConfigured, siteConfig, whatsappLink, firstName } from "@/lib/config";
import { playChime, playPop, playSparkle } from "@/lib/sound";

interface DateOption {
  id: string;
  label: string;
  emoji: string;
  blurb: string;
}

interface DateStep {
  id: "food" | "activity" | "dessert";
  title: string;
  question: string;
  emoji: string;
  options: DateOption[];
}

/* Three tiny steps, then the summary + WhatsApp hand-off. */
const STEPS: DateStep[] = [
  {
    id: "food",
    title: "Food",
    question: "First things first — what are we eating?",
    emoji: "🍽️",
    options: [
      { id: "ramen", label: "Ramen & gyoza", emoji: "🍜", blurb: "slurping is mandatory" },
      { id: "sushi", label: "Sushi platter", emoji: "🍣", blurb: "you get the last piece" },
      { id: "pizza", label: "Pizza + garlic bread", emoji: "🍕", blurb: "extra cheese, obviously" },
      { id: "tacos", label: "Tacos & elote", emoji: "🌮", blurb: "messy in the best way" },
      { id: "curry", label: "Butter chicken & naan", emoji: "🍛", blurb: "the comfort classic" },
      { id: "momos", label: "Momos & chaat", emoji: "🥟", blurb: "street-food date energy" },
    ],
  },
  {
    id: "activity",
    title: "Activity",
    question: "And then? I'll behave, promise.",
    emoji: "🎡",
    options: [
      { id: "arcade", label: "Arcade & air hockey", emoji: "🕹️", blurb: "I'll lose on purpose" },
      { id: "movie", label: "Movie night", emoji: "🍿", blurb: "you pick, zero commentary" },
      { id: "beach", label: "Beach walk at sunset", emoji: "🏖️", blurb: "toes in the sand" },
      { id: "aquarium", label: "Aquarium", emoji: "🐠", blurb: "we'll find a Stitch-fish" },
      { id: "bowling", label: "Bowling", emoji: "🎳", blurb: "bumpers allowed for me" },
      { id: "walk", label: "City walk + photos", emoji: "📸", blurb: "you're the model" },
    ],
  },
  {
    id: "dessert",
    title: "Dessert",
    question: "Dessert counts as a whole meal. Choose wisely 🍬",
    emoji: "🍰",
    options: [
      { id: "boba", label: "Boba run", emoji: "🧋", blurb: "extra pearls, always" },
      { id: "icecream", label: "Ice cream cones", emoji: "🍦", blurb: "double scoop day" },
      { id: "lava", label: "Chocolate lava cake", emoji: "🍰", blurb: "two spoons, one plate" },
      { id: "waffle", label: "Waffles & strawberries", emoji: "🧇", blurb: "with whipped cream" },
      { id: "donut", label: "Warm donuts", emoji: "🍩", blurb: "the ones that melt" },
      { id: "churros", label: "Churros & chocolate", emoji: "🍫", blurb: "cinnamon chaos" },
    ],
  },
];

/** Three quick choices, a summary, then a pre-filled WhatsApp hand-off. */
export default function DateBuilder() {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const totalSteps = STEPS.length;
  const onReview = stepIndex >= totalSteps;
  const progress = Math.min(100, Math.round((stepIndex / totalSteps) * 100));
  const currentStep = STEPS[Math.min(stepIndex, totalSteps - 1)]!;

  const summary = useMemo(
    () =>
      STEPS.map((step) => ({
        step,
        option: step.options.find((option) => option.id === choices[step.id]),
      })),
    [choices],
  );

  /** The message she is about to send me. */
  const message = useMemo(() => {
    const lines = STEPS.map((step) => {
      const chosen = step.options.find((option) => option.id === choices[step.id]);
      return chosen ? `${step.emoji} ${step.title}: ${chosen.emoji} ${chosen.label}` : null;
    }).filter((line): line is string => Boolean(line));

    return [
      `Hi ${siteConfig.myName} 💙 (you built me a whole apology website, so I'm replying properly)`,
      "I finished your makeup-date builder and it says:",
      lines.join("\n"),
      "So… are we doing this? Tell me a day and I'll be ready 🌺",
      `— ${siteConfig.herName}`,
    ].join("\n\n");
  }, [choices]);

  const whatsappReady = isWhatsappConfigured();

  const choose = (step: DateStep, option: DateOption) => {
    setChoices((current) => ({ ...current, [step.id]: option.id }));
    setDirection(1);
    playPop();

    const everythingElseChosen = STEPS.every(
      (candidate) => candidate.id === step.id || Boolean(choices[candidate.id]),
    );
    if (everythingElseChosen) {
      setStepIndex(totalSteps);
      playSparkle();
    }
  };

  const goTo = (index: number) => {
    setDirection(index > stepIndex ? 1 : -1);
    setStepIndex(Math.max(0, Math.min(index, totalSteps)));
    setCopied(false);
    playPop();
  };

  const copyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message);
    } catch {
      /* Older browsers / insecure contexts get a hidden-textarea fallback. */
      const area = document.createElement("textarea");
      area.value = message;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopied(true);
    playChime();
    setToast("Message copied 💌 paste it into a chat and hit send!");
  }, [message]);

  const startOver = () => {
    setChoices({});
    setDirection(-1);
    setStepIndex(0);
    setCopied(false);
    setToast(null);
    playPop();
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return (
    <section id="date-builder" className="scroll-mt-24 px-4 py-16">
      <div className="mx-auto max-w-3xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-stitch-200 bg-white/80 px-4 py-1.5 text-sm font-semibold text-stitch-700 shadow-sm backdrop-blur">
          <Heart className="size-4 text-hibiscus-400" aria-hidden="true" />
          pick three things, I&apos;ll handle the rest
        </span>
        <h2 className="font-display mt-4 text-3xl font-semibold text-stitch-900 sm:text-4xl">
          Build our makeup date 🌺
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-stitch-800/80">
          Food, then something fun, then dessert. When you&apos;re done, the button below sends it
          straight to my phone — so there&apos;s no escaping it for me 😌
        </p>
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_25px_60px_-30px_rgba(43,108,176,0.55)] backdrop-blur sm:p-8">
        {/* progress */}
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Date builder progress"
          className="flex items-start gap-3"
        >
          {STEPS.map((step, index) => {
            const done = Boolean(choices[step.id]);
            const active = !onReview && index === stepIndex;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => goTo(index)}
                className="flex flex-1 flex-col items-center gap-1.5"
              >
                <span
                  className={`h-1.5 w-full rounded-full transition ${
                    done ? "bg-hibiscus-400" : active ? "bg-stitch-400" : "bg-stitch-100"
                  }`}
                />
                <span
                  className={`text-xs font-bold tracking-wider uppercase ${
                    done || active ? "text-stitch-800" : "text-stitch-800/40"
                  }`}
                >
                  {step.emoji} {step.title}
                </span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {onReview ? (
            <motion.div
              key="review"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-7"
            >
              <p className="text-xs font-bold tracking-widest text-stitch-700/50 uppercase">
                final step · the moment of truth
              </p>
              <h3 className="font-display mt-2 text-2xl font-semibold text-stitch-900">
                Here&apos;s our date, {firstName()} 🌸
              </h3>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {summary.map(({ step, option }) => (
                  <div
                    key={step.id}
                    className="rounded-2xl border border-cream-300 bg-gradient-to-br from-cream-100 to-stitch-50 p-4 text-center"
                  >
                    <p className="text-xs font-bold tracking-widest text-stitch-700/50 uppercase">
                      {step.title}
                    </p>
                    <p className="mt-2 text-3xl" aria-hidden="true">
                      {option?.emoji ?? "·"}
                    </p>
                    <p className="font-display mt-1 font-semibold text-stitch-900">
                      {option?.label ?? "not chosen"}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-stitch-100 bg-stitch-50/70 p-4">
                <p className="flex items-center gap-2 text-xs font-bold tracking-widest text-stitch-700/60 uppercase">
                  <MessageCircle className="size-3.5" aria-hidden="true" />
                  the message that goes to him
                </p>
                <p className="mt-3 text-sm whitespace-pre-wrap text-stitch-800/90">{message}</p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                {whatsappReady ? (
                  <a
                    href={whatsappLink(message)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      playChime();
                      setToast("Opening WhatsApp… no take-backs now 😌");
                    }}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-palm-500 to-stitch-500 px-6 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                  >
                    <MessageCircle className="size-5" aria-hidden="true" />
                    Send it to {firstName(siteConfig.myName)} on WhatsApp
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => void copyMessage()}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-palm-500 to-stitch-500 px-6 py-3.5 font-bold text-white shadow-lg transition hover:-translate-y-0.5"
                  >
                    {copied ? (
                      <Check className="size-5" aria-hidden="true" />
                    ) : (
                      <Copy className="size-5" aria-hidden="true" />
                    )}
                    {copied ? "Copied!" : "Copy the message for him 📋"}
                  </button>
                )}

                {whatsappReady && (
                  <button
                    type="button"
                    onClick={() => void copyMessage()}
                    className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-stitch-200 bg-white px-6 py-3.5 font-bold text-stitch-800 transition hover:-translate-y-0.5 hover:border-stitch-300"
                  >
                    {copied ? (
                      <Check className="size-5 text-palm-500" aria-hidden="true" />
                    ) : (
                      <Copy className="size-5" aria-hidden="true" />
                    )}
                    {copied ? "copied" : "copy instead"}
                  </button>
                )}
              </div>

              {!whatsappReady && (
                <p className="mt-3 rounded-2xl bg-cream-200 px-4 py-3 text-xs text-stitch-800/70">
                  My phone isn&apos;t linked to this button just yet — copy the message, send it to
                  me, and I promise I&apos;ll drop everything 💙
                </p>
              )}

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  onClick={() => goTo(0)}
                  className="inline-flex items-center gap-1.5 font-semibold text-stitch-700 transition hover:text-hibiscus-500"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  change something
                </button>
                <button
                  type="button"
                  onClick={startOver}
                  className="inline-flex items-center gap-1.5 font-semibold text-stitch-700/70 transition hover:text-stitch-900"
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  start over
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentStep.id}
              initial={{ opacity: 0, x: direction * 70 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -70 }}
              transition={{ duration: 0.32, ease: "easeOut" }}
              className="mt-7"
            >
              <p className="text-xs font-bold tracking-widest text-stitch-700/50 uppercase">
                step {stepIndex + 1} of {totalSteps} · {currentStep.title}
              </p>
              <h3 className="font-display mt-2 text-2xl font-semibold text-stitch-900">
                {currentStep.question}
              </h3>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {currentStep.options.map((option) => {
                  const selected = choices[currentStep.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => choose(currentStep, option)}
                      aria-pressed={selected}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${
                        selected
                          ? "border-hibiscus-400 bg-hibiscus-100"
                          : "border-stitch-100 bg-white hover:-translate-y-0.5 hover:border-stitch-300"
                      }`}
                    >
                      <span className="text-3xl" aria-hidden="true">
                        {option.emoji}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-stitch-900">{option.label}</span>
                        <span className="block text-sm text-stitch-800/70">{option.blurb}</span>
                      </span>
                      {selected && (
                        <Check
                          className="ml-auto size-5 shrink-0 text-hibiscus-500"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => goTo(stepIndex - 1)}
                  disabled={stepIndex === 0}
                  className="inline-flex items-center gap-1.5 rounded-full border-2 border-stitch-100 bg-white px-5 py-2.5 font-semibold text-stitch-800 transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="size-4" aria-hidden="true" />
                  back
                </button>
                <button
                  type="button"
                  onClick={() => goTo(stepIndex + 1)}
                  disabled={!choices[currentStep.id]}
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-stitch-600 to-lavender-500 px-5 py-2.5 font-semibold text-white shadow-md transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  next
                  <ChevronRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            role="status"
            className="fixed bottom-5 left-1/2 z-70 flex max-w-[92vw] -translate-x-1/2 items-center gap-2 rounded-full bg-stitch-900/92 px-5 py-3 text-center text-sm font-semibold text-white shadow-2xl"
          >
            <Sparkles className="size-4 shrink-0 text-lavender-300" aria-hidden="true" />
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}


