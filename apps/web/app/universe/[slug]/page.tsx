import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { cachedFetch } from '@/lib/redis';
import { SEOGenerator } from '@/lib/seo/metadata';
import { SchemaGenerator } from '@/lib/seo/schema';
import { SchemaMarkup } from '@/components/seo/SchemaMarkup';
import { BreadcrumbList } from '@/components/seo/BreadcrumbList';
import { SocialShare } from '@/components/seo/SocialShare';
import { UniverseGraph } from '@/components/graph/UniverseGraph';
import { RelatedUniverses } from '@/components/graph/RelatedUniverses';

interface UniversePageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: UniversePageProps): Promise<Metadata> {
    const { slug } = await params;
    const supabase = createServerComponentClient({ cookies });
    const universe = await cachedFetch(`universe:${slug}`, async () => {
        const { data } = await supabase
            .from('universes')
            .select('*')
            .eq('slug', slug)
            .single();
        return data;
    });
    
    if (!universe) return {};
    
    const seo = new SEOGenerator();
    const metadata = seo.generateUniverseMetadata(universe, slug);
    
    return {
        title: metadata.title,
        description: metadata.description,
        keywords: metadata.keywords,
        robots: {
            index: metadata.robots?.index,
            follow: metadata.robots?.follow,
        },
        openGraph: metadata.openGraph,
        twitter: metadata.twitter,
        alternates: metadata.alternates,
    };
}

export default async function UniversePage({ params }: UniversePageProps) {
    const { slug } = await params;
    const supabase = createServerComponentClient({ cookies });
    
    // Fetch universe data with Redis cache (TTL 60s)
    const universe = await cachedFetch(`universe:${slug}`, async () => {
      const { data } = await supabase
        .from('universes')
        .select('*')
        .eq('slug', slug)
        .single();
      return data;
    });
    
    if (!universe) notFound();
    
    // Generate schemas
    const seo = new SEOGenerator();
    const schemaGen = new SchemaGenerator(process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamebit.com');
    
    const universeSchema = schemaGen.generateUniverseSchema({
        id: universe.id,
        name: universe.name,
        description: universe.description,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/universe/${universe.slug}`,
        image: universe.cover_url,
        genre: universe.genre,
        dateCreated: universe.created_at,
        dateModified: universe.updated_at,
        numberOfCharacters: universe.character_count,
        numberOfReleases: universe.release_count,
        interactionCount: universe.follower_count
    });
    
    const breadcrumbItems = [
        { name: 'Home', url: '/', position: 1 },
        { name: 'Universes', url: '/explore', position: 2 },
        { name: universe.name, url: `/universe/${universe.slug}`, position: 3 }
    ];
    
    const socialShareData = {
        title: universe.name,
        description: universe.description || `Explore the ${universe.name} universe`,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/universe/${universe.slug}`,
        imageUrl: universe.cover_url || undefined,
        hashtags: [universe.genre, 'thegamebit']
    };
    
    return (
        <>
            <SchemaMarkup data={universeSchema} />
            <SchemaMarkup data={seo.generateBreadcrumbSchema(breadcrumbItems)} />
            <SchemaMarkup data={seo.generateSearchActionSchema()} />
            <SchemaMarkup data={seo.generateOrganizationSchema()} />
            
            <div className="container mx-auto px-4 py-8">
                <BreadcrumbList items={breadcrumbItems} className="mb-6" />
                
                {/* Hero Section */}
                <div className="relative rounded-xl overflow-hidden mb-8">
                    {universe.cover_url && (
                        <div className="absolute inset-0">
                            <img 
                                src={universe.cover_url} 
                                alt={universe.name}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
                        </div>
                    )}
                    
                    <div className="relative p-8">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4">{universe.name}</h1>
                        <p className="text-lg text-gray-300 max-w-2xl mb-6">{universe.description}</p>
                        
                        <div className="flex flex-wrap gap-4">
                            <div className="bg-black/50 rounded-lg px-4 py-2">
                                <div className="text-2xl font-bold">{universe.follower_count?.toLocaleString()}</div>
                                <div className="text-xs text-gray-400">Followers</div>
                            </div>
                            <div className="bg-black/50 rounded-lg px-4 py-2">
                                <div className="text-2xl font-bold">{universe.character_count}</div>
                                <div className="text-xs text-gray-400">Characters</div>
                            </div>
                            <div className="bg-black/50 rounded-lg px-4 py-2">
                                <div className="text-2xl font-bold">{universe.release_count}</div>
                                <div className="text-xs text-gray-400">Releases</div>
                            </div>
                        </div>
                        
                        <div className="mt-6">
                            <SocialShare data={socialShareData} />
                        </div>
                    </div>
                </div>
                
                {/* Universe Graph Section */}
                <section className="mb-12">
                    <h2 className="text-2xl font-bold mb-4">Universe Connections</h2>
                    <UniverseGraph universeId={universe.id} />
                </section>
                
                {/* Related Universes Section */}
                <section>
                    <h2 className="text-2xl font-bold mb-4">Related Universes</h2>
                    <RelatedUniverses universeId={universe.id} limit={6} />
                </section>
            </div>
        </>
    );
}