// apps/web/app/release/[slug]/page.tsx

import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getRelease, getAllReleaseSlugs } from "@/lib/fetchers";
import { buildMetadata, videoGameJsonLd } from "@/lib/metadata";

interface PageProps {
  params: Promise<{ slug: string }>;
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: "Coming Soon",
  live: "Live Now",
  ended: "Ended",
  announced: "Announced",
  released: "Released",
  cancelled: "Cancelled",
  tba: "TBA",
};

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-yellow-500/20 text-yellow-300",
  live: "bg-green-500/20 text-green-300",
  ended: "bg-gray-500/20 text-gray-300",
  announced: "bg-blue-500/20 text-blue-300",
  released: "bg-green-500/20 text-green-300",
  cancelled: "bg-red-500/20 text-red-300",
  tba: "bg-purple-500/20 text-purple-300",
};

export async function generateStaticParams() {
  const slugs = await getAllReleaseSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data: release } = await getRelease(slug);

  if (!release) {
    return { title: "Release Not Found" };
  }

  return buildMetadata(release.seo, {
    openGraph: {
      type: "website",
      title: release.seo.title,
      description: release.seo.description,
      images: [
        { url: release.coverImage, width: 1200, height: 630, alt: release.title },
      ],
    },
  });
}

export default async function ReleasePage({ params }: PageProps) {
  const { slug } = await params;
  const { data: release } = await getRelease(slug);

  if (!release) notFound();

  const jsonLd = videoGameJsonLd(
    release.title,
    release.description,
    release.coverImage
  );

  const isUpcoming = release.status === "upcoming" || release.status === "announced" || release.status === "tba";
  const releaseDate = new Date(release.releaseDate);
  const formattedDate = releaseDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
              <Link href={`/universe/${release.universeSlug}`} className="hover:text-white">
                {release.universeName}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-white">{release.title}</li>
          </ol>
        </nav>

        <section aria-label={`${release.title} cover`} className="relative mb-10 overflow-hidden rounded-xl">
          <div className="relative aspect-video w-full">
            <Image
              src={release.coverImage}
              alt={`${release.title} cover art`}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <span
              className="mb-3 inline-block rounded-full bg-zinc-800/80 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-300"
              aria-label={`Release type: ${release.releaseType}`}
            >
              {release.releaseType}
            </span>

            <h1 className="font-barlow text-3xl font-extrabold uppercase tracking-tight text-white md:text-5xl">
              {release.title}
            </h1>
            {release.subtitle && (
              <p className="mt-2 text-lg text-gray-300">{release.subtitle}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${STATUS_COLORS[release.status] ?? STATUS_COLORS.upcoming}`}
                aria-label={`Status: ${STATUS_LABEL[release.status] ?? release.status}`}
              >
                {STATUS_LABEL[release.status] ?? release.status}
              </span>

              <time
                dateTime={release.releaseDate}
                className="text-sm text-gray-400"
                aria-label={`Release date: ${formattedDate}`}
              >
                {isUpcoming ? "Releases" : "Released"} {formattedDate}
              </time>
            </div>

            {release.platform.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-2" aria-label="Available platforms">
                {release.platform.map((p) => (
                  <li key={p} className="rounded bg-zinc-800/80 px-2 py-1 text-xs text-gray-300">{p}</li>
                ))}
              </ul>
            )}

            {release.trailerUrl && (
              <a
                href={release.trailerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-none border border-orange-500 bg-orange-500 px-5 py-2 text-sm font-bold uppercase tracking-widest text-zinc-950 transition hover:bg-transparent hover:text-orange-400"
                aria-label={`Watch ${release.title} trailer`}
              >
                Watch Trailer
              </a>
            )}
          </div>
        </section>

        <section aria-labelledby="about-heading" className="max-w-3xl space-y-4">
          <h2 id="about-heading" className="font-barlow text-2xl font-bold uppercase text-white">About</h2>
          <p className="text-gray-300 leading-relaxed">{release.description}</p>

          {release.rating != null && (
            <div
              className="inline-flex items-baseline gap-1 rounded-lg bg-zinc-800 px-4 py-2"
              aria-label={`Community rating: ${release.rating.toFixed(1)} out of 10`}
            >
              <span className="text-2xl font-bold text-orange-400">{release.rating.toFixed(1)}</span>
              <span className="text-sm text-gray-500">/10</span>
            </div>
          )}

          {release.tags.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Tags">
              {release.tags.map((tag) => (
                <li key={tag} className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-gray-400">#{tag}</li>
              ))}
            </ul>
          )}
        </section>

        {release.featuredCharacters.length > 0 && (
          <section aria-labelledby="characters-heading" className="mt-10">
            <h2 id="characters-heading" className="mb-4 font-barlow text-2xl font-bold uppercase text-white">Featured Characters</h2>
            <ul className="flex flex-wrap gap-3" role="list">
              {release.featuredCharacters.map((charSlug) => (
                <li key={charSlug}>
                  <Link
                    href={`/character/${charSlug}`}
                    className="rounded-lg bg-zinc-800 px-4 py-2 text-sm text-gray-300 hover:bg-zinc-700 hover:text-white"
                  >
                    {charSlug}
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
