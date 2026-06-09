// lib/gamification/streaks.ts
/**
 * Streak management utilities.
 * Streaks are persisted in `localStorage` under the key
 * "gamification:streak" as a JSON string.
 */

export interface Streak {
  /** Number of consecutive days */
  count: number;
  /** Timestamp (ms) of the last recorded visit */
  lastVisit: number;
}

const STORAGE_KEY = "gamification:streak";

/** Load the current streak from localStorage. */
export function loadStreak(): Streak {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Streak;
      // Basic validation – ensure required fields exist.
      if (typeof parsed.count === "number" && typeof parsed.lastVisit === "number") {
        return parsed;
      }
    } catch {
      // fall through to default
    }
  }
  // Default – no streak yet.
  return { count: 0, lastVisit: 0 };
}

/** Save a streak object back to localStorage. */
export function saveStreak(streak: Streak): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(streak));
}

/** Increment the streak if a new day has begun, otherwise keep the count. */
export function incrementStreak(current: Streak): Streak {
  const today = new Date();
  const last = new Date(current.lastVisit);

  // If the last visit was yesterday (or earlier but still a new day), increase the count.
  const isNewDay = today.toDateString() !== last.toDateString();
  const newCount = isNewDay ? current.count + 1 : current.count;
  return { count: newCount, lastVisit: Date.now() };
}

/** Reset the streak to zero – typically used when a day is missed. */
export function resetStreak(): Streak {
  return { count: 0, lastVisit: Date.now() };
}
