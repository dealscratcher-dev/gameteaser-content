// apps/web/hooks/useStreak.ts
"use client";

import { useEffect, useState } from "react";

/**
 * Hook to manage a daily activity streak.
 *
 * Stores activity dates (YYYY-MM-DD) in localStorage under `streakDates`.
 *
 * Returns:
 *   streak    — current consecutive-day streak count (number)
 *   increment — call once per day to record today's activity
 *   reset     — wipe all stored dates and reset to 0
 *   lastDate  — most recent recorded date string, or null
 */
export interface UseStreakReturn {
  streak: number;
  increment: () => void;
  reset: () => void;
  lastDate: string | null;
}

export function useStreak(): UseStreakReturn {
  const STORAGE_KEY = "streakDates";

  const [dates, setDates] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);

  // Load persisted dates on mount (client-only — localStorage unavailable on server)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        if (Array.isArray(parsed)) {
          setDates(parsed);
          setStreak(computeStreak(parsed));
        }
      }
    } catch {
      // Malformed data — start fresh
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const save = (newDates: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newDates));
    } catch {
      // localStorage quota exceeded — proceed with in-memory state only
    }
    setDates(newDates);
    setStreak(computeStreak(newDates));
  };

  const increment = () => {
    const today = todayString();
    if (dates.includes(today)) return; // already counted today
    save([...dates, today]);
  };

  const reset = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setDates([]);
    setStreak(0);
  };

  const lastDate = dates.length > 0 ? [...dates].sort().at(-1) ?? null : null;

  return { streak, increment, reset, lastDate };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Today's date as YYYY-MM-DD in local time */
function todayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Compute the consecutive-day streak counting back from today.
 * A streak is the number of contiguous days ending on today (or yesterday
 * if the user hasn't logged in yet today).
 */
function computeStreak(dateStrings: string[]): number {
  if (!dateStrings.length) return 0;

  const unique = [...new Set(dateStrings)].sort().reverse(); // newest first
  const today = todayString();
  const yesterday = offsetDate(today, -1);

  // Streak must start from today or yesterday
  if (unique[0] !== today && unique[0] !== yesterday) return 0;

  let count = 1;
  for (let i = 1; i < unique.length; i++) {
    const expected = offsetDate(unique[i - 1], -1);
    if (unique[i] === expected) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

/** Return a YYYY-MM-DD date string offset by `days` from a given YYYY-MM-DD string */
function offsetDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
