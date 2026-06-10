"use client";

// apps/web/components/layout/Hero.tsx

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useEventImages, type Vertical } from "@/hooks/useEventImages";

export interface HeroTag {
  emoji: string;
  label: string;
  variant?: "codm" | "pubg" | "anime" | "comicon" | "default";
}

export interface HeroProps {
  title: string;
  highlight?: string;
  kicker?: string;
  note?: string;
  tags?: HeroTag[];
  imageSrc?: string;
  imageAlt?: string;
  ctaLabel?: string;
  ctaHref?: string;
  activeVertical?: Vertical;
  loading?: boolean;
  className?: string;
}

const TAG_VARIANTS: Record<NonNullable<HeroTag["variant"]>, string> = {
  codm:    "bg-orange-500/20 text-orange-300 ring-1 ring-orange-500/30",
  pubg:    "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-500/30",
  anime:   "bg-purple-500/20 text-purple-300 ring-1 ring-purple-500/30",
  comicon: "bg-cyan-500/20   text-cyan-300   ring-1 ring-cyan-500/30",
  default: "bg-white/10      text-white/80   ring-1 ring-white/15",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns true for absolute URLs (Supabase CDN, etc.) — skip Next.js optimisation. */
function isExternalUrl(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <section
      aria-busy="true"
      aria-label="Loading hero"
      className="relative isolate min-h-[500px] md:min-h-[640px] overflow-hidden bg-zinc-900"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.035]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-900/60 to-transparent" />
      <div className="relative z-20 flex h-full flex-col justify-end px-4 pb-10 pt-28 sm:px-6 sm:pb-14 md:px-16 md:pb-20 max-w-5xl mx-auto md:pt-32">
        <div className="h-4 w-28 rounded bg-white/10 animate-pulse mb-4" />
        <div className="h-10 w-3/4 rounded bg-white/10 animate-pulse mb-3" />
        <div className="h-10 w-1/2 rounded bg-white/10 animate-pulse mb-8" />
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-36 rounded-full bg-white/10 animate-pulse" />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CrossfadeImage ───────────────────────────────────────────────────────────
// Two stacked absolutely-positioned layers. Opacity swaps ONLY after the
// incoming image has fully loaded — no black flash.
//
// Flow:
//   1. New src arrives  → write it into the hidden layer
//   2. Wait for onLoad  → image is decoded and painted in memory
//   3. Then swap opacity → seamless crossfade, never shows background colour
//
// KEY FIX: Supabase Storage URLs are already CDN-served. Passing them through
// Next.js image optimisation (/_next/image?url=...) double-encodes the URL and
// causes a 400 on Netlify. `unoptimized` bypasses that pipeline for any
// absolute https:// src.

// Crossfade duration — keep in sync with the Tailwind class `duration-700` below.
const CROSSFADE_DURATION_MS = 700;

interface CrossfadeImageProps {
  src: string;
  alt: string;
}

function CrossfadeImage({ src, alt }: CrossfadeImageProps) {
  // layers[0] = front (visible), layers[1] = back (preloading)
  const [layers, setLayers]             = useState<[string, string]>([src, src]);
  const [frontVisible, setFrontVisible] = useState(true);
  const prevSrcRef                      = useRef(src);
  const swapTimerRef                    = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (src === prevSrcRef.current) return;
    prevSrcRef.current = src;

    // Write the new URL into the hidden layer — browser starts fetching it.
    // The actual opacity swap happens in the onLoad handler below.
    if (frontVisible) {
      setLayers(([front]) => [front, src]); // load into back
    } else {
      setLayers(([, back]) => [src, back]); // load into front
    }
  }, [src, frontVisible]);

  // Called when the hidden layer finishes decoding
  function handleHiddenLoaded() {
    if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    // Small rAF delay ensures the painted frame is committed before we fade
    swapTimerRef.current = setTimeout(
      () => setFrontVisible((v) => !v),
      16 // one frame — image is in the GPU, safe to start CSS transition
    );
  }

  useEffect(() => {
    return () => {
      if (swapTimerRef.current) clearTimeout(swapTimerRef.current);
    };
  }, []);

  const [frontSrc, backSrc] = layers;

  return (
    <>
      {/* Back layer — hidden while front is visible; triggers swap when loaded */}
      <Image
        src={backSrc}
        alt={alt}
        fill
        unoptimized={isExternalUrl(backSrc)}
        loading="eager"
        onLoad={frontVisible ? handleHiddenLoaded : undefined}
        className={cn(
          "object-cover object-center absolute inset-0 transition-opacity duration-700 ease-in-out",
          frontVisible ? "opacity-0" : "opacity-100"
        )}
        sizes="100vw"
      />
      {/* Front layer — visible; triggers swap when loaded on its turn */}
      <Image
        src={frontSrc}
        alt={alt}
        fill
        unoptimized={isExternalUrl(frontSrc)}
        loading="eager"
        priority={!isExternalUrl(frontSrc)} // priority only for local LCP asset
        fetchPriority={isExternalUrl(frontSrc) ? "auto" : "high"}
        onLoad={!frontVisible ? handleHiddenLoaded : undefined}
        className={cn(
          "object-cover object-center absolute inset-0 transition-opacity duration-700 ease-in-out",
          frontVisible ? "opacity-100" : "opacity-0"
        )}
        sizes="100vw"
      />
    </>
  );
}

