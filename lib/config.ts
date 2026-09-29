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
 *                         Gaurav's real number is filled in below, so the Date
 *                         Builder opens the chat with the date message already
 *                         typed out. If you ever blank it back to
 *                         `PLACEHOLDER_WHATSAPP`, the page quietly switches to a
 *                         "copy the message" button instead of opening a broken
 *                         WhatsApp chat.
 * 4. `apology`          – the heartfelt note that gets typed out in the hero.
 */

export const PLACEHOLDER_WHATSAPP = "911234567890";

/**
 * Gaurav's number (+91 79924 25448) written the way wa.me wants it: country
 * code + number, digits only, no "+" and no spaces. Swap it for
 * `PLACEHOLDER_WHATSAPP` again and the page quietly goes back to offering a
 * "copy the message" button instead of opening a chat.
 */
const MY_WHATSAPP = "917992425448";

/**
 * The number can live here, or in the environment variable
 * `NEXT_PUBLIC_WHATSAPP_NUMBER` (Vercel → Project → Settings → Environment
 * Variables). The environment variable wins, so the number can be changed after
 * deploying without touching the code.
 */
const whatsappFromEnv = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");

export const siteConfig = {
  /** Her name (or the nickname only you use 🙂) */
  herName: "Kushi",
  /** Your name, shown on the "Send to ..." button */
  myName: "Gaurav",
  /** WhatsApp number: country code + number, digits only */
  whatsappNumber: whatsappFromEnv || MY_WHATSAPP,
} as const;

export const apology = {
  kicker: "A tiny apology, designed with Google Stitch ✨",
  headline: "I couldn't find the words, so I designed you a whole page instead 🥺💙",
  /** Rendered as separate paragraphs in the apology card */
  paragraphs: [
    `Hey ${siteConfig.herName}, I messed up. I sat down to send you a normal sorry text and ended up redesigning this whole page instead — apparently I'd rather build you something than say the hard thing out loud.`,
    "I know an apology doesn't magically fix a hurt feeling, so I'm not here to rush you. I just want you to know that I heard you, I understand, and I hate that I made you sad.",
    "You are my favourite person and my favourite idea. Nobody gets left behind, and nobody gets hurt by me on purpose — so let me make it right, one silly coupon and one very over-the-top date at a time.",
  ],
  /** Little promise chips under the letter */
  promises: [
    { emoji: "👂", title: "I'm listening", text: "No excuses, no interrupting — just your side of it." },
    { emoji: "🩹", title: "I'll do better", text: "Same mistake twice? It won't happen again." },
    { emoji: "🤝", title: "Us over ego", text: "I'd rather be happy with you than right without you." },
  ],
  signature: `— ${siteConfig.myName}, your extremely sorry designer 💙`,
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
