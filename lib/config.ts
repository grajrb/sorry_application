/**
 * ============================================================
 *  💙  EVERYTHING YOU NEED TO PERSONALISE LIVES IN THIS FILE
 * ============================================================
 *
 * 1. `herName`          – her name / nickname (used all over the page)
 * 2. `myName`           – your name (used on the "Send to ..." button)
 * 3. `whatsappNumber`   – country code + number, digits only (no "+", no spaces)
 *                         e.g. India  : 919876543210
 *                              USA    : 14155552671
 *                         While this still equals `PLACEHOLDER_WHATSAPP`, the
 *                         Date Builder politely copies the message instead of
 *                         opening a broken WhatsApp chat.
 * 4. `apology`          – the heartfelt note that gets typed out in the hero.
 */

export const PLACEHOLDER_WHATSAPP = "911234567890";

export const siteConfig = {
  /** Her name (or the nickname only you use 🙂) */
  herName: "My Love",
  /** Your name, shown on the "Send to ..." button */
  myName: "Your Stitch",
  /** WhatsApp number: country code + number, digits only */
  whatsappNumber: PLACEHOLDER_WHATSAPP,
} as const;

export const apology = {
  kicker: "A tiny apology from a very sorry blue alien",
  headline: "Ohana means family... and family means I'm really sorry 🥺💙",
  /** Rendered as separate paragraphs in the apology card */
  paragraphs: [
    `Hey ${siteConfig.herName}, I messed up, and I've been sitting here feeling like Stitch locked in his little cell — small, blue and very sorry.`,
    "I know an apology doesn't magically fix a hurt feeling, so I'm not here to rush you. I just want you to know that I heard you, I understand, and I hate that I made you sad.",
    "You are my ohana. Nobody gets left behind, and nobody gets hurt by me on purpose — so let me make it right, one silly coupon and one very over-the-top date at a time.",
  ],
  /** Little promise chips under the letter */
  promises: [
    { emoji: "👂", title: "I'm listening", text: "No excuses, no interrupting — just your side of it." },
    { emoji: "🩹", title: "I'll do better", text: "Same mistake twice? It won't happen again." },
    { emoji: "🤝", title: "Us over ego", text: "I'd rather be happy with you than right without you." },
  ],
  signature: "— your extremely sorry Stitch 💙",
} as const;

/** True once a real number has been filled in above. */
export function isWhatsappConfigured(): boolean {
  const digits = siteConfig.whatsappNumber.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15 && digits !== PLACEHOLDER_WHATSAPP;
}

/** Builds a wa.me deep-link with the message pre-filled. */
export function whatsappLink(message: string): string {
  const digits = siteConfig.whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

/** "Anna Banana" -> "Anna" */
export function firstName(name: string = siteConfig.herName): string {
  return name.trim().split(/\s+/)[0] ?? name;
}
