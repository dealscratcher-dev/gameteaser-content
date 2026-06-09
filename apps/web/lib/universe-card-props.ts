import type { Universe } from "@/types";

export interface UniverseCardBaseProps {
  slug: string;
  name: string;
  tagline: string;
  coverImage: string;
  genre?: string[];
  fanCount?: number;
  characterCount?: number;
  releaseCount?: number;
  variant?: string;
}

/** Convert a Universe domain object or raw DB row to UniverseCard props. */
export function toUniverseCardProps(
  universe: Universe | Record<string, unknown>
): UniverseCardBaseProps {
  if ("coverImage" in universe && typeof universe.coverImage === "string") {
    const u = universe as Universe;
    return {
      slug: u.slug,
      name: u.name,
      tagline: u.tagline ?? u.description?.slice(0, 120) ?? "",
      coverImage: u.coverImage,
      genre: [u.genre],
      fanCount: u.fanCount,
      characterCount: u.characterCount,
      releaseCount: u.releaseCount,
      variant: u.genre,
    };
  }

  const row = universe as Record<string, unknown>;
  return {
    slug: String(row.slug ?? row.universe_slug ?? ""),
    name: String(row.name ?? row.universe_name ?? ""),
    tagline: String(row.description ?? row.tagline ?? "").slice(0, 120),
    coverImage: String(row.cover_url ?? row.cover_image ?? "/assets/hero-banner.png"),
    genre: row.genre ? [String(row.genre)] : [],
    fanCount: Number(row.follower_count ?? row.fan_count ?? 0),
    characterCount: Number(row.character_count ?? 0),
    releaseCount: Number(row.release_count ?? 0),
    variant: row.genre ? String(row.genre) : undefined,
  };
}
