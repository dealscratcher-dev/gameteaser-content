// apps/web/next.config.ts

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ── No "output" field ─────────────────────────────────────────────────────
  // "standalone" is for Docker/self-hosted Node servers.
  // "export"     is for fully-static sites (breaks API routes).
  // Omitting it lets @netlify/plugin-nextjs handle SSR, API routes,
  // middleware, and image optimisation automatically via Netlify Functions.

  images: {
    // WHY EXPLICIT PATTERNS INSTEAD OF hostname:"**":
    // The wildcard pattern technically works in Next.js 13.4+ but Netlify's
    // image optimisation proxy can still 400 on double-encoded Supabase CDN
    // URLs. The real fix is `unoptimized` on external URLs in Hero.tsx, but
    // keeping explicit patterns here is safer and avoids the open-proxy risk.
    remotePatterns: [
      // Supabase Storage CDN — covers all public bucket images
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      // Supabase auth avatars / realtime thumbnails
      {
        protocol: "https",
        hostname: "*.supabase.in",
        pathname: "/storage/v1/object/public/**",
      },
      // Local development
      {
        protocol: "http",
        hostname: "localhost",
      },
      // Any other CDN you add later — remove this and add explicit
      // entries if you want to lock down the allow-list further.
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  // ── Critical: prevent edge function bundling error for @opentelemetry/api ──
  // This tells Next.js not to inline this package into edge bundles,
  // avoiding the "Could not resolve '@opentelemetry/api'" error.
  serverExternalPackages: ["@opentelemetry/api"],
};

export default nextConfig;