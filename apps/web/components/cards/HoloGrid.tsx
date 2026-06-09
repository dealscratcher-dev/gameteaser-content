// apps/web/components/cards/HoloGrid.tsx

"use client";

import { useState, useMemo, useId } from "react";
import { cn } from "@/lib/utils";
import HoloCard, { type HoloCardProps, type HoloRarity, type HoloCardVariant } from "./HoloCard";
import HoloCardSkeleton from "./HoloCardSkeleton";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HoloGridLayout = "grid" | "dense" | "list";

export type HoloGridSortKey = "default" | "rarity" | "title" | "likes";

export interface HoloGridFilter {
  rarity?: HoloRarity[];
  variant?: HoloCardVariant[];
  tag?: string;
}

export interface HoloGridProps {
  /** Card data — each item is spread directly into HoloCard */
  cards?: HoloCardProps[];
  /** Layout preset */
  layout?: HoloGridLayout;
  /** Number of skeleton cards to show while loading */
  skeletonCount?: number;
  /** Whether to show the filter/sort toolbar */
  showToolbar?: boolean;
  /**
   * Active filter (controlled from parent).
   * When undefined the grid manages filter state internally.
   */
  filter?: HoloGridFilter;
  onFilterChange?: (filter: HoloGridFilter) => void;
  /** Heading shown above the grid (optional) */
  heading?: string;
  /** Subheading / result count area */
  subheading?: string;
  /** Callback fired when a card like button is pressed */
  onLike?: (slug: string) => void;
  /** Callback fired when a card bookmark button is pressed */
  onBookmark?: (slug: string) => void;
  /** Set of liked slugs (controlled) */
  likedSlugs?: Set<string>;
  /** Set of bookmarked slugs (controlled) */
  bookmarkedSlugs?: Set<string>;
  loading?: boolean;
  /** Error message to display instead of the grid */
  error?: string;
  /** Called when the user clicks "Try again" on the error state */
  onRetry?: () => void;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const RARITY_ORDER: HoloRarity[] = ["mythic", "legendary", "epic", "rare", "common"];

const RARITY_FILTER_OPTIONS: { value: HoloRarity; label: string }[] = [
  { value: "mythic",    label: "Mythic"    },
  { value: "legendary", label: "Legendary" },
  { value: "epic",      label: "Epic"      },
  { value: "rare",      label: "Rare"      },
  { value: "common",    label: "Common"    },
];

const VARIANT_FILTER_OPTIONS: { value: HoloCardVariant; label: string }[] = [
  { value: "character",  label: "Characters"  },
  { value: "universe",   label: "Universes"   },
  { value: "release",    label: "Releases"    },
  { value: "event",      label: "Events"      },
  { value: "collection", label: "Collections" },
];

const SORT_OPTIONS: { value: HoloGridSortKey; label: string }[] = [
  { value: "default", label: "Featured"  },
  { value: "rarity",  label: "Rarity"    },
  { value: "title",   label: "A → Z"     },
  { value: "likes",   label: "Most Liked"},
];

const LAYOUT_OPTIONS: { value: HoloGridLayout; icon: React.ReactNode; label: string }[] = [
  {
    value: "grid",
    label: "Grid",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
        <rect x="1" y="1" width="6" height="6" rx="0.5" />
        <rect x="9" y="1" width="6" height="6" rx="0.5" />
        <rect x="1" y="9" width="6" height="6" rx="0.5" />
        <rect x="9" y="9" width="6" height="6" rx="0.5" />
      </svg>
    ),
  },
  {
    value: "dense",
    label: "Dense",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
        <rect x="1" y="1" width="4" height="4" rx="0.5" />
        <rect x="6" y="1" width="4" height="4" rx="0.5" />
        <rect x="11" y="1" width="4" height="4" rx="0.5" />
        <rect x="1" y="6" width="4" height="4" rx="0.5" />
        <rect x="6" y="6" width="4" height="4" rx="0.5" />
        <rect x="11" y="6" width="4" height="4" rx="0.5" />
        <rect x="1" y="11" width="4" height="4" rx="0.5" />
        <rect x="6" y="11" width="4" height="4" rx="0.5" />
        <rect x="11" y="11" width="4" height="4" rx="0.5" />
      </svg>
    ),
  },
  {
    value: "list",
    label: "List",
    icon: (
      <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
        <rect x="1" y="1" width="4" height="14" rx="0.5" />
        <rect x="6" y="2" width="9" height="2.5" rx="0.5" />
        <rect x="6" y="6.75" width="9" height="2.5" rx="0.5" />
        <rect x="6" y="11.5" width="9" height="2.5" rx="0.5" />
      </svg>
    ),
  },
];

