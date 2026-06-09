// apps/web/types/index.ts
// ─────────────────────────────────────────────────────────────────────────────
// Re-exports all DB types + adds app-level types for API responses and UI state.
// Import everything from here, not from @db/database.types directly.
// ─────────────────────────────────────────────────────────────────────────────

import type { EntityType as DbEntityType } from "@db/database.types";

// ── Re-export all DB types ────────────────────────────────────────────────────
export type {
  Database,
  Json,
  Tables,
  Inserts,
  Updates,
  Views,
  // Row aliases
  UserRow,
  UniverseRow,
  CharacterRow,
  ReleaseRow,
  NewsRow,
  BookmarkRow,
  CharacterLikeRow,
  UniverseFollowRow,
  UserInteractionRow,
  // View aliases
  CharacterDetailView,
  UniverseCardView,
  NewsFeedView,
  // Enums
  UniverseGenre,
  ReleaseType,
  ReleaseStatus,
  EntityType,
  InteractionType,
} from "@db/database.types";

// ── SEO metadata ──────────────────────────────────────────────────────────────
export interface SEOMeta {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogImage?: string;
}

// ── Generic API response ──────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

// ── Domain models (API / page layer) ────────────────────────────────────────────
export interface Universe {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  description: string;
  coverImage: string;
  genre: string;
  platform?: string[];
  fanCount: number;
  characterCount: number;
  releaseCount: number;
  seo: SEOMeta;
}

export interface Character {
  id: string;
  slug: string;
  name: string;
  description: string;
  longDescription?: string;
  image: string;
  title?: string;
  faction?: string;
  rarity?: string;
  abilities?: string[];
  stats?: Record<string, number>;
  fanCount: number;
  universeSlug: string;
  universeName: string;
  appearances: string[];
  seo: SEOMeta;
}

export interface Release {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImage: string;
  status: "upcoming" | "live" | "ended" | "announced" | "released" | "cancelled" | "tba";
  releaseDate: string;
  releaseType: string;
  platform: string[];
  trailerUrl?: string;
  rating?: number;
  tags: string[];
  featuredCharacters: string[];
  universeSlug: string;
  universeName: string;
  seo: SEOMeta;
}

// ── Paginated API response wrapper ────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// ── API error shape ───────────────────────────────────────────────────────────
export interface ApiError {
  error: string;
  code?: string;
  status: number;
}

// ── Search result ─────────────────────────────────────────────────────────────
export interface SearchResult {
  kind: "universe" | "character" | "news" | "release";
  id: string;
  slug: string;
  name: string;
  cover_url: string | null;
  subtitle?: string | null;   // universe name for characters, etc.
}

// ── Bookmark state used in UI ─────────────────────────────────────────────────
export interface BookmarkState {
  isBookmarked: boolean;
  entityType: DbEntityType;
  entityId: string;
}

// ── Like state used in UI ─────────────────────────────────────────────────────
export interface LikeState {
  isLiked: boolean;
  count: number;
  characterId: string;
}

// ── Follow state used in UI ───────────────────────────────────────────────────
export interface FollowState {
  isFollowing: boolean;
  followerCount: number;
  universeId: string;
}