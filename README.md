# 💙 Ohana means family — a Stitch-themed "I'm sorry" page

A cute, interactive single-page apology site: a typed-out sorry note, a
love-coupon flip-card collection, a forgiveness game with a button that runs
away, and a build-your-own makeup-date picker that sends the plan straight to
WhatsApp.

**Stack:** Next.js 16 (App Router, static export) · TypeScript · Tailwind CSS v4
· Framer Motion · canvas-confetti · Lucide React.

No backend, no database, no API routes — it is a fully static bundle, so it
deploys anywhere (Vercel, Netlify, GitHub Pages, a USB stick…).

---

## 🚀 Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

```bash
npm run build        # emits a static site into ./out
npm run typecheck    # next typegen + tsc --noEmit
npm run lint         # eslint (Next.js flat config)
```

---

## 💌 Personalise it (2 minutes)

Everything you need to change lives in **`lib/config.ts`**:

| Field            | What it does                                                        |
| ---------------- | ------------------------------------------------------------------- |
| `herName`        | Her name / nickname — used in the hero, footer and the WhatsApp text |
| `myName`         | Your name — shown on the "Send it to …" button                       |
| `whatsappNumber` | **Country code + number, digits only** (e.g. `919876543210`)         |
| `apology`        | The kicker, the typed headline, the paragraphs and the signature     |

> Until `whatsappNumber` is a real number, the Date Builder politely offers a
> "copy the message" button instead of opening a broken WhatsApp chat — so the
> page never breaks in front of her.

Other quick edits:

- **Coupons** → `COUPONS` in `components/CouponGrid.tsx`
- **Date options** (food / activity / dessert) → `STEPS` in `components/DateBuilder.tsx`
- **Taunts & button labels** → `TAUNTS` / `STILL_MAD_LABELS` in `components/EvasiveButtons.tsx`
- **Colours & animations** → the `@theme` block in `app/globals.css`

---

## ✨ What's inside

1. **`components/Hero.tsx`** — typewriter headline
   (_"Ohana means family... and family means I'm really sorry 🥺💙"_), the
   heartfelt note with staggered paragraphs, promise chips and the mascot.
2. **`components/EvasiveButtons.tsx`** — _"Forgive Me ❤️"_ (grows bigger with
   every dodge → confetti + heart explosion + a full triumph screen) vs
   _"Still Mad 😤"_ which teleports to a random spot inside the play area on
   hover/tap, gets smaller each time, throws tantrum messages, and gives up
   after 8 dodges. It never lands on top of the Forgive button, keyboard users
   can still reach it, and `prefers-reduced-motion` turns the dodging off.
3. **`components/CouponGrid.tsx`** — six 3D flip cards (back rub, boba,
   "you win this argument", breakfast in bed, you pick the movie, unlimited
   hugs). Claiming one fires a confetti burst and is remembered in
   `localStorage`.
4. **`components/DateBuilder.tsx`** — a 3-step picker (food → activity →
   dessert), a summary card with a live message preview, and a
   `https://wa.me/<number>?text=<encoded message>` hand-off plus a
   copy-to-clipboard fallback.
5. **`components/StitchMascot.tsx`** — a hand-drawn, fully animated **inline
   SVG** Stitch. No GIFs or image files to load: it blinks, wiggles its ears,
   cries when sorry, sparkles when happy and hugs a heart when in love.
6. **`lib/sound.ts`** — tiny Web-Audio sound effects (pop, sparkle, swoosh,
   happy chime) synthesised in the browser. No audio files, and a speaker
   toggle in the floating nav.

Everything respects `prefers-reduced-motion`, uses semantic buttons/links and
keeps a screen-reader-friendly copy of all typewriter text.

---

## ☁️ Deploy to Vercel

1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Framework preset: **Next.js** (build `npm run build`, output `out`) → **Deploy**.
4. Send her the link. 💙

`next.config.ts` already sets `output: "export"` + `trailingSlash: true`, so the
same `npm run build` works for any static host (just publish the `out/` folder).

---

## 📝 Notes / limitations

- Confetti and the WhatsApp hand-off are client-side only; the site itself is
  prerendered to HTML at build time.
- The WhatsApp link intentionally uses `wa.me` (no WhatsApp API, no keys).
- Redeemed coupons are stored per-browser in `localStorage` — clearing site
  data resets them.
- `metadataBase` in `app/layout.tsx` points at a placeholder domain; change it
  to your deployed URL so link previews (WhatsApp/iMessage) show correctly.