// ─── RotatingHeroBackground ───────────────────────────────────────────────────
// Owns the preload-ahead logic: while image[n] is visible, it preloads
// image[n+1] by injecting a hidden <link rel="preload"> into the document head.
// By the time the rotation timer fires, the next image is already in cache.

function RotatingHeroBackground({
  vertical,
  fallbackSrc,
}: {
  vertical: Vertical;
  fallbackSrc: string;
}) {
  const { images, currentImage, isLoading } = useEventImages(vertical);

  const src     = currentImage?.url ?? fallbackSrc;
  const altText = currentImage?.alt_text ?? "Hero banner";

  // Preload the NEXT image in the rotation while the current one is displayed
  useEffect(() => {
    if (images.length < 2 || !currentImage) return;

    const currentIdx = images.findIndex((img) => img.url === currentImage.url);
    const nextIdx    = (currentIdx + 1) % images.length;
    const nextUrl    = images[nextIdx]?.url;
    if (!nextUrl) return;

    // Inject <link rel="preload"> so the browser fetches it in the background
    const link = document.createElement("link");
    link.rel          = "preload";
    link.as           = "image";
    link.href         = nextUrl;
    link.fetchPriority = "low";
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, [currentImage, images]);

  return (
    <>
      {/* Static fallback always sits underneath — covers the gap while
          Supabase fetch is in-flight, no black background ever shows */}
      <Image
        src={fallbackSrc}
        alt="Hero banner"
        fill
        loading="eager"
        priority
        fetchPriority="high"
        className="object-cover object-center absolute inset-0"
        sizes="100vw"
      />
      {/* Crossfader mounts on top once images are ready */}
      {!isLoading && <CrossfadeImage src={src} alt={altText} />}
    </>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export default function Hero({
  title,
  highlight,
  kicker = "games · anime · comic-cons",
  note,
  tags = [],
  imageSrc = "/assets/hero-banner.png",
  imageAlt = "Hero banner",
  ctaLabel,
  ctaHref,
  activeVertical,
  loading = false,
  className,
}: HeroProps) {
  if (loading) return <HeroSkeleton />;

  return (
    <section
      aria-label="Season Rush banner"
      className={cn(
        "relative isolate min-h-[500px] md:min-h-[640px] overflow-hidden",
        className
      )}
    >
      {/* Grain overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Background — rotating (Supabase) or static */}
      {activeVertical ? (
        <RotatingHeroBackground vertical={activeVertical} fallbackSrc={imageSrc} />
      ) : (
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          loading="eager"
          fetchPriority="high"
          className="object-cover object-center"
          sizes="100vw"
        />
      )}

      {/* Bottom-up gradient */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-t from-zinc-950 via-zinc-950/45 to-zinc-950/5"
      />
      {/* Side vignette */}
      <div
        aria-hidden="true"
        className="absolute inset-0 z-10 bg-gradient-to-r from-zinc-950/55 via-zinc-950/10 to-zinc-950/15"
      />

      {/* Content */}
      <div className="relative z-20 flex h-full flex-col justify-end px-4 pb-10 pt-28 sm:px-6 sm:pb-14 md:px-16 md:pb-20 max-w-5xl mx-auto md:pt-32">

        {kicker && (
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50 font-[family-name:var(--font-ibm-plex)] sm:text-xs sm:tracking-[0.25em]">
            {kicker}
          </p>
        )}

        <h1 className="mb-5 max-w-[11ch] font-[family-name:var(--font-barlow-condensed)] text-[2.35rem] font-extrabold uppercase leading-[0.95] tracking-tight text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.6)] min-[420px]:text-5xl sm:max-w-none sm:text-6xl md:text-7xl">
          {title}
          {highlight && (
            <>
              <br />
              <span className="text-orange-400">{highlight}</span>
            </>
          )}
        </h1>

        {tags.length > 0 && (
          <ul aria-label="Content categories" className="mb-5 flex max-w-full gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:flex-wrap sm:overflow-visible sm:pb-0">
            {tags.map((tag) => (
              <li key={tag.label} className="shrink-0">
                <span
                  className={cn(
                    "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 py-1",
                    "text-xs font-semibold font-[family-name:var(--font-ibm-plex)]",
                    "backdrop-blur-sm transition-colors",
                    TAG_VARIANTS[tag.variant ?? "default"]
                  )}
                >
                  <span aria-hidden="true">{tag.emoji}</span>
                  {tag.label}
                </span>
              </li>
            ))}
          </ul>
        )}

        {ctaLabel && ctaHref && (
          <div className="mb-5">
            <Link
              href={ctaHref}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-none border border-orange-500 bg-orange-500 px-6 py-2.5 font-[family-name:var(--font-barlow-condensed)] text-sm font-bold uppercase tracking-widest text-zinc-950 transition-all hover:bg-transparent hover:text-orange-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400 active:scale-95"
            >
              {ctaLabel}
            </Link>
          </div>
        )}

        {note && (
          <p
            className="text-xs text-white/40 font-[family-name:var(--font-ibm-plex)]"
            dangerouslySetInnerHTML={{ __html: note }}
          />
        )}
      </div>
    </section>
  );
}
