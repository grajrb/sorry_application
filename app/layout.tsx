import type { Metadata, Viewport } from "next";
import { Outfit, Roboto } from "next/font/google";
import Footer from "@/components/Footer";
import TopNav from "@/components/TopNav";
import { siteConfig } from "@/lib/config";
import "./globals.css";

/* A Google-flavoured type pairing: Outfit (geometric, close to Google Sans) for
   the headings + Roboto, the Material Design body face. */
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-outfit",
  display: "swap",
});

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-roboto",
  display: "swap",
});

/**
 * The URL this page is actually served from, so WhatsApp/social previews point
 * at the real page. Priority:
 *   1. NEXT_PUBLIC_SITE_URL  (e.g. https://sorry.vercel.app — set it in Vercel)
 *   2. the Vercel production domain, detected automatically at build time
 *   3. this placeholder
 */
const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "https://sorry-application-kappa.vercel.app");

export const metadata: Metadata = {
  // Used to build absolute URLs for link previews (e.g. the WhatsApp preview).
  metadataBase: new URL(siteUrl),
  title: `${siteConfig.herName}, I'm really sorry 💙 (I designed you a whole page)`,
  description:
    "A tiny apology page designed with Google Stitch: a heartfelt note, love coupons, an evasive forgiveness game and a build-your-own makeup date.",
  keywords: ["sorry", "apology", "Google Stitch", "love coupons", "makeup date"],
  authors: [{ name: siteConfig.myName }],
  openGraph: {
    title: `${siteConfig.myName} designed a whole app to say sorry to ${siteConfig.herName} 💙`,
    description:
      "I built you a whole page instead of saying sorry like a normal person. Come click the buttons 🥺",
    type: "website",
    locale: "en_US",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c5fe6",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${outfit.variable} ${roboto.variable}`}>
      {/* `suppressHydrationWarning` keeps browser extensions (Grammarly and
          friends inject `data-gr-*` attributes into <body>) from throwing a
          hydration error — the page itself renders identically. */}
      <body className="font-body min-h-dvh antialiased" suppressHydrationWarning>
        <TopNav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
