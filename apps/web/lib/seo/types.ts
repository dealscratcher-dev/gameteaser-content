export interface SEOMetadata {
    title: string;
    description: string;
    canonicalUrl: string;
    keywords?: string[];
    robots?: {
        index: boolean;
        follow: boolean;
        maxSnippet?: number;
        maxImagePreview?: 'none' | 'standard' | 'large';
        maxVideoPreview?: number;
    };
    openGraph?: {
        title: string;
        description: string;
        image?: string;
        type: 'website' | 'article' | 'profile' | 'video.movie';
        url: string;
        siteName?: string;
        locale?: string;
        publishedTime?: string;
        modifiedTime?: string;
        authors?: string[];
        tags?: string[];
    };
    twitter?: {
        card: 'summary' | 'summary_large_image' | 'app' | 'player';
        site?: string;
        creator?: string;
        title: string;
        description: string;
        image?: string;
    };
    alternates?: {
        canonical?: string;
        languages?: Record<string, string>;
    };
}

export interface BreadcrumbItem {
    name: string;
    url: string;
    position: number;
}

export interface SocialShareData {
    title: string;
    description: string;
    url: string;
    imageUrl?: string;
    hashtags?: string[];
}

export interface SEOCategory {
    id: string;
    name: string;
    slug: string;
    description: string;
    parent?: SEOCategory;
    children?: SEOCategory[];
    contentCount: number;
}

export interface SitemapEntry {
    url: string;
    lastModified: Date;
    changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority: number;
    images?: string[];
    videos?: string[];
}