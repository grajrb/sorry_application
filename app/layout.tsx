import type { Metadata, Viewport } from "next";
import { Fredoka, Nunito } from "next/font/google";
import Footer from "@/components/Footer";
import TopNav from "@/components/TopNav";
import { siteConfig } from "@/lib/config";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-fredoka",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  // Used to build absolute URLs for link previews (e.g. the WhatsApp preview).
  metadataBase: new URL("https://sorry-stitch.vercel.app"),
  title: "Ohana means family 💙 and I'm really sorry",
  description:
    "A tiny Stitch-themed apology page: a heartfelt note, love coupons, an evasive forgiveness game and a build-your-own makeup date.",
  keywords: ["sorry", "apology", "stitch", "lilo and stitch", "love coupons", "makeup date"],
  authors: [{ name: siteConfig.myName }],
  openGraph: {
    title: "Ohana means family 💙 and I'm really sorry",
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
  themeColor: "#4299e1",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="font-body min-h-dvh antialiased">
        <TopNav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
