// apps/web/hooks/useCountdown.ts

"use client";

import { useState, useEffect, useRef } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CountdownResult {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Total milliseconds remaining */
  totalMs: number;
  /** 0–1 fraction of time elapsed */
  progress: number;
  /** true when the target date is in the past */
  expired: boolean;
  /** "critical" < 24h, "warning" < 72h, "normal" otherwise */
  urgency: "critical" | "warning" | "normal";
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Live countdown to `endDate`.
 *
 * @param endDate   - target Date (or ISO string)
 * @param startDate - optional start for progress calculation
 * @param tickMs    - update interval in ms (default 1000)
 */
export function useCountdown(
  endDate: Date | string | null | undefined,
  startDate?: Date | string | null,
  tickMs = 1_000
): CountdownResult {
  const end = endDate ? new Date(endDate).getTime() : null;
  const start = startDate ? new Date(startDate).getTime() : null;

  function compute(): CountdownResult {
    const now = Date.now();

    if (!end) {
      return {
        days: 0, hours: 0, minutes: 0, seconds: 0,
        totalMs: 0, progress: 0, expired: true, urgency: "normal",
      };
    }

    const totalMs = Math.max(0, end - now);
    const expired = totalMs === 0;

    const days    = Math.floor(totalMs / 86_400_000);
    const hours   = Math.floor((totalMs % 86_400_000) / 3_600_000);
    const minutes = Math.floor((totalMs % 3_600_000)  / 60_000);
    const seconds = Math.floor((totalMs % 60_000)      / 1_000);

    const progress =
      start && end > start
        ? Math.min(1, (now - start) / (end - start))
        : 0;

    const urgency: CountdownResult["urgency"] =
      totalMs < 86_400_000
        ? "critical"
        : totalMs < 259_200_000
        ? "warning"
        : "normal";

    return { days, hours, minutes, seconds, totalMs, progress, expired, urgency };
  }

  const [state, setState] = useState<CountdownResult>(compute);
  const frameRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setState(compute());
    frameRef.current = setInterval(() => setState(compute()), tickMs);
    return () => {
      if (frameRef.current) clearInterval(frameRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, start, tickMs]);

  return state;
}
