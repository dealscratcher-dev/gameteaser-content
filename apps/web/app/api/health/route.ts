// apps/web/app/api/health/route.ts
// Docker HEALTHCHECK + uptime monitoring endpoint
// Returns 200 OK with basic status — add Redis/DB checks below

import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const checks: Record<string, "ok" | "error"> = {
    app: "ok",
  };

  // ── Optional: Redis ping ──────────────────────────────
  try {
    const { ping } = await import("@/lib/redis");
    checks.redis = (await ping()) ? "ok" : "error";
  } catch {
    checks.redis = "error";
  }

  const allOk = Object.values(checks).every((v) => v === "ok");

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      checks,
      version: process.env.APP_VERSION ?? "dev",
    },
    { status: allOk ? 200 : 503 }
  );
}
