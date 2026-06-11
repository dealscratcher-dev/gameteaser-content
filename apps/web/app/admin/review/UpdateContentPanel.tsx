"use client";

import React, { useState, useTransition, useCallback } from "react";
import type { ContentItemRow } from "@/types";
import { updateContentDraft, approveContent } from "./actions";
import { useToast } from "@/components/ui/Toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type SectionRoute = "hero-banner" | "curated-drops" | "upcoming-drops" | "hologram-roster";

interface UpdateContentPanelProps {
  draft: ContentItemRow;
  onSaved?: (updated: ContentItemRow) => void;
  onPublished?: (id: string) => void;
  onCancel?: () => void;
}

interface EditState {
  title: string;
  summary: string;
  cover_url: string;
  release_date: string;
  platforms: string[];
  genres: string[];
  featured: boolean;
  section_route: SectionRoute;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_PLATFORMS = ["PC", "PlayStation", "Xbox", "Nintendo Switch", "iOS", "Android", "VR"];
const ALL_GENRES = ["Action", "RPG", "Strategy", "Sports", "Simulation", "Horror", "Adventure", "Puzzle", "Racing", "Fighting", "Shooter"];

const SECTIONS: {
  value: SectionRoute;
  label: string;
  description: string;
  color: string;
  activeClasses: string;
  glowClasses: string;
  headerColor: string;
  // Ideal canvas dimensions for fit visualisation
  idealW: number;
  idealH: number;
  aspectLabel: string;
  hasImage: boolean;
}[] = [
  {
    value: "hero-banner",
    label: "Hero Banner",
    description: "Full-width featured slot at the top",
    color: "amber",
    activeClasses: "border-amber-500/60 bg-amber-500/15 text-amber-200",
    glowClasses: "ring-2 ring-amber-500/40 border-amber-500/60",
    headerColor: "text-amber-400",
    idealW: 1280, idealH: 680, aspectLabel: "19:10", hasImage: true,
  },
  {
    value: "curated-drops",
    label: "Curated Drops",
    description: "Handpicked card grid section",
    color: "orange",
    activeClasses: "border-orange-500/60 bg-orange-500/15 text-orange-200",
    glowClasses: "ring-2 ring-orange-500/40 border-orange-500/60",
    headerColor: "text-orange-400",
    idealW: 80, idealH: 112, aspectLabel: "5:7", hasImage: true,
  },
  {
    value: "upcoming-drops",
    label: "Upcoming Timeline",
    description: "Sorted by release date",
    color: "sky",
    activeClasses: "border-sky-500/60 bg-sky-500/15 text-sky-200",
    glowClasses: "ring-2 ring-sky-500/40 border-sky-500/60",
    headerColor: "text-sky-400",
    idealW: 0, idealH: 0, aspectLabel: "No image", hasImage: false,
  },
  {
    value: "hologram-roster",
    label: "Hologram Roster",
    description: "Roster grid with portrait cards",
    color: "violet",
    activeClasses: "border-violet-500/60 bg-violet-500/15 text-violet-200",
    glowClasses: "ring-2 ring-violet-500/40 border-violet-500/60",
    headerColor: "text-violet-400",
    idealW: 400, idealH: 560, aspectLabel: "5:7", hasImage: true,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function daysUntil(dateStr: string): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ─── Tag Toggle ───────────────────────────────────────────────────────────────

function TagToggle({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (item: string) => {
    onChange(
      selected.includes(item)
        ? selected.filter((x) => x !== item)
        : [...selected, item]
    );
  };
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`text-[10px] font-bold uppercase tracking-[0.12em] px-2 py-1 rounded border transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-400 ${
                active
                  ? "border-orange-500/50 bg-orange-500/15 text-orange-200"
                  : "border-white/10 bg-white/5 text-white/45 hover:border-white/25 hover:text-white/70"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Preview Cards ────────────────────────────────────────────────────────────

function HeroBannerPreview({ state, active }: { state: EditState; active: boolean }) {
  return (
    <div className={`flex flex-col gap-0 border rounded-lg overflow-hidden bg-zinc-950 h-full transition-all duration-200 ${active ? "ring-2 ring-amber-500/40 border-amber-500/60" : "border-white/10 opacity-40"}`}>
      <div className={`px-3 py-2 border-b flex items-center justify-between ${active ? "border-amber-500/30 bg-amber-500/10" : "border-white/10 bg-zinc-900/60"}`}>
        <span className={`text-[9px] font-extrabold uppercase tracking-[0.2em] ${active ? "text-amber-400" : "text-white/30"}`}>
          Hero Banner
        </span>
        {active && <span className="text-[8px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">Selected ✓</span>}
      </div>
      {/* Wide banner layout */}
      <div className="relative w-full aspect-[21/9] bg-zinc-900 overflow-hidden">
        {state.cover_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.cover_url} alt={state.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-white/15 uppercase font-bold tracking-widest">No Image</div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
        <div className="absolute bottom-0 left-0 p-3 flex flex-col gap-1">
          {state.featured && (
            <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] bg-amber-500 text-zinc-950 px-1.5 py-0.5 rounded w-fit">
              Featured
            </span>
          )}
          <h4 className="font-[family-name:var(--font-barlow-condensed)] text-sm font-extrabold uppercase leading-none tracking-tight text-white line-clamp-1">
            {state.title || <span className="text-white/20">Title…</span>}
          </h4>
          <div className="flex gap-1">
            {state.platforms.slice(0, 3).map((p) => (
              <span key={p} className="text-[8px] bg-white/10 px-1.5 py-0.5 rounded text-white/70">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CuratedDropsPreview({ state, active }: { state: EditState; active: boolean }) {
  return (
    <div className={`flex flex-col gap-0 border rounded-lg overflow-hidden bg-zinc-950 h-full transition-all duration-200 ${active ? "ring-2 ring-orange-500/40 border-orange-500/60" : "border-white/10 opacity-40"}`}>
      <div className={`px-3 py-2 border-b flex items-center justify-between ${active ? "border-orange-500/30 bg-orange-500/10" : "border-white/10 bg-zinc-900/60"}`}>
        <span className={`text-[9px] font-extrabold uppercase tracking-[0.2em] ${active ? "text-orange-400" : "text-white/30"}`}>
          Curated Drops
        </span>
        {active && <span className="text-[8px] font-bold uppercase tracking-widest text-orange-400 bg-orange-500/20 px-1.5 py-0.5 rounded">Selected ✓</span>}
      </div>
      <div className="flex flex-col gap-0 flex-1">
        <div className="relative w-full aspect-[16/9] bg-zinc-900 overflow-hidden">
          {state.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.cover_url} alt={state.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[10px] text-white/20 uppercase font-bold tracking-widest">No Image</div>
          )}
          {state.featured && (
            <span className="absolute top-2 left-2 text-[8px] font-extrabold uppercase tracking-[0.15em] bg-orange-500 text-white px-1.5 py-0.5 rounded">
              Featured
            </span>
          )}
        </div>
        <div className="p-3 flex flex-col gap-2 flex-1">
          <h4 className="font-[family-name:var(--font-barlow-condensed)] text-sm font-extrabold uppercase leading-none tracking-tight text-white line-clamp-2">
            {state.title || <span className="text-white/20">Title…</span>}
          </h4>
          <div className="flex flex-wrap gap-1">
            {state.platforms.slice(0, 3).map((p) => (
              <span key={p} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/60">{p}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {state.genres.slice(0, 2).map((g) => (
              <span key={g} className="text-[9px] bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-white/40">{g}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UpcomingTimelinePreview({ state, active }: { state: EditState; active: boolean }) {
  const days = daysUntil(state.release_date);
  return (
    <div className={`flex flex-col gap-0 border rounded-lg overflow-hidden bg-zinc-950 h-full transition-all duration-200 ${active ? "ring-2 ring-sky-500/40 border-sky-500/60" : "border-white/10 opacity-40"}`}>
      <div className={`px-3 py-2 border-b flex items-center justify-between ${active ? "border-sky-500/30 bg-sky-500/10" : "border-white/10 bg-zinc-900/60"}`}>
        <span className={`text-[9px] font-extrabold uppercase tracking-[0.2em] ${active ? "text-sky-400" : "text-white/30"}`}>
          Upcoming Timeline
        </span>
        {active && <span className="text-[8px] font-bold uppercase tracking-widest text-sky-400 bg-sky-500/20 px-1.5 py-0.5 rounded">Selected ✓</span>}
      </div>
      <div className="flex gap-3 p-3 flex-1">
        <div className="shrink-0 w-14 h-20 rounded overflow-hidden bg-zinc-900 border border-white/5">
          {state.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.cover_url} alt={state.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[8px] text-white/15 uppercase">—</div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[8px] font-extrabold uppercase tracking-[0.15em] border border-sky-500/30 bg-sky-500/10 text-sky-300 px-1.5 py-0.5 rounded">Games</span>
            {state.release_date && (
              <span className="text-[9px] text-white/40">{formatDate(state.release_date)}</span>
            )}
          </div>
          <h4 className="font-[family-name:var(--font-barlow-condensed)] text-sm font-extrabold uppercase leading-none text-white line-clamp-2">
            {state.title || <span className="text-white/20">Title…</span>}
          </h4>
          <p className="text-[10px] text-white/50 line-clamp-2 leading-relaxed">
            {state.summary || <span className="text-white/20">Summary…</span>}
          </p>
          <div className="flex gap-1 flex-wrap mt-auto">
            {state.platforms.slice(0, 2).map((p) => (
              <span key={p} className="text-[8px] text-white/40">{p}</span>
            ))}
          </div>
          {days !== null && (
            <span className="text-[9px] font-extrabold uppercase tracking-widest text-sky-400">
              {days > 0 ? `${days} days left` : days === 0 ? "Today!" : "Released"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function HologramRosterPreview({ state, active }: { state: EditState; active: boolean }) {
  return (
    <div className={`flex flex-col gap-0 border rounded-lg overflow-hidden bg-zinc-950 h-full transition-all duration-200 ${active ? "ring-2 ring-violet-500/40 border-violet-500/60" : "border-white/10 opacity-40"}`}>
      <div className={`px-3 py-2 border-b flex items-center justify-between ${active ? "border-violet-500/30 bg-violet-500/10" : "border-white/10 bg-zinc-900/60"}`}>
        <span className={`text-[9px] font-extrabold uppercase tracking-[0.2em] ${active ? "text-violet-400" : "text-white/30"}`}>
          Hologram Roster
        </span>
        {active && <span className="text-[8px] font-bold uppercase tracking-widest text-violet-400 bg-violet-500/20 px-1.5 py-0.5 rounded">Selected ✓</span>}
      </div>
      <div className="flex gap-3 p-3 flex-1 items-start">
        <div className="shrink-0 w-10 h-16 rounded overflow-hidden bg-zinc-900 border border-white/5">
          {state.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.cover_url} alt={state.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[8px] text-white/15 uppercase">—</div>
          )}
        </div>
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <h4 className="font-[family-name:var(--font-barlow-condensed)] text-sm font-extrabold uppercase leading-none text-white line-clamp-2">
            {state.title || <span className="text-white/20">Title…</span>}
          </h4>
          <span className="text-[9px] text-white/40">
            {state.platforms.length > 0 ? state.platforms.join(" · ") : <span className="text-white/20">Platforms…</span>}
          </span>
          <div className="flex flex-wrap gap-1">
            {state.genres.slice(0, 3).map((g) => (
              <span key={g} className="text-[8px] bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded text-violet-300">{g}</span>
            ))}
          </div>
          <span className="text-[9px] text-white/25 mt-auto">❤ 420</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function UpdateContentPanel({
  draft,
  onSaved,
  onPublished,
  onCancel,
}: UpdateContentPanelProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [editState, setEditState] = useState<EditState>({
    title: draft.title ?? "",
    summary: draft.summary ?? "",
    cover_url: draft.cover_url ?? "",
    release_date: draft.release_date
      ? new Date(draft.release_date).toISOString().split("T")[0]
      : "",
    platforms: draft.platforms ?? [],
    genres: draft.genres ?? [],
    featured: draft.featured ?? false,
    section_route: ((draft.metadata as any)?.section_route as SectionRoute) ?? "curated-drops",
  });

  const [imageError, setImageError] = useState(false);
  const [naturalDims, setNaturalDims] = useState<{ w: number; h: number } | null>(null);

  const update = useCallback(<K extends keyof EditState>(key: K, value: EditState[K]) => {
    setEditState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const buildMetadata = () => ({
    ...(typeof draft.metadata === "object" && draft.metadata !== null ? draft.metadata : {}),
    edited_by_admin: true,
    section_route: editState.section_route,
    last_edited: new Date().toISOString(),
  });

  const handleSaveDraft = () => {
    startTransition(async () => {
      const result = await updateContentDraft(draft.id, {
        title: editState.title,
        summary: editState.summary,
        cover_url: editState.cover_url,
        release_date: editState.release_date || null,
        platforms: editState.platforms,
        genres: editState.genres,
        featured: editState.featured,
        metadata: buildMetadata(),
      });

      if (result.error) {
        toast.error(`Save failed: ${result.error}`);
      } else {
        toast.success("Draft updated — ready to publish.");
        onSaved?.({ ...draft, ...editState } as ContentItemRow);
      }
    });
  };

  const handlePublish = () => {
    startTransition(async () => {
      const saveResult = await updateContentDraft(draft.id, {
        title: editState.title,
        summary: editState.summary,
        cover_url: editState.cover_url,
        release_date: editState.release_date || null,
        platforms: editState.platforms,
        genres: editState.genres,
        featured: editState.featured,
        metadata: buildMetadata(),
      });

      if (saveResult.error) {
        toast.error(`Publish failed during save: ${saveResult.error}`);
        return;
      }

      const publishResult = await approveContent(draft.id, editState.section_route as any);

      if (publishResult.error) {
        toast.error(`Publish failed: ${publishResult.error}`);
      } else {
        const sectionLabel =
          SECTIONS.find((s) => s.value === editState.section_route)?.label ?? editState.section_route;
        toast.success(`Published to ${sectionLabel}!`);
        onPublished?.(draft.id);
      }
    });
  };

  const selectedSection = SECTIONS.find((s) => s.value === editState.section_route)!;

  return (
    <div className="flex flex-col gap-0 border border-white/10 bg-zinc-900/40 rounded-xl overflow-hidden backdrop-blur-md">

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-zinc-900/60">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] border border-orange-500/30 bg-orange-500/10 text-orange-300 px-2 py-0.5 rounded">
            Editing
          </span>
          <h2 className="font-[family-name:var(--font-barlow-condensed)] text-lg font-extrabold uppercase leading-none tracking-tight text-white truncate max-w-xs">
            {draft.title}
          </h2>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isPending}
            className="text-xs text-white/40 hover:text-white/80 uppercase tracking-widest font-bold transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 rounded px-2 py-1"
          >
            ✕ Cancel
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col xl:flex-row gap-0 divide-y xl:divide-y-0 xl:divide-x divide-white/8">

        {/* ── Left: Edit Form ── */}
        <div className="flex flex-col gap-6 p-5 xl:w-[420px] shrink-0">

          {/* Title */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Title</label>
            <textarea
              value={editState.title}
              onChange={(e) => update("title", e.target.value)}
              rows={2}
              placeholder="Game title…"
              className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-400/60 transition resize-none font-[family-name:var(--font-barlow-condensed)] text-base font-bold uppercase tracking-tight leading-tight"
            />
          </div>

          {/* Summary */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Summary</label>
            <textarea
              value={editState.summary}
              onChange={(e) => update("summary", e.target.value)}
              rows={3}
              placeholder="Short description shown in cards…"
              className="w-full bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-400/60 transition resize-none leading-relaxed"
            />
          </div>

          {/* Cover Image URL */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Cover Image URL</label>
            <div className="flex gap-2 items-start">
              <input
                type="url"
                value={editState.cover_url}
                onChange={(e) => { update("cover_url", e.target.value); setImageError(false); setNaturalDims(null); }}
                placeholder="https://…"
                className="flex-1 bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-orange-400/60 transition min-w-0"
              />
              <div className="shrink-0 w-12 h-16 rounded overflow-hidden bg-zinc-950 border border-white/10 flex items-center justify-center">
                {editState.cover_url && !imageError ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editState.cover_url}
                    alt="cover preview"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    onError={() => setImageError(true)}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      setNaturalDims({ w: img.naturalWidth, h: img.naturalHeight });
                    }}
                  />
                ) : (
                  <span className="text-[8px] text-white/15 uppercase font-bold text-center leading-tight px-1">
                    {imageError ? "Error" : "Preview"}
                  </span>
                )}
              </div>
            </div>
            {imageError && <p className="text-[10px] text-red-400">Image failed to load — check the URL.</p>}
          </div>

          {/* Release Date */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Release Date</label>
            <input
              type="date"
              value={editState.release_date}
              onChange={(e) => update("release_date", e.target.value)}
              className="bg-zinc-950 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-orange-400/60 transition w-full [color-scheme:dark]"
            />
          </div>

          {/* Platforms */}
          <TagToggle label="Platforms" options={ALL_PLATFORMS} selected={editState.platforms} onChange={(v) => update("platforms", v)} />

          {/* Genres */}
          <TagToggle label="Genres" options={ALL_GENRES} selected={editState.genres} onChange={(v) => update("genres", v)} />

          {/* ── Section Selector ── */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">
              Publish To Section
            </label>
            <p className="text-[10px] text-white/25 -mt-1">
              Click a section — the canvas shows how your image fits the ideal dimensions.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {SECTIONS.map((s) => {
                const isActive = editState.section_route === s.value;

                // Compute fit status for this section
                type FitStatus = "ideal" | "too-wide" | "too-tall" | "no-image" | "no-image-needed";
                let fitStatus: FitStatus = "no-image";
                if (!s.hasImage) {
                  fitStatus = "no-image-needed";
                } else if (naturalDims && !imageError) {
                  const imgRatio = naturalDims.w / naturalDims.h;
                  const idealRatio = s.idealW / s.idealH;
                  const diff = imgRatio - idealRatio;
                  fitStatus = Math.abs(diff) < 0.25 ? "ideal" : diff > 0 ? "too-wide" : "too-tall";
                }

                const fitMeta: Record<FitStatus, { label: string; color: string; bg: string }> = {
                  ideal:           { label: "✓ Perfect fit",   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30" },
                  "too-wide":      { label: "↔ Too wide",       color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30"   },
                  "too-tall":      { label: "↕ Too tall",       color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/30"   },
                  "no-image":      { label: "No image set",     color: "text-white/25",    bg: ""                                      },
                  "no-image-needed":{ label: "Image not used",  color: "text-white/25",    bg: ""                                      },
                };
                const fit = fitMeta[fitStatus];

                // Canvas: scale idealW/idealH to a fixed display width of 100% with max ~80px height
                const canvasDisplayW = 100; // % of button width
                const canvasDisplayH = s.hasImage ? Math.round((s.idealH / s.idealW) * 80) : 0;

                // Compute how the image would sit inside the canvas (object-cover simulation)
                let imgStyle: React.CSSProperties = {};
                if (naturalDims && s.hasImage && !imageError) {
                  const canvasAspect = s.idealW / s.idealH;
                  const imgAspect = naturalDims.w / naturalDims.h;
                  if (imgAspect > canvasAspect) {
                    // image wider than canvas → overflows left/right, centred
                    const scale = 1 / canvasAspect * imgAspect;
                    imgStyle = {
                      width: `${scale * 100}%`,
                      height: "100%",
                      left: "50%",
                      transform: "translateX(-50%)",
                      position: "absolute",
                      objectFit: "cover",
                    };
                  } else {
                    // image taller than canvas → overflows top/bottom
                    const scale = canvasAspect / imgAspect;
                    imgStyle = {
                      width: "100%",
                      height: `${scale * 100}%`,
                      top: "50%",
                      transform: "translateY(-50%)",
                      position: "absolute",
                      objectFit: "cover",
                    };
                  }
                }

                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => update("section_route", s.value)}
                    className={`flex flex-col gap-0 text-left rounded-lg border transition focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-orange-400 overflow-hidden ${
                      isActive ? s.activeClasses : "border-white/10 bg-white/5 text-white/45 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {/* ── Dimension canvas ── */}
                    {s.hasImage ? (
                      <div
                        className="relative w-full overflow-hidden bg-zinc-800/80"
                        style={{ paddingBottom: `${(s.idealH / s.idealW) * 100}%` }}
                      >
                        {/* Grid pattern as "empty canvas" */}
                        <div
                          className="absolute inset-0"
                          style={{
                            backgroundImage: `
                              linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)
                            `,
                            backgroundSize: "10px 10px",
                          }}
                        />
                        {/* Dimension label watermark */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <span className="text-[8px] font-bold uppercase tracking-widest text-white/20 select-none">
                            {s.idealW}×{s.idealH}
                          </span>
                        </div>
                        {/* Actual image overlay */}
                        {editState.cover_url && !imageError && naturalDims && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={editState.cover_url}
                            alt=""
                            referrerPolicy="no-referrer"
                            style={imgStyle}
                            className="opacity-70"
                          />
                        )}
                        {/* Overflow hatch marks — show cropped zones */}
                        {fitStatus === "too-wide" && (
                          <>
                            <div className="absolute inset-y-0 left-0 w-3 bg-amber-500/20 border-r border-dashed border-amber-500/50" />
                            <div className="absolute inset-y-0 right-0 w-3 bg-amber-500/20 border-l border-dashed border-amber-500/50" />
                          </>
                        )}
                        {fitStatus === "too-tall" && (
                          <>
                            <div className="absolute inset-x-0 top-0 h-3 bg-amber-500/20 border-b border-dashed border-amber-500/50" />
                            <div className="absolute inset-x-0 bottom-0 h-3 bg-amber-500/20 border-t border-dashed border-amber-500/50" />
                          </>
                        )}
                        {fitStatus === "ideal" && (
                          <div className="absolute inset-0 ring-1 ring-inset ring-emerald-500/40 pointer-events-none rounded-[1px]" />
                        )}
                        {/* Aspect ratio corner badge */}
                        <span className="absolute top-1 right-1 text-[7px] font-bold uppercase tracking-widest bg-black/50 text-white/40 px-1 py-0.5 rounded">
                          {s.aspectLabel}
                        </span>
                      </div>
                    ) : (
                      /* No-image placeholder */
                      <div className="w-full h-8 bg-zinc-800/60 flex items-center justify-center border-b border-white/5">
                        <span className="text-[7px] font-bold uppercase tracking-widest text-white/20">No image used</span>
                      </div>
                    )}

                    {/* ── Label row ── */}
                    <div className="flex flex-col gap-0.5 px-2.5 py-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-[0.14em]">{s.label}</span>
                      {/* Fit status */}
                      {(naturalDims && !imageError) || fitStatus === "no-image" || fitStatus === "no-image-needed" ? (
                        <span className={`text-[8px] font-bold uppercase tracking-widest ${fit.color}`}>
                          {fit.label}
                        </span>
                      ) : (
                        <span className="text-[9px] text-white/25 font-normal normal-case tracking-normal">
                          {s.description}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Featured toggle */}
          <div className="flex items-center justify-between border border-white/8 bg-zinc-950/50 rounded-lg px-3 py-2.5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/70">Featured</p>
              <p className="text-[10px] text-white/30 mt-0.5">Pin to top of selected section</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={editState.featured}
              onClick={() => update("featured", !editState.featured)}
              className={`relative w-10 h-5 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                editState.featured ? "bg-orange-500 border-orange-500" : "bg-zinc-800 border-white/10"
              }`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all duration-200 ${editState.featured ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          {/* Source read-only */}
          <div className="text-[10px] text-white/25 border-t border-white/5 pt-4 flex flex-col gap-1">
            <span>Source: <span className="text-white/50 uppercase">{draft.source}</span> · ID: <span className="text-white/50">{draft.source_id}</span></span>
            {draft.external_url && (
              <a href={draft.external_url} target="_blank" rel="noreferrer noopener" className="text-orange-400/70 hover:text-orange-300 underline w-fit">
                View source ↗
              </a>
            )}
          </div>
        </div>

        {/* ── Right: Live Preview Panel ── */}
        <div className="flex flex-col gap-4 p-5 flex-1 bg-zinc-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/30">Live Preview</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            {/* Active section pill */}
            <span className={`text-[9px] font-extrabold uppercase tracking-[0.15em] px-2 py-1 rounded border ${selectedSection.activeClasses}`}>
              → {selectedSection.label}
            </span>
          </div>

          {/* 4-up preview grid — 2x2 on smaller, 2x2 always */}
          <div className="grid grid-cols-2 gap-4 flex-1 items-start">
            <HeroBannerPreview     state={editState} active={editState.section_route === "hero-banner"} />
            <CuratedDropsPreview   state={editState} active={editState.section_route === "curated-drops"} />
            <UpcomingTimelinePreview state={editState} active={editState.section_route === "upcoming-drops"} />
            <HologramRosterPreview state={editState} active={editState.section_route === "hologram-roster"} />
          </div>

          {/* Prior review notes */}
          {draft.review_notes && (
            <div className="border border-amber-500/25 bg-amber-500/5 p-3 rounded-lg text-xs text-amber-200">
              <span className="font-bold uppercase tracking-wider text-[10px]">Prior Feedback: </span>
              {draft.review_notes}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-white/10 bg-zinc-900/60">
        <p className="text-[10px] text-white/25 hidden sm:block">
          Publishing to: <span className={`font-bold ${selectedSection.headerColor}`}>{selectedSection.label}</span> · Original IGDB data preserved in metadata.
        </p>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {onCancel && (
            <button
              onClick={onCancel}
              disabled={isPending}
              className="flex-1 sm:flex-none min-h-9 border border-white/15 text-white/50 hover:bg-white/5 hover:text-white/80 px-4 py-1 text-xs font-bold uppercase tracking-[0.12em] transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSaveDraft}
            disabled={isPending}
            className="flex-1 sm:flex-none min-h-9 border border-sky-500/30 bg-sky-950/20 text-sky-200 hover:bg-sky-500/20 hover:border-sky-400/50 px-4 py-1 text-xs font-bold uppercase tracking-[0.12em] transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save Draft"}
          </button>
          <button
            onClick={handlePublish}
            disabled={isPending}
            className="flex-1 sm:flex-none min-h-9 border border-emerald-500/30 bg-emerald-950/20 text-emerald-200 hover:bg-emerald-500 hover:text-white px-5 py-1 text-xs font-bold uppercase tracking-[0.12em] transition rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/60 disabled:opacity-50"
          >
            {isPending ? "Publishing…" : `Publish to ${selectedSection.label}`}
          </button>
        </div>
      </div>
    </div>
  );
}
