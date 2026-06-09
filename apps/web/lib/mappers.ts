import type {
  CharacterDetailView,
  ReleaseRow,
  UniverseCardView,
  UniverseRow,
  ReleaseStatus,
} from "@/types";
import type { Character, Release, SEOMeta, Universe } from "@/types";

const SITE_NAME = "TheGameBit";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://thegamebit.com";

export function releaseSlug(release: { id: string; title: string }): string {
  return release.id;
}

function buildSeo(
  title: string,
  description: string,
  canonical: string,
  keywords: string[] = [],
  ogImage?: string | null
): SEOMeta {
  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    keywords,
    canonical,
    ogImage: ogImage ?? undefined,
  };
}

export function mapUniverseRow(row: UniverseRow): Universe {
  const canonical = `${BASE_URL}/universe/${row.slug}`;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.description?.slice(0, 120) ?? "",
    description: row.description ?? "",
    coverImage: row.cover_url ?? "/assets/hero-banner.png",
    genre: row.genre,
    platform: [],
    fanCount: row.follower_count,
    characterCount: row.character_count,
    releaseCount: row.release_count,
    seo: buildSeo(row.name, row.description ?? row.name, canonical, [
      row.genre,
      ...row.tags,
    ], row.cover_url),
  };
}

export function mapUniverseCard(row: UniverseCardView): Universe {
  const canonical = `${BASE_URL}/universe/${row.slug ?? ""}`;
  return {
    id: row.id ?? "",
    slug: row.slug ?? "",
    name: row.name ?? "",
    tagline: row.description?.slice(0, 120) ?? "",
    description: row.description ?? "",
    coverImage: row.cover_url ?? "/assets/hero-banner.png",
    genre: row.genre ?? "other",
    platform: [],
    fanCount: row.follower_count ?? 0,
    characterCount: row.character_count ?? 0,
    releaseCount: row.release_count ?? 0,
    seo: buildSeo(row.name ?? "", row.description ?? "", canonical, [
      row.genre ?? "",
      ...(row.tags ?? []),
    ], row.cover_url),
  };
}

export function mapCharacterRow(row: CharacterDetailView): Character {
  const slug = row.slug ?? "";
  const canonical = `${BASE_URL}/character/${slug}`;
  return {
    id: row.id ?? "",
    slug,
    name: row.name ?? "",
    description: row.description ?? "",
    image: row.image_url ?? "/assets/hero-banner.png",
    title: row.role ?? undefined,
    fanCount: row.like_count ?? 0,
    universeSlug: row.universe_slug ?? "",
    universeName: row.universe_name ?? "",
    appearances: [],
    seo: buildSeo(row.name ?? "", row.description ?? row.name ?? "", canonical, [
      row.universe_name ?? "",
      row.role ?? "",
    ].filter(Boolean), row.image_url),
  };
}

export function mapReleaseStatus(status: ReleaseStatus, releaseDate: string | null): Release["status"] {
  if (status === "cancelled") return "ended";
  if (status === "released") {
    if (releaseDate && new Date(releaseDate) > new Date()) return "upcoming";
    return "live";
  }
  if (status === "announced" || status === "tba") return "upcoming";
  return "upcoming";
}

export function mapReleaseRow(
  row: ReleaseRow & { universe_slug?: string; universe_name?: string }
): Release {
  const slug = releaseSlug(row);
  const canonical = `${BASE_URL}/release/${slug}`;
  const uiStatus = mapReleaseStatus(row.status, row.release_date);

  return {
    id: row.id,
    slug,
    title: row.title,
    description: row.description ?? "",
    coverImage: row.cover_url ?? "/assets/hero-banner.png",
    status: uiStatus,
    releaseDate: row.release_date ?? new Date().toISOString(),
    releaseType: row.type,
    platform: [],
    trailerUrl: row.external_url ?? undefined,
    tags: [],
    featuredCharacters: [],
    universeSlug: row.universe_slug ?? "",
    universeName: row.universe_name ?? "",
    seo: buildSeo(row.title, row.description ?? row.title, canonical, [row.type], row.cover_url),
  };
}

/** Maps taxonomy RPC rows or raw universe rows to UniverseCard props. */
export function mapTaxonomyUniverse(universe: Record<string, unknown>): Universe {
  if ("universe_id" in universe) {
    return {
      id: String(universe.universe_id),
      slug: String(universe.universe_slug ?? universe.slug ?? ""),
      name: String(universe.universe_name ?? universe.name ?? ""),
      tagline: String(universe.description ?? "").slice(0, 120),
      description: String(universe.description ?? ""),
      coverImage: String(universe.cover_url ?? universe.cover_image ?? "/assets/hero-banner.png"),
      genre: String(universe.genre ?? "other"),
      platform: [],
      fanCount: Number(universe.follower_count ?? universe.fan_count ?? 0),
      characterCount: Number(universe.character_count ?? 0),
      releaseCount: Number(universe.release_count ?? 0),
      seo: buildSeo(
        String(universe.universe_name ?? universe.name ?? ""),
        String(universe.description ?? ""),
        `${BASE_URL}/universe/${universe.universe_slug ?? universe.slug}`,
        [],
        String(universe.cover_url ?? "")
      ),
    };
  }
  return mapUniverseRow(universe as unknown as UniverseRow);
}