// ─── Layout class maps ────────────────────────────────────────────────────────

const GRID_CLASSES: Record<HoloGridLayout, string> = {
  grid:  "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5",
  dense: "grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
  list:  "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4",
};

// ─── Sort fn ──────────────────────────────────────────────────────────────────

function sortCards(cards: HoloCardProps[], key: HoloGridSortKey): HoloCardProps[] {
  if (key === "default") return cards;
  return [...cards].sort((a, b) => {
    if (key === "rarity") {
      return (
        RARITY_ORDER.indexOf(a.rarity ?? "common") -
        RARITY_ORDER.indexOf(b.rarity ?? "common")
      );
    }
    if (key === "title") return a.title.localeCompare(b.title);
    if (key === "likes") return (b.likeCount ?? 0) - (a.likeCount ?? 0);
    return 0;
  });
}

// ─── Filter fn ────────────────────────────────────────────────────────────────

function filterCards(cards: HoloCardProps[], f: HoloGridFilter): HoloCardProps[] {
  return cards.filter((c) => {
    if (f.rarity?.length && !f.rarity.includes(c.rarity ?? "common")) return false;
    if (f.variant?.length && c.variant && !f.variant.includes(c.variant)) return false;
    if (f.tag) {
      const needle = f.tag.toLowerCase();
      return (
        c.title.toLowerCase().includes(needle) ||
        c.subtitle?.toLowerCase().includes(needle) ||
        c.tags?.some((t) => t.toLowerCase().includes(needle))
      );
    }
    return true;
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ChevronIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={1.6}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-3 w-3">
      <path d="M2 4 6 8 10 4" />
    </svg>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div
        aria-hidden="true"
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-none border border-white/10 bg-white/5"
      >
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.2}
          className="h-10 w-10 text-white/20">
          <rect x="6" y="8" width="28" height="24" rx="1" />
          <path d="M6 14h28M14 8v6M26 8v6" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-[family-name:var(--font-barlow-condensed)] text-xl font-bold uppercase tracking-wide text-white/30">
        {filtered ? "No cards match your filters" : "Nothing here yet"}
      </p>
      <p className="mt-1 text-sm text-white/20 font-[family-name:var(--font-ibm-plex)]">
        {filtered ? "Try adjusting your filters or search." : "Check back soon."}
      </p>
    </div>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-24 text-center">
      <div
        aria-hidden="true"
        className="mb-6 flex h-20 w-20 items-center justify-center rounded-none border border-red-900/40 bg-red-950/20"
      >
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth={1.2}
          className="h-10 w-10 text-red-500/50">
          <circle cx="20" cy="20" r="14" />
          <path d="M20 13v9M20 27v1" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="font-[family-name:var(--font-barlow-condensed)] text-xl font-bold uppercase tracking-wide text-white/40">
        Something went wrong
      </p>
      <p className="mt-1 max-w-xs text-sm text-white/25 font-[family-name:var(--font-ibm-plex)]">
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="
            mt-6 rounded-none border border-orange-500/50 bg-transparent px-6 py-2
            font-[family-name:var(--font-barlow-condensed)]
            text-xs font-bold uppercase tracking-widest text-orange-400
            transition-all hover:bg-orange-500 hover:text-zinc-950
            focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400
          "
        >
          Try Again
        </button>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * HoloGrid — responsive card grid for HoloCards.
 *
 * Features:
 * - 3 layout presets: grid / dense / list
 * - Client-side rarity + variant filter chips
 * - Client-side sort (featured / rarity / A→Z / most liked)
 * - Tag search input
 * - Controlled or uncontrolled filter state
 * - Skeleton loading with configurable count
 * - Empty and error states
 * - Injects liked / bookmarked state from parent sets
 * - Full ARIA (role=region, live region for result count)
 */
export default function HoloGrid({
  cards = [],
  layout: layoutProp = "grid",
  skeletonCount = 10,
  showToolbar = true,
  filter: controlledFilter,
  onFilterChange,
  heading,
  subheading,
  onLike,
  onBookmark,
  likedSlugs,
  bookmarkedSlugs,
  loading = false,
  error,
  onRetry,
  className,
}: HoloGridProps) {
  const headingId = useId();

  // ── Layout (always local) ────────────────────────────────────────────────
  const [layout, setLayout] = useState<HoloGridLayout>(layoutProp);

  // ── Sort (local) ─────────────────────────────────────────────────────────
  const [sort, setSort] = useState<HoloGridSortKey>("default");

  // ── Filter (local or controlled) ─────────────────────────────────────────
  const [localFilter, setLocalFilter] = useState<HoloGridFilter>({});
  const filter = controlledFilter ?? localFilter;

  function updateFilter(patch: Partial<HoloGridFilter>) {
    const next = { ...filter, ...patch };
    if (onFilterChange) onFilterChange(next);
    else setLocalFilter(next);
  }

  function toggleRarity(r: HoloRarity) {
    const current = filter.rarity ?? [];
    const next = current.includes(r)
      ? current.filter((x) => x !== r)
      : [...current, r];
    updateFilter({ rarity: next.length ? next : undefined });
  }

  function toggleVariant(v: HoloCardVariant) {
    const current = filter.variant ?? [];
    const next = current.includes(v)
      ? current.filter((x) => x !== v)
      : [...current, v];
    updateFilter({ variant: next.length ? next : undefined });
  }

  function clearFilters() {
    updateFilter({ rarity: undefined, variant: undefined, tag: undefined });
  }

  // ── Derived card list ─────────────────────────────────────────────────────
  const visibleCards = useMemo(() => {
    const filtered = filterCards(cards, filter);
    return sortCards(filtered, sort);
  }, [cards, filter, sort]);

  const hasActiveFilter =
    (filter.rarity?.length ?? 0) > 0 ||
    (filter.variant?.length ?? 0) > 0 ||
    !!filter.tag;

  const gridClass = GRID_CLASSES[layout];

  return (
    <section
      aria-labelledby={heading ? headingId : undefined}
      aria-label={heading ? undefined : "Card grid"}
      className={cn("w-full", className)}
    >
      {/* ── Optional heading ── */}
      {(heading || subheading) && (
        <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          {heading && (
            <h2
              id={headingId}
              className="
                font-[family-name:var(--font-barlow-condensed)]
                text-3xl font-extrabold uppercase tracking-tight text-white
              "
            >
              {heading}
            </h2>
          )}
          {subheading && (
            <p className="text-sm text-white/35 font-[family-name:var(--font-ibm-plex)]">
              {subheading}
            </p>
          )}
        </div>
      )}

      {/* ── Toolbar ── */}
      {showToolbar && (
        <div
          className="mb-6 flex flex-col gap-3"
          role="group"
          aria-label="Card filters and sorting"
        >
          {/* Row 1: tag search + sort + layout toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tag search */}
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <svg
                viewBox="0 0 20 20"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30"
                aria-hidden="true"
              >
                <circle cx="8.5" cy="8.5" r="5.25" />
                <path d="M12.5 12.5 17 17" />
              </svg>
              <input
                type="search"
                placeholder="Search cards…"
                value={filter.tag ?? ""}
                onChange={(e) => updateFilter({ tag: e.target.value || undefined })}
                aria-label="Search cards by tag or title"
                className="
                  w-full rounded-none border border-white/12 bg-white/5 pl-9 pr-3 py-2
                  text-sm text-white placeholder:text-white/25
                  font-[family-name:var(--font-ibm-plex)]
                  focus:border-orange-500/50 focus:bg-white/8 focus:outline-none
                  transition-colors
                "
              />
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Sort dropdown */}
            <div className="relative">
              <label htmlFor="holo-sort" className="sr-only">Sort cards</label>
              <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30">
                <ChevronIcon />
              </div>
              <select
                id="holo-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as HoloGridSortKey)}
                className="
                  appearance-none rounded-none border border-white/12 bg-zinc-900/80 pl-3 pr-8 py-2
                  text-sm text-white/70 font-[family-name:var(--font-ibm-plex)]
                  focus:border-orange-500/50 focus:outline-none cursor-pointer
                  transition-colors hover:border-white/25
                "
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Layout toggle */}
            <div
              role="group"
              aria-label="Grid layout"
              className="flex rounded-none border border-white/12 overflow-hidden"
            >
              {LAYOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  aria-label={opt.label}
                  aria-pressed={layout === opt.value}
                  onClick={() => setLayout(opt.value)}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center transition-colors",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400",
                    layout === opt.value
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-transparent text-white/35 hover:text-white/70"
                  )}
                >
                  {opt.icon}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: rarity chips */}
          <div className="flex flex-wrap gap-1.5" aria-label="Filter by rarity">
            {RARITY_FILTER_OPTIONS.map((r) => {
              const active = filter.rarity?.includes(r.value);
              return (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleRarity(r.value)}
                  className={cn(
                    "rounded-none border px-3 py-1",
                    "font-[family-name:var(--font-barlow-condensed)]",
                    "text-[10px] font-bold uppercase tracking-[0.15em]",
                    "transition-all duration-150",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400",
                    active
                      ? "border-orange-500/60 bg-orange-500/15 text-orange-300"
                      : "border-white/10 bg-white/5 text-white/40 hover:border-white/25 hover:text-white/70"
                  )}
                >
                  {r.label}
                </button>
              );
            })}

            {/* Variant chips */}
            {VARIANT_FILTER_OPTIONS.map((v) => {
              const active = filter.variant?.includes(v.value);
              return (
                <button
                  key={v.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleVariant(v.value)}
                  className={cn(
                    "rounded-none border px-3 py-1",
                    "font-[family-name:var(--font-barlow-condensed)]",
                    "text-[10px] font-bold uppercase tracking-[0.15em]",
                    "transition-all duration-150",
                    "focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400",
                    active
                      ? "border-cyan-500/60 bg-cyan-500/15 text-cyan-300"
                      : "border-white/10 bg-white/5 text-white/40 hover:border-white/25 hover:text-white/70"
                  )}
                >
                  {v.label}
                </button>
              );
            })}

            {/* Clear */}
            {hasActiveFilter && (
              <button
                type="button"
                onClick={clearFilters}
                aria-label="Clear all filters"
                className="
                  rounded-none border border-rose-700/40 bg-rose-950/30 px-3 py-1
                  font-[family-name:var(--font-barlow-condensed)]
                  text-[10px] font-bold uppercase tracking-[0.15em] text-rose-400
                  transition-colors hover:border-rose-600/60 hover:bg-rose-950/50
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400
                "
              >
                Clear ×
              </button>
            )}
          </div>

          {/* Live result count */}
          {!loading && !error && (
            <p
              aria-live="polite"
              aria-atomic="true"
              className="text-[11px] text-white/25 font-[family-name:var(--font-ibm-plex)]"
            >
              {visibleCards.length === cards.length
                ? `${cards.length} card${cards.length !== 1 ? "s" : ""}`
                : `${visibleCards.length} of ${cards.length} cards`}
            </p>
          )}
        </div>
      )}

      {/* ── Grid ── */}
      <div className={gridClass}>
        {error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : loading ? (
          Array.from({ length: skeletonCount }).map((_, i) => (
            <HoloCardSkeleton
              key={i}
              rarity={RARITY_ORDER[i % RARITY_ORDER.length]}
              showRank={i < 3}
            />
          ))
        ) : visibleCards.length === 0 ? (
          <EmptyState filtered={hasActiveFilter} />
        ) : (
          visibleCards.map((card, i) => (
            <HoloCard
              key={card.slug}
              {...card}
              rank={card.rank}
              liked={likedSlugs ? likedSlugs.has(card.slug) : card.liked}
              bookmarked={bookmarkedSlugs ? bookmarkedSlugs.has(card.slug) : card.bookmarked}
              onLike={onLike ?? card.onLike}
              onBookmark={onBookmark ?? card.onBookmark}
              // Staggered reveal — first 12 cards only to keep it snappy
              className={cn(
                card.className,
                i < 12 && "animate-in fade-in slide-in-from-bottom-2",
                i < 12 && `[animation-delay:${Math.min(i * 40, 400)}ms]`,
                i < 12 && "animation-fill-mode:both"
              )}
            />
          ))
        )}
      </div>
    </section>
  );
}
