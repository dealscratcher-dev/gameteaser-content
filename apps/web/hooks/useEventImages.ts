"use client";

// apps/web/hooks/useEventImages.ts

import { useCallback, useEffect, useRef, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase.client";

export type Vertical = "games" | "anime" | "comicon";

export interface EventImage {
  id: string;
  url: string;
  vertical: Vertical;
  event_id: string | null;
  display_order: number;
  alt_text: string;
}

export interface UseEventImagesResult {
  images: EventImage[];
  currentImage: EventImage | undefined;
  isLoading: boolean;
  error: string | null;
}

// How long each image is shown before rotating to the next.
// Must be long enough for the next image to preload — 8 s is comfortable
// on a typical 4G connection for a ~300 KB hero image.
// Hero.tsx reads this same value so crossfade duration is coordinated.
export const ROTATION_MS = 8_000;

export function useEventImages(vertical: Vertical): UseEventImagesResult {
  const [images, setImages]             = useState<EventImage[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(undefined);
  const [isLoading, setIsLoading]       = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const timerRef                        = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchImages = useCallback(async (v: Vertical) => {
    setIsLoading(true);
    setError(null);

    const supabase = createBrowserSupabaseClient();
    const { data, error: sbError } = await supabase
      .from("event_images")
      .select("id, url, vertical, event_id, display_order, alt_text")
      .eq("vertical", v)
      .eq("active", true)
      .order("display_order", { ascending: true });

    if (sbError) {
      setError(sbError.message);
      setImages([]);
      setCurrentIndex(undefined);
      setIsLoading(false);
      return;
    }

    const rows = (data ?? []) as EventImage[];
    setImages(rows);
    setCurrentIndex(rows.length > 0 ? 0 : undefined);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchImages(vertical);
  }, [vertical, fetchImages]);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (images.length < 2) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) =>
        prev === undefined ? 0 : (prev + 1) % images.length
      );
    }, ROTATION_MS);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [images]);

  const currentImage =
    currentIndex !== undefined ? images[currentIndex] : undefined;

  return { images, currentImage, isLoading, error };
}