// apps/web/lib/fetchers.ts

import type {
  Universe,
  Character,
  Release,
  ApiResponse,
  PaginatedResponse,
} from "@/types";
import { get, set } from "./redis";

// ─── Cache Config ─────────────────────────────────────────────────────────────

const CACHE_TTL = {
  universe: 60 * 60,
  character: 60 * 30,
  release: 60 * 15,
  list: 60 * 5,
} as const;

// ─── Internal fetch helper ────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options?: RequestInit & { next?: NextFetchRequestConfig }
): Promise<ApiResponse<T>> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => res.statusText);
      return { data: null, error: msg };
    }

    const data = (await res.json()) as T;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: (err as Error).message };
  }
}

// ─── Universe ─────────────────────────────────────────────────────────────────

export async function getUniverse(
  slug: string
): Promise<ApiResponse<Universe>> {
  const cacheKey = `universe:${slug}`;
  const cached = await get<Universe>(cacheKey);
  if (cached) return { data: cached, error: null };
  const res = await apiFetch<Universe>(`/api/universes/${slug}`, {
    next: { revalidate: CACHE_TTL.universe, tags: [`universe-${slug}`] },
  });
  if (res.data) await set(cacheKey, res.data, CACHE_TTL.universe);
  return res;
}

export async function getAllUniverseSlugs(): Promise<string[]> {
  const res = await apiFetch<{ slugs: string[] }>("/api/universes/slugs", {
    next: { revalidate: CACHE_TTL.list },
  });
  return res.data?.slugs ?? [];
}

export async function getUniverses(
  page = 1,
  pageSize = 20
): Promise<ApiResponse<PaginatedResponse<Universe>>> {
  const cacheKey = `universes:list:${page}:${pageSize}`;
  const cached = await get<PaginatedResponse<Universe>>(cacheKey);
  if (cached) return { data: cached, error: null };
  const res = await apiFetch<PaginatedResponse<Universe>>(
    `/api/universes?page=${page}&pageSize=${pageSize}`,
    { next: { revalidate: CACHE_TTL.list, tags: ["universes"] } }
  );
  if (res.data) await set(cacheKey, res.data, CACHE_TTL.list);
  return res;
}

// ─── Character ────────────────────────────────────────────────────────────────

export async function getCharacter(
  slug: string
): Promise<ApiResponse<Character>> {
  return apiFetch<Character>(`/api/characters/${slug}`, {
    next: { revalidate: CACHE_TTL.character, tags: [`character-${slug}`] },
  });
}

export async function getAllCharacterSlugs(): Promise<string[]> {
  const res = await apiFetch<{ slugs: string[] }>("/api/characters/slugs", {
    next: { revalidate: CACHE_TTL.list },
  });
  return res.data?.slugs ?? [];
}

export async function getCharactersByUniverse(
  universeSlug: string
): Promise<ApiResponse<Character[]>> {
  return apiFetch<Character[]>(
    `/api/characters?universe=${universeSlug}`,
    { next: { revalidate: CACHE_TTL.character, tags: [`universe-${universeSlug}-characters`] } }
  );
}

// ─── Release ──────────────────────────────────────────────────────────────────

export async function getRelease(
  slug: string
): Promise<ApiResponse<Release>> {
  const cacheKey = `release:${slug}`;
  const cached = await get<Release>(cacheKey);
  if (cached) return { data: cached, error: null };
  const res = await apiFetch<Release>(`/api/releases/${slug}`, {
    next: { revalidate: CACHE_TTL.release, tags: [`release-${slug}`] },
  });
  if (res.data) await set(cacheKey, res.data, CACHE_TTL.release);
  return res;
}

export async function getAllReleaseSlugs(): Promise<string[]> {
  const res = await apiFetch<{ slugs: string[] }>("/api/releases/slugs", {
    next: { revalidate: CACHE_TTL.list },
  });
  return res.data?.slugs ?? [];
}

export async function getReleasesByUniverse(
  universeSlug: string
): Promise<ApiResponse<Release[]>> {
  const cacheKey = `universe:${universeSlug}:releases`;
  const cached = await get<Release[]>(cacheKey);
  if (cached) return { data: cached, error: null };
  const res = await apiFetch<Release[]>(`/api/releases?universe=${universeSlug}`, {
    next: { revalidate: CACHE_TTL.release, tags: [`universe-${universeSlug}-releases`] },
  });
  if (res.data) await set(cacheKey, res.data, CACHE_TTL.release);
  return res;
}
