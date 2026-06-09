import { SEOMetadata, BreadcrumbItem } from './types';

export class SEOGenerator {
    private siteName = 'TheGameBit';
    private siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thegamebit.com';
    private defaultImage = '/og/default.jpg';
    
    generateUniverseMetadata(
        universe: {
            id: string;
            name: string;
            description: string | null;
            cover_url: string | null;
            genre: string;
            tags: string[];
            follower_count: number;
            character_count: number;
            release_count: number;
            created_at: Date;
            updated_at: Date;
        },
        slug: string
    ): SEOMetadata {
        const title = `${universe.name} Universe - Explore Characters, Games & Releases | TheGameBit`;
        const description = universe.description 
            ? `${universe.description.substring(0, 155)}...` 
            : `Explore the ${universe.name} universe including ${universe.character_count} characters, ${universe.release_count} releases, and discover related content.`;
        
        const url = `${this.siteUrl}/universe/${slug}`;
        const image = universe.cover_url || this.defaultImage;
        
        return {
            title,
            description,
            canonicalUrl: url,
            keywords: [
                universe.name,
                `${universe.name} universe`,
                `${universe.name} characters`,
                `${universe.name} games`,
                universe.genre,
                ...universe.tags
            ],
            robots: {
                index: true,
                follow: true,
                maxSnippet: 160,
                maxImagePreview: 'large'
            },
            openGraph: {
                title: `${universe.name} Universe | TheGameBit`,
                description,
                image,
                type: 'website',
                url,
                siteName: this.siteName,
                publishedTime: universe.created_at.toISOString(),
                modifiedTime: universe.updated_at.toISOString(),
                tags: [universe.genre, ...universe.tags]
            },
            twitter: {
                card: 'summary_large_image',
                site: '@thegamebit',
                title: `${universe.name} Universe`,
                description,
                image
            },
            alternates: {
                canonical: url
            }
        };
    }
    
    generateCharacterMetadata(
        character: {
            id: string;
            name: string;
            description: string | null;
            image_url: string | null;
            role: string | null;
            universe_name: string;
            universe_slug: string;
            like_count: number;
            aliases: string[];
        },
        slug: string
    ): SEOMetadata {
        const title = `${character.name} - Character from ${character.universe_name} | TheGameBit`;
        const description = character.description 
            ? `${character.description.substring(0, 155)}...` 
            : `Learn about ${character.name}, a ${character.role || 'character'} from the ${character.universe_name} universe. ${character.like_count} fans have liked this character.`;
        
        const url = `${this.siteUrl}/character/${slug}`;
        const image = character.image_url || this.defaultImage;
        
        return {
            title,
            description,
            canonicalUrl: url,
            keywords: [
                character.name,
                `${character.name} ${character.universe_name}`,
                `${character.universe_name} characters`,
                ...character.aliases,
                character.role || 'character'
            ],
            robots: {
                index: true,
                follow: true,
                maxSnippet: 160,
                maxImagePreview: 'large'
            },
            openGraph: {
                title: `${character.name} - ${character.universe_name} Character`,
                description,
                image,
                type: 'profile',
                url,
                siteName: this.siteName,
                publishedTime: new Date().toISOString(),
                tags: [character.universe_name, character.role || 'character']
            },
            twitter: {
                card: 'summary_large_image',
                site: '@thegamebit',
                title: character.name,
                description,
                image
            }
        };
    }
    
    generateReleaseMetadata(
        release: {
            id: string;
            title: string;
            description: string | null;
            cover_url: string | null;
            type: string;
            status: string;
            release_date: Date | null;
            universe_name: string;
            universe_slug: string;
        },
        slug: string
    ): SEOMetadata {
        const title = `${release.title} - ${release.type} from ${release.universe_name} | TheGameBit`;
        const description = release.description 
            ? `${release.description.substring(0, 155)}...` 
            : `${release.title} is a ${release.type} in the ${release.universe_name} universe. Status: ${release.status}.`;
        
        const url = `${this.siteUrl}/release/${slug}`;
        const image = release.cover_url || this.defaultImage;
        
        return {
            title,
            description,
            canonicalUrl: url,
            keywords: [
                release.title,
                `${release.title} ${release.type}`,
                release.universe_name,
                `${release.universe_name} ${release.type}`,
                release.status
            ],
            robots: {
                index: true,
                follow: true,
                maxSnippet: 160,
                maxImagePreview: 'large'
            },
            openGraph: {
                title: `${release.title} | ${release.universe_name}`,
                description,
                image,
                type: 'video.movie',
                url,
                siteName: this.siteName,
                publishedTime: release.release_date?.toISOString() || new Date().toISOString(),
                tags: [release.type, release.status, release.universe_name]
            },
            twitter: {
                card: 'summary_large_image',
                site: '@thegamebit',
                title: release.title,
                description,
                image
            }
        };
    }
    
