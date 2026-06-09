// apps/web/app/character/[slug]/page.tsx

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCharacter, getAllCharacterSlugs } from "@/lib/fetchers";
import { buildMetadata, personJsonLd } from "@/lib/metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllCharacterSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: character } = await getCharacter(slug);

  if (!character) {
    return { title: "Character Not Found" };
  }

  return buildMetadata(character.seo, {
    openGraph: {
      type: "profile",
      title: character.seo.title,
      description: character.seo.description,
      images: [{ url: character.image, width: 1200, height: 630, alt: character.name }],
    },
  });
}

export default async function CharacterPage({ params }: PageProps) {
  const { slug } = await params;
  const { data: character } = await getCharacter(slug);

  if (!character) notFound();

  const jsonLd = personJsonLd(character.name, character.description, character.image);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="container mx-auto px-4 py-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-gray-400">
          <ol className="flex flex-wrap gap-2">
            <li><Link href="/" className="hover:text-white">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href={`/universe/${character.universeSlug}`} className="hover:text-white">
                {character.universeName}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-white">{character.name}</li>
          </ol>
        </nav>

        <section aria-label={`${character.name} profile`} className="grid gap-8 lg:grid-cols-[320px_1fr]">
          <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-zinc-900 ring-1 ring-white/10">
            <Image
              src={character.image}
              alt={character.name}
              fill
              priority
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 320px"
            />
          </div>

          <div className="space-y-6">
            <header>
              {character.rarity && (
                <span
                  className="mb-3 inline-block rounded-full bg-purple-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-purple-300"
                  aria-label={`${character.rarity} rarity`}
                >
                  {character.rarity}
                </span>
              )}
              <h1 className="font-barlow text-4xl font-extrabold uppercase tracking-tight text-white md:text-5xl">
                {character.name}
              </h1>
              {character.title && (
                <p className="mt-2 text-lg text-gray-400">{character.title}</p>
              )}
              {character.faction && (
                <p className="mt-1 text-sm text-gray-500">
                  Faction: <span className="text-gray-300">{character.faction}</span>
                </p>
              )}
            </header>

            <p className="text-gray-300 leading-relaxed">{character.description}</p>

            {character.longDescription && (
              <div>
                <h2 className="mb-2 font-barlow text-xl font-bold uppercase text-white">Lore</h2>
                <p className="text-gray-400 leading-relaxed">{character.longDescription}</p>
              </div>
            )}

            {character.abilities && character.abilities.length > 0 && (
              <section aria-labelledby="abilities-heading">
                <h2 id="abilities-heading" className="mb-3 font-barlow text-xl font-bold uppercase text-white">Abilities</h2>
                <ul className="flex flex-wrap gap-2">
                  {character.abilities.map((ability) => (
                    <li key={ability} className="rounded-full bg-zinc-800 px-3 py-1 text-sm text-gray-300">
                      {ability}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {character.stats && Object.keys(character.stats).length > 0 && (
              <section aria-labelledby="stats-heading">
                <h2 id="stats-heading" className="mb-3 font-barlow text-xl font-bold uppercase text-white">Stats</h2>
                <dl className="space-y-3">
                  {Object.entries(character.stats).map(([key, value]) => (
                    <div key={key}>
                      <dt className="mb-1 text-xs uppercase tracking-wider text-gray-500">{key}</dt>
                      <dd className="flex items-center gap-3">
                        <div
                          className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800"
                          role="meter"
                          aria-valuenow={value}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`${key}: ${value}`}
                        >
                          <div
                            className="h-full rounded-full bg-orange-500"
                            style={{ width: `${Math.min(value, 100)}%` }}
                          />
                        </div>
                        <span className="w-8 text-sm font-semibold text-white">{value}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            )}

            <p className="text-sm text-gray-500" aria-label="Fan count">
              {character.fanCount.toLocaleString()} fans
            </p>
          </div>
        </section>

        {character.appearances.length > 0 && (
          <section aria-labelledby="appearances-heading" className="mt-12">
            <h2 id="appearances-heading" className="mb-4 font-barlow text-2xl font-bold uppercase text-white">Appears In</h2>
            <ul className="flex flex-wrap gap-3" role="list">
              {character.appearances.map((releaseSlug) => (
                <li key={releaseSlug}>
                  <Link
                    href={`/release/${releaseSlug}`}
                    className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-gray-300 hover:bg-zinc-700 hover:text-white"
                  >
                    {releaseSlug}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}
