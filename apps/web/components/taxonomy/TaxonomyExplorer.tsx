'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ContentCategory, Genre, TaxonomyTag } from '@/lib/taxonomy/types';

// ─────────────────────────────────────────────────────────────────────────────
// Requires in globals.css:
//   @import url('https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=IBM+Plex+Mono:wght@400;600&display=swap');
// ─────────────────────────────────────────────────────────────────────────────

interface TaxonomyExplorerProps {
    initialType?: 'categories' | 'genres' | 'tags';
}

const EMPTY_CATEGORIES: ContentCategory[] = [];
const EMPTY_GENRES: Genre[]               = [];
const EMPTY_TAGS: TaxonomyTag[]           = [];

type ActiveType = 'categories' | 'genres' | 'tags';

const TYPES: { id: ActiveType; label: string }[] = [
    { id: 'categories', label: 'Categories' },
    { id: 'genres',     label: 'Genres'     },
    { id: 'tags',       label: 'Trending'   },
];

// ── Per-category VHS brand metadata ──────────────────────────────────────────
const CATEGORY_BRANDS: Record<string, { brand: string; accent?: string; sub?: string }> = {
    games:       { brand: 'PlayStation',       accent: undefined             },
    anime:       { brand: 'Bandai Visual',     accent: undefined             },
    manga:       { brand: 'Shonen Jump',       accent: undefined             },
    comics:      { brand: 'Marvel Archive',    accent: '#e32636', sub: 'VOL. 1' },
    'movies-tv': { brand: 'VHS Collection',   accent: undefined             },
};

// ── Collector count labels — objects, not windows ────────────────────────────
// Derive from category.count if your API provides it; otherwise subcategories.length
function collectorLabel(count: number, slug: string): string {
    if (count === 0) return 'no entries yet';
    if (slug === 'games')    return `${count} releases`;
    if (slug === 'anime')    return `${count} titles`;
    if (slug === 'manga')    return `${count} volumes`;
    if (slug === 'comics')   return `${count} issues`;
    return `${count} entries`;
}

// ── Fake barcodes — deterministic per index ───────────────────────────────────
const BARCODES = [
    [2,1,3,1,2,1,2],
    [1,3,1,2,1,3,1],
    [2,1,1,3,2,1,2],
    [1,2,3,1,1,2,1],
    [3,1,2,1,1,3,1],
];

// ── Per-tape physical variation — deterministic, not random ──────────────────
// [rotation, widthPct, labelWidthPct, heightPx, vertOffsetPx]
const TAPE_VARIANTS: [string, string, string, number, number][] = [
    ['-1.5deg', '100%', '55%', 80,  0],
    [' 0.8deg',  '96%', '58%', 78,  1],
    ['-0.7deg',  '98%', '52%', 82, -1],
    [' 1.2deg',  '94%', '60%', 79,  0],
    ['-0.5deg',  '99%', '54%', 81,  1],
];

// ── SVG scratch overlay — pure CSS, no external PNG needed ───────────────────
// Rendered as a data URI background on each tape via ::after
// opacity .07 + overlay blending — subconscious wear, not a theme
const SCRATCH_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80'%3E%3Cline x1='12' y1='0' x2='8' y2='80' stroke='white' stroke-width='0.4' opacity='0.6'/%3E%3Cline x1='45' y1='0' x2='48' y2='80' stroke='white' stroke-width='0.3' opacity='0.4'/%3E%3Cline x1='78' y1='20' x2='76' y2='80' stroke='white' stroke-width='0.5' opacity='0.5'/%3E%3Cline x1='130' y1='0' x2='134' y2='60' stroke='white' stroke-width='0.3' opacity='0.3'/%3E%3Cline x1='160' y1='10' x2='158' y2='80' stroke='white' stroke-width='0.4' opacity='0.4'/%3E%3Cline x1='188' y1='0' x2='185' y2='45' stroke='white' stroke-width='0.6' opacity='0.5'/%3E%3C/svg%3E")`;

