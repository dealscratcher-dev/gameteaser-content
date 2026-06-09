import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SEOGenerator } from '@/lib/seo/metadata';
import { BreadcrumbList } from '@/components/seo/BreadcrumbList';
import { UniverseCard } from '@/components/cards/UniverseCard';

interface TagPageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

// Explicit shape for a universe row from Supabase
interface UniverseRow {
    id: string;
    name?: string;
    title?: string;
    description?: string;
    image_url?: string;
    imageUrl?: string;
    [key: string]: unknown;
}

// What Supabase actually returns from universe_taxonomy with universes(*)
interface TaggedUniverseRow {
    universe_id: string;
    universes: UniverseRow | UniverseRow[] | null;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = createServerComponentClient({ cookies });

    const { data: tag } = await supabase
        .from('tag_taxonomy')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!tag) return {};

    const seo = new SEOGenerator();
    const metadata = seo.generateTagMetadata(tag, slug);

    return {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        robots: metadata.robots,
    };
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;
    const supabase = createServerComponentClient({ cookies });

    const page = parseInt(resolvedSearchParams.page || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    const { data: tag } = await supabase
        .from('tag_taxonomy')
        .select('*')
        .eq('slug', slug)
        .single();

    if (!tag) notFound();

    const { data: taggedRows, count } = await supabase
        .from('universe_taxonomy')
        .select('universe_id, universes(*)', { count: 'exact' })
        .eq('tag_id', tag.id)
        .range(offset, offset + limit - 1);

    const totalPages = Math.ceil((count || 0) / limit);

    // Normalise: Supabase may return the joined row as an object or a 1-item array
    const universes: UniverseRow[] = ((taggedRows ?? []) as TaggedUniverseRow[])
        .flatMap((row) => {
            const u = row.universes;
            if (!u) return [];
            return Array.isArray(u) ? u : [u];
        });

    const prevHref = '?page=' + (page - 1);
    const nextHref = '?page=' + (page + 1);

    const breadcrumbItems = [
        { name: 'Home', url: '/', position: 1 },
        { name: 'Tags', url: '/tags', position: 2 },
        { name: '#' + tag.name, url: '/tag/' + tag.slug, position: 3 },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <BreadcrumbList items={breadcrumbItems} className="mb-6" />

            <div className="text-center mb-12">
                <div className="inline-block px-4 py-2 bg-gray-800 rounded-full mb-4">
                    <span className="text-2xl">#</span>
                    <span className="text-2xl font-bold">{tag.name}</span>
                </div>
                <p className="text-gray-400 max-w-2xl mx-auto mt-4">
                    {tag.category} • {tag.usage_count} pieces of content
                </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {universes.map((universe) => (
                    <UniverseCard
                        key={universe.id}
                        title={universe.name ?? universe.title ?? ''}
                        description={universe.description ?? undefined}
                        imageUrl={universe.image_url ?? universe.imageUrl ?? undefined}
                    />
                ))}
            </div>

            {universes.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    No content found with this tag yet.
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    {page > 1 && (
                        <a href={prevHref} className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                            Previous
                        </a>
                    )}
                    <span className="px-4 py-2 bg-gray-800 rounded-lg">
                        Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                        <a href={nextHref} className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                            Next
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
