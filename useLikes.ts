// useLikes.ts
import { useState, useCallback, useEffect } from "react";

/**
 * Simple hook to manage "likes" for arbitrary items.
 * It stores liked item IDs in `localStorage` under the key "likes".
 */
export function useLikes<T extends string = string>() {
  const [likes, setLikes] = useState<Set<T>>(new Set());

  // Load likes from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem("likes");
    if (raw) {
      try {
        const arr: T[] = JSON.parse(raw);
        setLikes(new Set(arr));
      } catch {
        // ignore malformed data
      }
    }
  }, []);

  const like = useCallback((id: T) => {
    setLikes((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("likes", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const unlike = useCallback((id: T) => {
    setLikes((prev) => {
      const next = new Set(prev);
      next.delete(id);
      localStorage.setItem("likes", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const isLiked = useCallback((id: T) => likes.has(id), [likes]);

  return { likes: Array.from(likes) as T[], like, unlike, isLiked };
}
