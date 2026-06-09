import { createClient } from '@supabase/supabase-js';
import { SitemapEntry } from './types';

export class SitemapGenerator {
    private supabase;
    private siteUrl: string;
    
    constructor(supabaseUrl: string, supabaseKey: string, siteUrl: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.siteUrl = siteUrl;
    }
    
    async generateSitemap(): Promise<SitemapEntry[]> {
        const entries: SitemapEntry[] = [];
        
        // Add static pages
        entries.push(...this.getStaticPages());
        
        // Add dynamic universes
        const universes = await this.getUniverses();
        entries.push(...universes);
        
        // Add dynamic characters
        const characters = await this.getCharacters();
        entries.push(...characters);
        
        // Add dynamic releases
        const releases = await this.getReleases();
        entries.push(...releases);
        
        // Add taxonomy pages
        const categories = await this.getCategories();
        entries.push(...categories);
        
        const genres = await this.getGenres();
        entries.push(...genres);
        
        const tags = await this.getTags();
        entries.push(...tags);
        
        return entries;
    }
    
    private getStaticPages(): SitemapEntry[] {
        return [
            {
                url: this.siteUrl,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1.0
            },
            {
                url: `${this.siteUrl}/explore`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.9
            },
            {
                url: `${this.siteUrl}/trending`,
                lastModified: new Date(),
                changeFrequency: 'hourly',
                priority: 0.8
            },
            {
                url: `${this.siteUrl}/leaderboard`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.7
            },
            {
                url: `${this.siteUrl}/about`,
                lastModified: new Date(),
                changeFrequency: 'monthly',
                priority: 0.5
            }
        ];
    }
    
    private async getUniverses(): Promise<SitemapEntry[]> {
        const { data } = await this.supabase
            .from('universes')
            .select('slug, updated_at, follower_count')
            .order('updated_at', { ascending: false });
        
        return (data || []).map(universe => ({
            url: `${this.siteUrl}/universe/${universe.slug}`,
            lastModified: new Date(universe.updated_at),
            changeFrequency: universe.follower_count > 1000 ? 'daily' : 'weekly',
            priority: 0.8
        }));
    }
    
    private async getCharacters(): Promise<SitemapEntry[]> {
        const { data } = await this.supabase
            .from('characters')
            .select('slug, updated_at, like_count');
        
        return (data || []).map(character => ({
            url: `${this.siteUrl}/character/${character.slug}`,
            lastModified: new Date(character.updated_at),
            changeFrequency: 'weekly',
            priority: 0.6
        }));
    }
    
    private async getReleases(): Promise<SitemapEntry[]> {
        const { data } = await this.supabase
            .from('releases')
            .select('id, updated_at');
        
        return (data || []).map(release => ({
            url: `${this.siteUrl}/release/${release.id}`,
            lastModified: new Date(release.updated_at),
            changeFrequency: 'weekly',
            priority: 0.7
        }));
    }
    
    private async getCategories(): Promise<SitemapEntry[]> {
        const { data } = await this.supabase
            .from('content_categories')
            .select('slug, updated_at');
        
        return (data || []).map(category => ({
            url: `${this.siteUrl}/category/${category.slug}`,
            lastModified: new Date(category.updated_at),
            changeFrequency: 'weekly',
            priority: 0.7
        }));
    }
    
    private async getGenres(): Promise<SitemapEntry[]> {
        const { data } = await this.supabase
            .from('genre_hierarchy')
            .select('slug, updated_at');
        
        return (data || []).map(genre => ({
            url: `${this.siteUrl}/genre/${genre.slug}`,
            lastModified: new Date(genre.updated_at),
            changeFrequency: 'weekly',
            priority: 0.6
        }));
    }
    
    private async getTags(): Promise<SitemapEntry[]> {
        const { data } = await this.supabase
            .from('tag_taxonomy')
            .select('slug, updated_at')
            .gt('usage_count', 10);
        
        return (data || []).map(tag => ({
            url: `${this.siteUrl}/tag/${tag.slug}`,
            lastModified: new Date(tag.updated_at),
            changeFrequency: 'weekly',
            priority: 0.5
        }));
    }
    
    generateSitemapXML(entries: SitemapEntry[]): string {
        const urls = entries.map(entry => {
            let xml = `<url>\n  <loc>${entry.url}</loc>\n`;
            xml += `  <lastmod>${entry.lastModified.toISOString()}</lastmod>\n`;
            xml += `  <changefreq>${entry.changeFrequency}</changefreq>\n`;
            xml += `  <priority>${entry.priority}</priority>\n`;
            
            if (entry.images && entry.images.length > 0) {
                entry.images.forEach(image => {
                    xml += `  <image:image>\n    <image:loc>${image}</image:loc>\n  </image:image>\n`;
                });
            }
            
            xml += `</url>`;
            return xml;
        }).join('\n');
        
        return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls}\n</urlset>`;
    }
}