    generateCategoryMetadata(
        category: {
            id: string;
            name: string;
            description: string | null;
            icon: string;
            count: number;
        },
        slug: string
    ): SEOMetadata {
        const title = `${category.name} - Explore ${category.count} Universes | TheGameBit`;
        const description = category.description 
            || `Discover the best ${category.name.toLowerCase()} universes, characters, and releases. ${category.count} universes available to explore.`;
        
        const url = `${this.siteUrl}/category/${slug}`;
        
        return {
            title,
            description,
            canonicalUrl: url,
            keywords: [
                category.name,
                `${category.name} universes`,
                `${category.name} games`,
                `${category.name} characters`,
                'fandom',
                'discovery'
            ],
            robots: {
                index: true,
                follow: true,
                maxSnippet: 160
            },
            openGraph: {
                title: `${category.name} Universe Collection | TheGameBit`,
                description,
                image: this.defaultImage,
                type: 'website',
                url,
                siteName: this.siteName,
                tags: [category.name, 'universe collection']
            },
            twitter: {
                card: 'summary_large_image',
                site: '@thegamebit',
                title: `${category.name} Universes`,
                description
            }
        };
    }
    
    generateGenreMetadata(
        genre: {
            id: string;
            name: string;
            description: string | null;
            color: string;
            icon: string;
            count: number;
        },
        slug: string
    ): SEOMetadata {
        const title = `${genre.name} Genre - Best ${genre.name} Games, Anime & Movies | TheGameBit`;
        const description = genre.description 
            || `Explore the best ${genre.name.toLowerCase()} genre content including games, anime, comics, and movies. ${genre.count}+ universes to discover.`;
        
        const url = `${this.siteUrl}/genre/${slug}`;
        
        return {
            title,
            description,
            canonicalUrl: url,
            keywords: [
                genre.name,
                `${genre.name} games`,
                `${genre.name} anime`,
                `${genre.name} movies`,
                `${genre.name} comics`,
                'genre guide'
            ],
            openGraph: {
                title: `${genre.name} Genre Hub | TheGameBit`,
                description,
                image: this.defaultImage,
                type: 'website',
                url,
                siteName: this.siteName
            },
            twitter: {
                card: 'summary_large_image',
                site: '@thegamebit',
                title: `${genre.name} Genre`,
                description
            }
        };
    }
    
    generateTagMetadata(
        tag: {
            id: string;
            name: string;
            category: string;
            usage_count: number;
        },
        slug: string
    ): SEOMetadata {
        const title = `${tag.name} - Tagged Content Discovery | TheGameBit`;
        const description = `Explore ${tag.usage_count} pieces of content tagged with "${tag.name}". Find ${tag.category} related universes, characters, and releases.`;
        
        const url = `${this.siteUrl}/tag/${slug}`;
        
        return {
            title,
            description,
            canonicalUrl: url,
            keywords: [tag.name, `${tag.name} tag`, `${tag.category} tag`, 'content discovery'],
            robots: {
                index: true,
                follow: true
            },
            openGraph: {
                title: `${tag.name} Content Collection`,
                description,
                image: this.defaultImage,
                type: 'website',
                url,
                siteName: this.siteName
            },
            twitter: {
                card: 'summary',
                site: '@thegamebit',
                title: `${tag.name} Content`,
                description
            }
        };
    }
    
    generateBreadcrumbSchema(items: BreadcrumbItem[]): any {
        return {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            'itemListElement': items.map((item, index) => ({
                '@type': 'ListItem',
                'position': item.position || index + 1,
                'name': item.name,
                'item': item.url
            }))
        };
    }
    
    generateOrganizationSchema(): any {
        return {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            'name': this.siteName,
            'url': this.siteUrl,
            'logo': `${this.siteUrl}/logo.png`,
            'sameAs': [
                'https://twitter.com/thegamebit',
                'https://discord.gg/thegamebit',
                'https://github.com/thegamebit'
            ]
        };
    }
    
    generateSearchActionSchema(): any {
        return {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            'url': this.siteUrl,
            'potentialAction': {
                '@type': 'SearchAction',
                'target': `${this.siteUrl}/search?q={search_term_string}`,
                'query-input': 'required name=search_term_string'
            }
        };
    }
    
    generateCollectionPageSchema(
        name: string,
        description: string,
        url: string,
        items: Array<{ name: string; url: string }>
    ): any {
        return {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            'name': name,
            'description': description,
            'url': url,
            'mainEntity': {
                '@type': 'ItemList',
                'itemListElement': items.map((item, index) => ({
                    '@type': 'ListItem',
                    'position': index + 1,
                    'name': item.name,
                    'url': item.url
                }))
            }
        };
    }
}