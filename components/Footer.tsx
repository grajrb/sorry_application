import { Heart, Mail, Sparkles } from "lucide-react";
import { apology, siteConfig } from "@/lib/config";

/** Closing note — the last thing she reads before she (hopefully) smiles. */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-16 overflow-hidden px-4 pb-10">
      <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/70 bg-white/70 p-8 text-center shadow-[0_20px_50px_-25px_rgba(43,108,176,0.5)] backdrop-blur">
        <div className="mx-auto mb-3 flex w-fit items-center gap-2 rounded-full bg-lavender-100 px-4 py-1.5 text-sm font-semibold text-lavender-600">
          <Sparkles className="size-4" aria-hidden="true" />
          one last thing
        </div>

        <p className="font-display text-2xl font-semibold text-stitch-800 sm:text-3xl">
          Thank you for reading the whole thing 🥹
        </p>

        <p className="mx-auto mt-3 max-w-xl text-stitch-800/80">
          If you&apos;re still a little mad, that&apos;s okay — I&apos;ll keep being the fluffiest,
          most annoying, most apologetic Stitch until you smile. You are my ohana,{" "}
          {siteConfig.herName}. Always.
        </p>

        <p className="font-display mt-5 text-lg text-hibiscus-500 italic">{apology.signature}</p>

        <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm text-stitch-800/70">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1.5">
            <Heart className="size-4 text-hibiscus-400" aria-hidden="true" />
            made with love, not with AI judgement
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cream-200 px-3 py-1.5">
            <Mail className="size-4 text-stitch-600" aria-hidden="true" />
            psst… the date builder really does message me
          </span>
        </div>

        <p className="mt-7 text-xs text-stitch-800/50">
          © {year} {siteConfig.myName} · built with Next.js, Tailwind &amp; a lot of snacks 🌺
        </p>
      </div>
    </footer>
  );
}
