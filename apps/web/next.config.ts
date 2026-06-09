// apps/web/next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── No "output" field ─────────────────────────────────────────────────────
  // "standalone" is for Docker/self-hosted Node servers.
  // "export"     is for fully-static sites (breaks API routes).
  // Omitting it lets @netlify/plugin-nextjs handle SSR, API routes,
  // middleware, and image optimisation automatically via Netlify Functions.

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http",  hostname: "localhost" },
    ],
  },
};

export default nextConfig;
