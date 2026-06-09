import { createClient } from '@supabase/supabase-js';
import { ContentCategory, ContentSubcategory, Genre, TaxonomyTag, TaxonomyFilter, TaxonomyResponse } from './types';

export class TaxonomyEngine {
    private supabase;
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private CACHE_TTL = 3600000; // 1 hour
    
    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    async getCategories(): Promise<ContentCategory[]> {
        const cacheKey = 'categories';
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            // Select only fields that exist in ContentCategory
            const { data, error } = await this.supabase
                .from('content_categories')
                .select('id, name, slug, description, icon, cover_image, display_order, is_active, seo_title, seo_description')
                .order('display_order', { ascending: true });
            
            if (error) {
                console.error('Error fetching categories:', error);
                return [];
            }
            
            // Ensure all required fields are present (is_active defaults to true)
            const typedData = (data || []).map(item => ({
                ...item,
                is_active: item.is_active ?? true,
            })) as ContentCategory[];
            
            this.setCache(cacheKey, typedData);
            return typedData;
        } catch (err) {
            console.error('Unexpected error fetching categories:', err);
            return [];
        }
    }
    
    async getGenres(): Promise<Genre[]> {
        const cacheKey = 'genres';
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            // Select fields that map to Genre interface
            const { data, error } = await this.supabase
                .from('genres')
                .select('id, name, slug, parent_id, description, color, icon, popularity_weight, seo_keywords, level')
                .order('name', { ascending: true });
            
            if (error) {
                console.error('Error fetching genres:', error);
                return [];
            }
            
            // Provide defaults for optional fields if missing
            const typedData = (data || []).map(item => ({
                ...item,
                popularity_weight: item.popularity_weight ?? 0,
                level: item.level ?? 0,
                seo_keywords: item.seo_keywords ?? [],
            })) as Genre[];
            
            this.setCache(cacheKey, typedData);
            return typedData;
        } catch (err) {
            console.error('Unexpected error fetching genres:', err);
            return [];
        }
    }
    
    async getTrendingTags(limit: number = 20): Promise<TaxonomyTag[]> {
        const cacheKey = `tags:trending:${limit}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        try {
            // Query the 'tags' table – adjust column names to match your DB schema
            // We need: id, name, slug, category, description, usage_count, is_trending, popularity_score
            const { data, error } = await this.supabase
                .from('tags')
                .select('id, name, slug, category, description, usage_count, is_trending, popularity_score')
                .order('popularity_score', { ascending: false })
                .limit(limit);
            
            if (error) {
                console.warn('Tags table may not exist yet or missing columns:', error.message);
                // Mock data that matches TaxonomyTag exactly
                const mockTags: TaxonomyTag[] = [
                    { id: '1', name: 'Action', slug: 'action', category: 'theme', usage_count: 150, is_trending: true, popularity_score: 95 },
                    { id: '2', name: 'RPG', slug: 'rpg', category: 'mechanic', usage_count: 120, is_trending: true, popularity_score: 85 },
                    { id: '3', name: 'Multiplayer', slug: 'multiplayer', category: 'feature', usage_count: 100, is_trending: true, popularity_score: 80 },
                    { id: '4', name: 'Story Rich', slug: 'story-rich', category: 'theme', usage_count: 90, is_trending: true, popularity_score: 75 },
                    { id: '5', name: 'Open World', slug: 'open-world', category: 'setting', usage_count: 80, is_trending: true, popularity_score: 70 }
                ];
                const result = mockTags.slice(0, limit);
                this.setCache(cacheKey, result);
                return result;
            }
            
            // Map the data to ensure all required fields exist
            const typedData = (data || []).map(item => ({
                id: item.id,
                name: item.name,
                slug: item.slug,
                category: item.category || 'theme', // default category if missing
                description: item.description,
                usage_count: item.usage_count ?? 0,
                is_trending: item.is_trending ?? false,
                popularity_score: item.popularity_score ?? 0,
            })) as TaxonomyTag[];
            
            this.setCache(cacheKey, typedData);
            return typedData;
        } catch (err) {
            console.warn('Error fetching tags, using mock data:', err);
            return [];
        }
    }
    
    async getContentByTaxonomy(
        taxonomyType: 'category' | 'subcategory' | 'genre' | 'tag',
        taxonomyId: string,
        page: number = 1,
        limit: number = 20
    ): Promise<TaxonomyResponse<any>> {
        const offset = (page - 1) * limit;
        
        let data: any[] = [];
        let total = 0;
        
        try {
            if (taxonomyType === 'category') {
                const { data: items, error, count } = await this.supabase
                    .from('universes')
                    .select('*', { count: 'exact' })
                    .eq('category_id', taxonomyId)
                    .range(offset, offset + limit - 1);
                
                if (!error) {
                    data = items || [];
                    total = count || 0;
                }
            } else if (taxonomyType === 'genre') {
                const { data: items, error, count } = await this.supabase
                    .from('universe_genres')
                    .select('universes(*)', { count: 'exact' })
                    .eq('genre_id', taxonomyId)
                    .range(offset, offset + limit - 1);
                
                if (!error) {
                    data = items?.map(item => item.universes) || [];
                    total = count || 0;
                }
            } else if (taxonomyType === 'tag') {
                const { data: items, error, count } = await this.supabase
                    .from('content_tags')
                    .select('content(*)', { count: 'exact' })
                    .eq('tag_id', taxonomyId)
                    .range(offset, offset + limit - 1);
                
                if (!error) {
                    data = items?.map(item => item.content) || [];
                    total = count || 0;
                }
            }
        } catch (err) {
            console.error('Error fetching content by taxonomy:', err);
        }
        
        return {
            data,
            total,
            page,
            limit,
            hasMore: offset + limit < total
        };
    }
    
    async getRelatedTaxonomy(
        taxonomyType: 'category' | 'genre' | 'tag',
        taxonomyId: string,
        limit: number = 5
    ): Promise<any[]> {
        const cacheKey = `related:${taxonomyType}:${taxonomyId}`;
        const cached = this.getCache(cacheKey);
        if (cached) return cached;
        
        let related: any[] = [];
        
        try {
            if (taxonomyType === 'genre') {
                const { data: current } = await this.supabase
                    .from('genres')
                    .select('parent_id')
                    .eq('id', taxonomyId)
                    .single();
                
                if (current?.parent_id) {
                    const { data } = await this.supabase
                        .from('genres')
                        .select('id, name, slug, icon, color')
                        .eq('parent_id', current.parent_id)
                        .neq('id', taxonomyId)
                        .limit(limit);
                    related = data || [];
                }
            } else if (taxonomyType === 'category') {
                // Note: ContentCategory has no parent_id in interface, but DB may have it.
                // If you need parent/child categories, adjust accordingly.
                const { data: current } = await this.supabase
                    .from('content_categories')
                    .select('parent_id')
                    .eq('id', taxonomyId)
                    .single();
                
                if (current?.parent_id) {
                    const { data } = await this.supabase
                        .from('content_categories')
                        .select('id, name, slug, icon')
                        .eq('parent_id', current.parent_id)
                        .neq('id', taxonomyId)
                        .limit(limit);
                    related = data || [];
                }
            }
        } catch (err) {
            console.warn('Error fetching related taxonomy:', err);
        }
        
        this.setCache(cacheKey, related);
        return related;
    }
    
    async getTaxonomyBreadcrumbs(
        taxonomyType: 'category' | 'subcategory' | 'genre',
        taxonomyId: string
    ): Promise<Array<{ name: string; slug: string; type: string }>> {
        const breadcrumbs: Array<{ name: string; slug: string; type: string }> = [];
        
        try {
            if (taxonomyType === 'category') {
                const { data } = await this.supabase
                    .from('content_categories')
                    .select('name, slug')
                    .eq('id', taxonomyId)
                    .single();
                
                if (data) {
                    breadcrumbs.push({ name: data.name, slug: data.slug, type: 'category' });
                }
            } else if (taxonomyType === 'subcategory') {
                const { data } = await this.supabase
                    .from('content_subcategories')
                    .select('name, slug, category_id, content_categories(name, slug)')
                    .eq('id', taxonomyId)
                    .single();
                
                if (data) {
                    const category = data.content_categories as any;
                    if (category && typeof category === 'object') {
                        breadcrumbs.push({
                            name: category.name,
                            slug: category.slug,
                            type: 'category'
                        });
                    }
                    breadcrumbs.push({ name: data.name, slug: data.slug, type: 'subcategory' });
                }
            } else if (taxonomyType === 'genre') {
                const { data } = await this.supabase
                    .from('genres')
                    .select('name, slug, parent_id, parent:parent_id(name, slug)')
                    .eq('id', taxonomyId)
                    .single();
                
                if (data) {
                    const parent = data.parent as any;
                    if (parent && typeof parent === 'object') {
                        breadcrumbs.push({
                            name: parent.name,
                            slug: parent.slug,
                            type: 'genre'
                        });
                    }
                    breadcrumbs.push({ name: data.name, slug: data.slug, type: 'genre' });
                }
            }
        } catch (err) {
            console.warn('Error fetching breadcrumbs:', err);
        }
        
        return breadcrumbs;
    }
    
    async generateSeoMetadata(
        taxonomyType: 'category' | 'subcategory' | 'genre' | 'tag',
        taxonomyId: string
    ): Promise<{
        title: string;
        description: string;
        keywords: string[];
        canonicalUrl: string;
    }> {
        let title = '';
        let description = '';
        let keywords: string[] = [];
        
        try {
            if (taxonomyType === 'category') {
                const { data } = await this.supabase
                    .from('content_categories')
                    .select('name, seo_title, seo_description')
                    .eq('id', taxonomyId)
                    .single();
                
                if (data) {
                    title = data.seo_title || `${data.name} Universe Directory | TheGameBit`;
                    description = data.seo_description || `Explore all ${data.name} universes, characters, and releases`;
                    keywords = [`${data.name} universes`, `${data.name} characters`, `${data.name} games`, 'fandom'];
                }
            } else if (taxonomyType === 'genre') {
                const { data } = await this.supabase
                    .from('genres')
                    .select('name, description, seo_keywords')
                    .eq('id', taxonomyId)
                    .single();
                
                if (data) {
                    title = `${data.name} Genre Universe Guide | TheGameBit`;
                    description = data.description || `Discover the best ${data.name} games, anime, and movies`;
                    keywords = data.seo_keywords || [`${data.name} genre`, `${data.name} games`, `${data.name} anime`];
                }
            } else {
                title = `Taxonomy Guide | TheGameBit`;
                description = `Explore our comprehensive taxonomy of gaming universes`;
                keywords = ['gaming', 'universes', 'taxonomy'];
            }
        } catch (err) {
            console.warn('Error generating SEO metadata:', err);
            title = `TheGameBit - Gaming Universe Taxonomy`;
            description = `Discover and explore gaming universes, characters, and releases`;
            keywords = ['gaming', 'universes', 'taxonomy'];
        }
        
        return {
            title,
            description,
            keywords,
            canonicalUrl: `https://thegamebit.com/${taxonomyType}s/${taxonomyId}`
        };
    }
    
    private getCache(key: string): any | null {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data;
        }
        return null;
    }
    
    private setCache(key: string, data: any): void {
        this.cache.set(key, { data, timestamp: Date.now() });
    }
}