export function TaxonomyExplorer({ initialType = 'categories' }: TaxonomyExplorerProps) {
    const [activeType, setActiveType] = useState<ActiveType>(initialType);
    const [categories, setCategories] = useState<ContentCategory[]>(EMPTY_CATEGORIES);
    const [genres,     setGenres]     = useState<Genre[]>(EMPTY_GENRES);
    const [tags,       setTags]       = useState<TaxonomyTag[]>(EMPTY_TAGS);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState<string | null>(null);

    const fetchTaxonomy = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/taxonomy?type=${activeType}`);
            if (!response.ok) {
                let serverMessage = response.statusText;
                try {
                    const errBody = await response.json() as { error?: string };
                    if (errBody?.error) serverMessage = errBody.error;
                } catch { /* keep statusText */ }
                throw new Error(`API ${response.status}: ${serverMessage}`);
            }
            const json = await response.json();
            const data: unknown = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];
            if (activeType === 'categories') {
                setCategories(Array.isArray(data) ? (data as ContentCategory[]) : EMPTY_CATEGORIES);
            } else if (activeType === 'genres') {
                setGenres(Array.isArray(data) ? (data as Genre[]) : EMPTY_GENRES);
            } else {
                setTags(Array.isArray(data) ? (data as TaxonomyTag[]) : EMPTY_TAGS);
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load taxonomy';
            setError(message);
            console.error('[TaxonomyExplorer] fetch error:', message);
        } finally {
            setLoading(false);
        }
    }, [activeType]);

    useEffect(() => { fetchTaxonomy(); }, [fetchTaxonomy]);

    const handleTypeChange = useCallback((next: ActiveType) => {
        if (next === activeType) return;
        if (activeType === 'categories') setCategories(EMPTY_CATEGORIES);
        else if (activeType === 'genres') setGenres(EMPTY_GENRES);
        else                              setTags(EMPTY_TAGS);
        setActiveType(next);
    }, [activeType]);

    const isEmpty =
        !loading && !error &&
        ((activeType === 'categories' && categories.length === 0) ||
         (activeType === 'genres'     && genres.length     === 0) ||
         (activeType === 'tags'       && tags.length       === 0));

    return (
        <>
            <style>{`
                /* ── Outer wrap — warm bedroom lamp glow ────────────────────── */
                .vhs-shelf-wrap {
                    background:
                        radial-gradient(circle at top, rgba(255,180,80,.08), transparent 40%),
                        #0e0b08;
                    border-radius: 12px;
                    padding: 0;
                    position: relative;
                    overflow: hidden;
                }

                /* ── Index-card tabs ────────────────────────────────────────── */
                .vhs-tabs {
                    display: flex;
                    gap: 0;
                    padding: 20px 24px 0;
                    position: relative;
                    z-index: 2;
                    align-items: flex-end;
                }
                .vhs-tab {
                    font-family: 'Kalam', cursive;
                    font-size: 13px;
                    font-weight: 700;
                    letter-spacing: 0.03em;
                    cursor: pointer;
                    border: none;
                    background: none;
                    outline: none;
                    position: relative;
                    padding: 0;
                    margin-right: 2px;
                }
                .vhs-tab-inner {
                    display: block;
                    padding: 8px 18px 12px;
                    background: #1e1810;
                    color: #5a4a35;
                    border: 1px solid #2e2415;
                    border-bottom: none;
                    border-radius: 5px 5px 0 0;
                    position: relative;
                    top: 3px;
                    transition: background 0.15s, color 0.15s, top 0.15s;
                }
                .vhs-tab:nth-child(2) .vhs-tab-inner { padding-top: 10px; }
                .vhs-tab:nth-child(3) .vhs-tab-inner { padding-top:  7px; }
                .vhs-tab[aria-pressed="true"] .vhs-tab-inner {
                    background: #f5ecd4;
                    color: #1e0f04;
                    top: 0;
                    border-color: #c4a96e;
                    border-bottom: 1px solid #f5ecd4;
                    box-shadow: 0 -4px 12px rgba(0,0,0,.5), inset 0 1px rgba(255,255,255,.6);
                }
                .vhs-tab:not([aria-pressed="true"]):hover .vhs-tab-inner {
                    background: #2a2015;
                    color: #8a7a60;
                }
                .vhs-tab[aria-pressed="true"] .vhs-tab-inner::after {
                    content: '';
                    position: absolute;
                    top: 0; right: 0;
                    width: 10px; height: 10px;
                    background: linear-gradient(135deg, transparent 50%, #d4c49a 50%);
                }

                /* ── Shelf body — warm wood gradient, not flat black ─────────── */
                .vhs-body {
                    background: linear-gradient(180deg, #1a140d 0%, #120d08 100%);
                    border: 1px solid #2e2415;
                    border-radius: 0 6px 6px 6px;
                    margin: 0 20px 20px;
                    padding: 28px 24px 52px;
                    position: relative;
                    /* subtle wood grain via repeating diagonal lines */
                    background-image:
                        linear-gradient(180deg, #1a140d 0%, #120d08 100%),
                        repeating-linear-gradient(
                            92deg,
                            transparent,
                            transparent 18px,
                            rgba(255,200,100,.012) 18px,
                            rgba(255,200,100,.012) 19px
                        );
                    background-blend-mode: normal, overlay;
                }
                /* cabinet depth */
                .vhs-body::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background:
                        linear-gradient(
                            90deg,
                            rgba(255,255,255,.025),
                            transparent 18%,
                            transparent 82%,
                            rgba(0,0,0,.22)
                        );
                    pointer-events: none;
                    border-radius: 0 6px 6px 6px;
                }

                /* ── Shelf planks ── */
                .vhs-shelf-planks {
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                }
                .vhs-shelf-plank { height: 5px; background: #3a2818; margin-bottom: 2px; }
                .vhs-shelf-plank:last-child { margin-bottom: 0; }

                /* ── Tape stack — tight overlap like a real shelf ─────────────── */
                .vhs-tape-stack {
                    display: flex;
                    flex-direction: column;
                    gap: 0;          /* no gap — tapes touch */
                }

                .vhs-tape {
                    position: relative;
                    display: flex;
                    align-items: center;
                    background: #0d0a06;
                    border: 1.5px solid #4a3820;
                    padding: 0 20px;
                    cursor: pointer;
                    border-radius: 2px;
                    text-decoration: none;
                    margin-top: -2px; /* slight overlap — stacked, not floating */
                    transition:
                        transform 0.28s cubic-bezier(.15,.85,.35,1),
                        box-shadow 0.28s ease;
                    outline: none;
                }
                /* scratch wear overlay — pure SVG, no external file */
                .vhs-tape::after {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background-image: ${SCRATCH_SVG};
                    background-repeat: repeat-x;
                    background-size: 200px 100%;
                    opacity: .07;
                    mix-blend-mode: overlay;
                    pointer-events: none;
                    border-radius: 2px;
                }
                .vhs-tape:first-child { margin-top: 0; }
                .vhs-tape:hover,
                .vhs-tape:focus-visible {
                    transform: translateX(24px) scale(1.02) rotate(0deg) !important;
                    box-shadow: -12px 6px 32px rgba(0,0,0,.95);
                    z-index: 10;
                    border-color: #7a6040;
                    /* darken the implied depth behind it */
                    background: #100c08;
                }

                /* ── Cream label — stamped feel, not centered UI ─────────────── */
                .vhs-tape-label {
                    position: absolute;
                    left: 12px; top: 50%;
                    transform: translateY(-50%);
                    height: 58px;
                    border-radius: 1px;
                    display: flex;
                    align-items: center;
                    /* stamp layout: icon pushed far left, name breathes right */
                    padding: 0 16px 0 12px;
                    gap: 18px;
                    overflow: hidden;
                    background:
                        linear-gradient(rgba(255,255,255,.08), rgba(0,0,0,.04)),
                        #ede3c5;
                    box-shadow:
                        inset 0 1px rgba(255,255,255,.4),
                        inset 0 -2px rgba(0,0,0,.08);
                }
                /* torn right edge */
                .vhs-tape-label::after {
                    content: '';
                    position: absolute;
                    right: -3px; top: 0; bottom: 0;
                    width: 6px;
                    background: linear-gradient(to right, #d4c9a0, #b8a87a, transparent);
                    clip-path: polygon(0 0, 60% 8%, 100% 3%, 80% 22%, 100% 40%, 70% 55%, 100% 70%, 80% 88%, 100% 100%, 0 100%);
                }

                /* icon — stamped, slightly oversized relative to text */
                .vhs-tape-icon {
                    font-size: 28px;
                    flex-shrink: 0;
                    /* pushed to the far-left edge of the label, like a rubber stamp */
                    margin-left: -2px;
                    opacity: .9;
                }

                /* fat Sharpie */
                .vhs-tape-name {
                    font-family: 'Kalam', cursive;
                    font-weight: 700;
                    font-size: 26px;
                    color: #150900;
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    line-height: 1;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .vhs-tape-count {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 10px;
                    color: #6b5a3a;
                    margin-top: 4px;
                    letter-spacing: 0.05em;
                }

                /* ── Brand spine ── */
                .vhs-tape-brand {
                    position: absolute;
                    right: 16px; top: 50%;
                    transform: translateY(-50%);
                    text-align: right;
                }
                .vhs-tape-brand-name {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 10px;
                    color: #b7a68f;
                    letter-spacing: 0.14em;
                    text-transform: uppercase;
                    display: block;
                }
                .vhs-tape-brand-sub {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 9px;
                    letter-spacing: 0.1em;
                    color: #8a7a65;
                    margin-top: 2px;
                    display: block;
                }
                .vhs-tape-barcode { display: flex; gap: 1px; margin-top: 7px; justify-content: flex-end; }
                .vhs-tape-barcode span { background: #5a4a35; display: block; height: 14px; }

                /* ── Genre pills ── */
                .vhs-genre-section { padding: 4px 0; }
                .vhs-genre-cloud { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 28px; }
                .vhs-genre-pill {
                    font-family: 'Kalam', cursive;
                    font-weight: 700; font-size: 16px;
                    padding: 7px 18px; border-radius: 20px;
                    border: 1.5px solid #4a3820;
                    background: #1a1208; color: #d4c49a;
                    cursor: pointer; transition: background 0.15s, color 0.15s, border-color 0.15s;
                    text-decoration: none; display: inline-block; outline: none;
                }
                .vhs-genre-pill:hover, .vhs-genre-pill:focus-visible {
                    background: #2a1e0c; color: #f1e2bc; border-color: #7a6040;
                }
                .vhs-genre-subgroup { margin-bottom: 20px; }
                .vhs-genre-subgroup-label {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
                    color: #5a4a35; margin-bottom: 10px;
                }
                .vhs-genre-sub-pills { display: flex; flex-wrap: wrap; gap: 8px; }
                .vhs-genre-pill-sm {
                    font-family: 'Kalam', cursive;
                    font-weight: 400; font-size: 14px;
                    padding: 4px 14px; border-radius: 16px;
                    border: 1px solid #3a2d1e; background: #131008; color: #9d8c6e;
                    cursor: pointer; transition: background 0.15s, color 0.15s;
                    text-decoration: none; display: inline-block; outline: none;
                }
                .vhs-genre-pill-sm:hover, .vhs-genre-pill-sm:focus-visible {
                    background: #2a1e0c; color: #d4c49a;
                }

                /* ── Tag cloud ── */
                .vhs-tag-cloud { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding: 4px 0; }
                .vhs-tag {
                    font-family: 'IBM Plex Mono', monospace;
                    background: #1a1208; border: 1px solid #3a2d1e; color: #9d8c6e;
                    padding: 4px 10px; border-radius: 3px;
                    cursor: pointer; transition: background 0.15s, color 0.15s;
                    text-decoration: none; display: inline-block; outline: none;
                }
                .vhs-tag:hover, .vhs-tag:focus-visible {
                    background: #2a1e0c; color: #d4c49a; border-color: #5a4a35;
                }

                /* ── Loading skeleton ── */
                .vhs-skeleton-stack { display: flex; flex-direction: column; gap: 0; }
                .vhs-skeleton-tape {
                    border-radius: 2px; background: #1d1610;
                    margin-top: -2px;
                    animation: vhs-pulse 1.4s ease-in-out infinite;
                }
                .vhs-skeleton-tape:first-child { margin-top: 0; }
                @keyframes vhs-pulse { 0%,100% { opacity:1; } 50% { opacity:.4; } }

                /* ── Error / empty ── */
                .vhs-state-center {
                    display: flex; flex-direction: column; align-items: center;
                    gap: 14px; padding: 56px 0; text-align: center;
                }
                .vhs-state-icon { font-size: 40px; }
                .vhs-state-msg {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 12px; color: #5a4a35; letter-spacing: 0.06em;
                }
                .vhs-retry-btn {
                    font-family: 'Kalam', cursive; font-weight: 700; font-size: 14px;
                    padding: 8px 22px; background: #2a1e0c;
                    border: 1.5px solid #7a6040; border-radius: 4px; color: #d4c49a;
                    cursor: pointer; transition: background 0.15s, color 0.15s; outline: none;
                }
                .vhs-retry-btn:hover, .vhs-retry-btn:focus-visible {
                    background: #3a2d18; color: #f1e2bc;
                }

                /* ── Section label ── */
                .vhs-section-label {
                    font-family: 'IBM Plex Mono', monospace;
                    font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase;
                    color: #5a4a35; margin-bottom: 18px;
                }
            `}</style>

            <div className="vhs-shelf-wrap">

                {/* ── Index-card tabs ────────────────────────────────────────── */}
                <div className="vhs-tabs">
                    {TYPES.map(type => (
                        <button
                            key={type.id}
                            className="vhs-tab"
                            aria-pressed={activeType === type.id}
                            onClick={() => handleTypeChange(type.id)}
                        >
                            <span className="vhs-tab-inner">{type.label}</span>
                        </button>
                    ))}
                </div>

                {/* ── Shelf body ──────────────────────────────────────────────── */}
                <div className="vhs-body">

                    {/* Loading skeleton */}
                    {loading && (
                        <div className="vhs-skeleton-stack">
                            {TAPE_VARIANTS.map(([rot, w, , h, vy], i) => (
                                <div
                                    key={i}
                                    className="vhs-skeleton-tape"
                                    style={{
                                        width: w,
                                        height: `${h}px`,
                                        transform: `rotate(${rot}) translateY(${vy}px)`,
                                        animationDelay: `${i * 0.12}s`,
                                    }}
                                />
                            ))}
                        </div>
                    )}

                    {/* Error state */}
                    {!loading && error && (
                        <div className="vhs-state-center">
                            <span className="vhs-state-icon">📼</span>
                            <p className="vhs-state-msg">{error}</p>
                            <button className="vhs-retry-btn" onClick={fetchTaxonomy}>
                                Rewind &amp; retry
                            </button>
                        </div>
                    )}

                    {/* Empty state */}
                    {isEmpty && (
                        <div className="vhs-state-center">
                            <span className="vhs-state-icon">🗂️</span>
                            <p className="vhs-state-msg">shelf is empty — no {activeType} found</p>
                        </div>
                    )}

                    {/* ── Categories ──────────────────────────────────────────── */}
                    {!loading && !error && activeType === 'categories' && categories.length > 0 && (
                        <>
                            <p className="vhs-section-label">— your collection —</p>
                            <div className="vhs-tape-stack">
                                {categories.map((category, i) => {
                                    const [rot, tapeW, labelW, h, vy] = TAPE_VARIANTS[i % TAPE_VARIANTS.length];
                                    const brandKey = category.slug ?? category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                                    const brand    = CATEGORY_BRANDS[brandKey];
                                    const barcode  = BARCODES[i % BARCODES.length];
                                    // collector count: prefer category.count, fall back to subcategories.length
                                    const count    = (category as any).count ?? category.subcategories?.length ?? 0;
                                    const slug     = category.slug ?? brandKey;

                                    return (
                                        <Link
                                            key={category.id}
                                            href={`/category/${category.slug}`}
                                            className="vhs-tape"
                                            aria-label={`${category.name} — ${count} entries`}
                                            style={{
                                                width: tapeW,
                                                height: `${h}px`,
                                                transform: `rotate(${rot}) translateY(${vy}px)`,
                                            }}
                                        >
                                            {/* cream label */}
                                            <div className="vhs-tape-label" style={{ width: labelW }}>
                                                {category.icon && (
                                                    <span className="vhs-tape-icon">{category.icon}</span>
                                                )}
                                                <div>
                                                    <div className="vhs-tape-name">{category.name}</div>
                                                    <div className="vhs-tape-count">
                                                        {collectorLabel(count, slug)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* brand spine */}
                                            <div className="vhs-tape-brand">
                                                {brand ? (
                                                    <>
                                                        <span
                                                            className="vhs-tape-brand-name"
                                                            style={brand.accent ? { color: brand.accent } : undefined}
                                                        >
                                                            {brand.brand}
                                                        </span>
                                                        {brand.sub && (
                                                            <span className="vhs-tape-brand-sub">{brand.sub}</span>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="vhs-tape-brand-name">
                                                        {category.name.slice(0, 10).toUpperCase()}
                                                    </span>
                                                )}
                                                <div className="vhs-tape-barcode">
                                                    {barcode.map((w, bi) => (
                                                        <span key={bi} style={{ width: `${w}px` }} />
                                                    ))}
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* ── Genres ──────────────────────────────────────────────── */}
                    {!loading && !error && activeType === 'genres' && genres.length > 0 && (
                        <div className="vhs-genre-section">
                            <p className="vhs-section-label">— by genre —</p>
                            <div className="vhs-genre-cloud">
                                {genres.map(genre => (
                                    <Link key={genre.id} href={`/genre/${genre.slug}`} className="vhs-genre-pill">
                                        {genre.name}
                                    </Link>
                                ))}
                            </div>
                            {genres
                                .filter(genre => (genre.children?.length ?? 0) > 0)
                                .map(genre => (
                                    <div key={genre.id} className="vhs-genre-subgroup">
                                        <p className="vhs-genre-subgroup-label">{genre.name} sub-genres</p>
                                        <div className="vhs-genre-sub-pills">
                                            {genre.children!.map(child => (
                                                <Link key={child.id} href={`/genre/${child.slug}`} className="vhs-genre-pill-sm">
                                                    {child.name}
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    )}

                    {/* ── Tags ────────────────────────────────────────────────── */}
                    {!loading && !error && activeType === 'tags' && tags.length > 0 && (
                        <>
                            <p className="vhs-section-label">— trending now —</p>
                            <div className="vhs-tag-cloud">
                                {tags.map(tag => {
                                    // TypeScript fix: cast to any because TaxonomyTag may not have 'count'
                                    const tagAny = tag as any;
                                    const counts = tags.map(t => (t as any).count ?? 1);
                                    const min   = Math.min(...counts);
                                    const max   = Math.max(...counts);
                                    const range = max - min || 1;
                                    const size  = 11 + Math.round((((tagAny.count ?? min) - min) / range) * 11);
                                    return (
                                        <Link key={tag.id} href={`/tag/${tag.slug}`} className="vhs-tag" style={{ fontSize: `${size}px` }}>
                                            {tag.name}
                                        </Link>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    <div className="vhs-shelf-planks">
                        <div className="vhs-shelf-plank" />
                        <div className="vhs-shelf-plank" />
                    </div>
                </div>
            </div>
        </>
    );
}