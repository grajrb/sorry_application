import type { NextConfig } from "next";

/**
 * Pure static front-end build.
 *
 * `output: "export"` makes `next build` emit a fully static site into `out/`
 * (no server, no database, no API routes) — perfect for Vercel / any static host.
 * `images.unoptimized` keeps `next/image` usable without the Next.js image server.
 */
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
