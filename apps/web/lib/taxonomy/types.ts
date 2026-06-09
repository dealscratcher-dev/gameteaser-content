export interface ContentCategory {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    cover_image?: string;
    display_order: number;
    is_active: boolean;
    seo_title?: string;
    seo_description?: string;
    subcategories?: ContentSubcategory[];
    count?: number;
}

export interface ContentSubcategory {
    id: string;
    category_id: string;
    name: string;
    slug: string;
    description: string;
    display_order: number;
    is_active: boolean;
    count?: number;
}

export interface Genre {
    id: string;
    name: string;
    slug: string;
    parent_id?: string;
    description: string;
    color: string;
    icon: string;
    popularity_weight: number;
    seo_keywords?: string[];
    related_genres?: string[];
    level: number;
    children?: Genre[];
    count?: number;
}

export interface TaxonomyTag {
    id: string;
    name: string;
    slug: string;
    category: 'theme' | 'mechanic' | 'mood' | 'setting' | 'feature';
    description?: string;
    usage_count: number;
    is_trending: boolean;
    popularity_score: number;
}

export interface TaxonomyFilter {
    categories?: string[];
    subcategories?: string[];
    genres?: string[];
    tags?: string[];
    sortBy?: 'relevance' | 'popularity' | 'newest' | 'alphabetical';
}

export interface TaxonomyResponse<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}