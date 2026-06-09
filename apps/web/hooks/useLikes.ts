// apps/web/hooks/useLikes.ts
import { useState, useCallback, useEffect } from 'react';

/**
 * Hook to manage "like" state for a given item.
 *
 * - Persists likes in `localStorage` under the key `app_likes`.
 * - Optionally synchronises with a backend via `/api/likes` if that endpoint exists.
 * - Returns a boolean indicating whether the current user liked the item and a toggle function.
 */
export function useLikes(itemId: string): [boolean, () => void] {
  const storageKey = 'app_likes';

  // Initialise likes from localStorage (returns a Set of liked IDs)
  const getStoredLikes = (): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  };

  const [liked, setLiked] = useState<boolean>(() => {
    const stored = getStoredLikes();
    return stored.has(itemId);
  });

  // Helper to write the whole Set back to storage
  const writeLikes = (likes: Set<string>) => {
    if (typeof window === 'undefined') return;
    try {
      const arr = Array.from(likes);
      window.localStorage.setItem(storageKey, JSON.stringify(arr));
    } catch {
      // ignore storage errors
    }
  };

  const syncWithServer = async (newState: boolean) => {
    try {
      await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, liked: newState }),
      });
    } catch {
      // server sync failure is non‑blocking
    }
  };

  const toggle = useCallback(() => {
    setLiked((prev) => {
      const stored = getStoredLikes();
      const newState = !prev;
      if (newState) {
        stored.add(itemId);
      } else {
        stored.delete(itemId);
      }
      writeLikes(stored);
      // fire‑and‑forget server sync
      void syncWithServer(newState);
      return newState;
    });
  }, [itemId]);

  // Keep state in sync if another tab updates localStorage
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === storageKey) {
        setLiked(e.newValue ? JSON.parse(e.newValue).includes(itemId) : false);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [itemId]);

  return [liked, toggle];
}
