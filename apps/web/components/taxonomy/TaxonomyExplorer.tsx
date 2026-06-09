'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ContentCategory, Genre, TaxonomyTag } from '@/lib/taxonomy/types';
import { GenrePill } from './GenrePill';
import { TagCloud } from './TagCloud';

interface TaxonomyExplorerProps {
    initialType?: 'categories' | 'genres' | 'tags';
}

// ── Safe empty defaults so .map() never receives undefined ────────────────────
const EMPTY_CATEGORIES: ContentCategory[] = [];
const EMPTY_GENRES: Genre[]               = [];
const EMPTY_TAGS: TaxonomyTag[]           = [];

type ActiveType = 'categories' | 'genres' | 'tags';

const TYPES: { id: ActiveType; label: string; icon: string }[] = [
    { id: 'categories', label: 'Categories',    icon: '📁' },
    { id: 'genres',     label: 'Genres',        icon: '🎭' },
    { id: 'tags',       label: 'Trending Tags', icon: '🏷️' },
];

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

            // ── BUG 5 FIX: surface the server's error body in development ──
            //
            // ORIGINAL PROBLEM:
            //   When !response.ok the code threw `"API returned 500: Internal
            //   Server Error"` — the generic HTTP status text. The actual server
            //   error message inside the JSON body (`{ error: "..." }`) was
            //   discarded, making the root cause invisible in the browser console.
            //
            // FIX: attempt to parse the error body and include the server's
            //   message in the thrown Error so it appears in the console and
            //   (in dev) in the UI's error state, pointing straight at the
            //   real problem (e.g. "wrong env var", "Supabase auth failed").
            // ─────────────────────────────────────────────────────────────────
            if (!response.ok) {
                let serverMessage = response.statusText;
                try {
                    const errBody = await response.json() as { error?: string };
                    if (errBody?.error) serverMessage = errBody.error;
                } catch {
                    // body wasn't JSON — keep statusText
                }
                throw new Error(`API ${response.status}: ${serverMessage}`);
            }

            const json = await response.json();

            // ── Defensive: accept both { data: [] } and [] directly ────────
            const data: unknown = Array.isArray(json)
                ? json
                : Array.isArray(json?.data)
                    ? json.data
                    : [];

            // ── Type-safe assignment per active tab ────────────────────────
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

    useEffect(() => {
        fetchTaxonomy();
    }, [fetchTaxonomy]);

    // ── BUG 6 FIX: clear stale data when switching tabs ───────────────────────
    //
    // ORIGINAL PROBLEM:
    //   Switching from 'categories' → 'genres' left the previous categories
    //   array populated during the loading phase of the genres fetch. If the
    //   genres fetch failed, `isEmpty` evaluated to true for genres while
    //   `categories.length > 0` was still true, so both the empty-state banner
    //   AND the old categories grid rendered simultaneously.
    //
    // FIX: reset the stale tab's state the moment the user switches, so the
    //   loading skeleton is the only thing visible during the new fetch.
    // ─────────────────────────────────────────────────────────────────────────
    const handleTypeChange = useCallback((next: ActiveType) => {
        if (next === activeType) return;
        // Reset whichever tab we're leaving so stale data doesn't bleed through
        if (activeType === 'categories') setCategories(EMPTY_CATEGORIES);
        else if (activeType === 'genres') setGenres(EMPTY_GENRES);
        else                              setTags(EMPTY_TAGS);
        setActiveType(next);
    }, [activeType]);

    // ── Derived state ─────────────────────────────────────────────────────────
    const isEmpty =
        !loading &&
        !error &&
        ((activeType === 'categories' && categories.length === 0) ||
         (activeType === 'genres'     && genres.length     === 0) ||
         (activeType === 'tags'       && tags.length       === 0));

    return (
        <div className="bg-gray-900 rounded-xl">

            {/* ── Type selector ─────────────────────────────────────────── */}
            <div className="border-b border-gray-800 p-4">
                <div className="flex gap-2">
                    {TYPES.map(type => (
                        <button
                            key={type.id}
                            onClick={() => handleTypeChange(type.id)}
                            aria-pressed={activeType === type.id}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                activeType === type.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                            }`}
                        >
                            <span className="mr-2">{type.icon}</span>
                            {type.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Content ───────────────────────────────────────────────── */}
            <div className="p-6">

                {/* Loading skeleton */}
                {loading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                                <div className="h-12 w-12 bg-gray-700 rounded-full mx-auto mb-3" />
                                <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto" />
                            </div>
                        ))}
                    </div>
                )}

                {/* Error state */}
                {!loading && error && (
                    <div className="flex flex-col items-center gap-4 py-12 text-center">
                        <span className="text-4xl">⚠️</span>
                        <p className="text-gray-400 text-sm">{error}</p>
                        <button
                            onClick={fetchTaxonomy}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty state */}
                {isEmpty && (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                        <span className="text-4xl">🗂️</span>
                        <p className="text-gray-400 text-sm">No {activeType} found.</p>
                    </div>
                )}

                {/* Categories */}
                {!loading && !error && activeType === 'categories' && categories.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {categories.map(category => (
                            <Link
                                key={category.id}
                                href={`/category/${category.slug}`}
                                className="group block bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-all"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="text-3xl">{category.icon}</div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg group-hover:text-blue-400 transition">
                                            {category.name}
                                        </h3>
                                        {category.description && (
                                            <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                                {category.description}
                                            </p>
                                        )}
                                        {(category.subcategories?.length ?? 0) > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {category.subcategories!.slice(0, 3).map(sub => (
                                                    <span
                                                        key={sub.id}
                                                        className="text-xs px-2 py-1 bg-gray-700 rounded-full text-gray-300"
                                                    >
                                                        {sub.name}
                                                    </span>
                                                ))}
                                                {category.subcategories!.length > 3 && (
                                                    <span className="text-xs px-2 py-1 text-gray-400">
                                                        +{category.subcategories!.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Genres */}
                {!loading && !error && activeType === 'genres' && genres.length > 0 && (
                    <div>
                        <div className="flex flex-wrap gap-3 mb-8">
                            {genres.map(genre => (
                                <GenrePill key={genre.id} genre={genre} size="lg" />
                            ))}
                        </div>
                        {genres
                            .filter(genre => (genre.children?.length ?? 0) > 0)
                            .map(genre => (
                                <div key={genre.id} className="mb-6">
                                    <h3 className="text-sm font-semibold text-gray-400 mb-3">
                                        {genre.name} Sub-genres
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {genre.children!.map(child => (
                                            <GenrePill key={child.id} genre={child} size="sm" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                    </div>
                )}

                {/* Tags */}
                {!loading && !error && activeType === 'tags' && tags.length > 0 && (
                    <TagCloud tags={tags} minSize={12} maxSize={32} />
                )}
            </div>
        </div>
    );
}
