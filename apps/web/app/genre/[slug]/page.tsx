import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { SEOGenerator } from '@/lib/seo/metadata';
import { SchemaMarkup } from '@/components/seo/SchemaMarkup';
import { BreadcrumbList } from '@/components/seo/BreadcrumbList';
import { UniverseCard } from '@/components/cards/UniverseCard';

interface GenrePageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({ params }: GenrePageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = createServerComponentClient({ cookies });
    const { data: genre } = await supabase
        .from('genre_hierarchy')
        .select('*')
        .eq('slug', slug)
        .single();
    
    if (!genre) return {};
    
    const seo = new SEOGenerator();
    const metadata = seo.generateGenreMetadata({
        id: genre.id,
        name: genre.name,
        description: genre.description,
        color: genre.color,
        icon: genre.icon,
        count: 0
    }, slug);
    
    return {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        openGraph: metadata.openGraph,
        twitter: metadata.twitter
    };
}

export default async function GenrePage({ params, searchParams }: GenrePageProps) {
    const { slug } = await params;
    const resolvedSearchParams = await searchParams;
    const supabase = createServerComponentClient({ cookies });
    const page = parseInt(resolvedSearchParams.page || '1');
    const limit = 20;
    const offset = (page - 1) * limit;
    
    // Get genre
    const { data: genre } = await supabase
        .from('genre_hierarchy')
        .select('*')
        .eq('slug', slug)
        .single();
    
    if (!genre) notFound();
    
    // Get universes in this genre
    const { data: universes, count } = await supabase
        .from('universes')
        .select('*', { count: 'exact' })
        .eq('genre', genre.id)
        .range(offset, offset + limit - 1)
        .order('follower_count', { ascending: false });
    
    const totalPages = Math.ceil((count || 0) / limit);
    
    const breadcrumbItems = [
        { name: 'Home', url: '/', position: 1 },
        { name: 'Genres', url: '/genres', position: 2 },
        { name: genre.name, url: `/genre/${genre.slug}`, position: 3 }
    ];
    
    return (
        <>
            <SchemaMarkup data={{
                '@context': 'https://schema.org',
                '@type': 'CollectionPage',
                'name': `${genre.name} Games, Anime & Movies`,
                'description': genre.description,
                'url': `${process.env.NEXT_PUBLIC_SITE_URL}/genre/${genre.slug}`,
                'numberOfItems': count
            }} />
            
            <div className="container mx-auto px-4 py-8">
                <BreadcrumbList items={breadcrumbItems} className="mb-6" />
                
                <div className="text-center mb-12">
                    <div className="text-6xl mb-4">{genre.icon}</div>
                    <h1 className="text-4xl font-bold mb-4">{genre.name} Genre</h1>
                    <p className="text-gray-400 max-w-2xl mx-auto">{genre.description}</p>
                    <div className="mt-4 text-sm text-gray-500">{count} universes found</div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {universes?.map(universe => (
                        <UniverseCard
                            key={universe.id}
                            title={universe.name ?? universe.title ?? ''}
                            description={universe.description ?? undefined}
                            imageUrl={universe.image_url ?? universe.imageUrl ?? undefined}
                        />
                    ))}
                </div>
                
                {universes?.length === 0 && (
                    <div className="text-center text-gray-400 py-12">
                        No universes found in this genre yet.
                    </div>
                )}
                
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-8">
                        {page > 1 && (
                            <a href={`?page=${page - 1}`} className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                                Previous
                            </a>
                        )}
                        <span className="px-4 py-2 bg-gray-800 rounded-lg">
                            Page {page} of {totalPages}
                        </span>
                        {page < totalPages && (
                            <a href={`?page=${page + 1}`} className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700">
                                Next
                            </a>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
