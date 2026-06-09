import { BaseIngester } from './base';
import { SourceContent } from './types';

interface AniListMedia {
    id: number;
    idMal: number;
    title: {
        romaji: string;
        english: string;
        native: string;
    };
    synonyms: string[];
    description: string;
    startDate: { year: number; month: number; day: number };
    coverImage: { large: string; extraLarge: string };
    bannerImage: string;
    genres: string[];
    tags: Array<{ name: string; rank: number }>;
    averageScore: number;
    popularity: number;
    siteUrl: string;
    format: string;
    status: string;
    episodes?: number;
    chapters?: number;
    volumes?: number;
    source: string;
    isAdult: boolean;
}

export class AniListIngester extends BaseIngester {
    private apiUrl = 'https://graphql.anilist.co';
    
    constructor(supabaseUrl: string, supabaseKey: string) {
        super(supabaseUrl, supabaseKey, 'anilist');
    }
    
    async fetchContent(limit: number = 50, offset: number = 0): Promise<SourceContent[]> {
        const page = Math.floor(offset / 50) + 1;
        
        const query = `
            query ($page: Int, $perPage: Int) {
                Page(page: $page, perPage: $perPage) {
                    media(type: ANIME, sort: POPULARITY_DESC) {
                        id
                        idMal
                        title {
                            romaji
                            english
                            native
                        }
                        synonyms
                        description
                        startDate { year month day }
                        coverImage { large extraLarge }
                        bannerImage
                        genres
                        tags { name rank }
                        averageScore
                        popularity
                        siteUrl
                        format
                        status
                        episodes
                        chapters
                        volumes
                        source
                        isAdult
                    }
                }
            }
        `;
        
        const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                query,
                variables: { page, perPage: limit }
            })
        });
        
        const data = await response.json();
        const media: AniListMedia[] = data.data.Page.media;
        
        return media.map(anime => this.transformToSourceContent(anime));
    }
    
    private transformToSourceContent(anime: AniListMedia): SourceContent {
        const title = anime.title.english || anime.title.romaji;
        const startDate = anime.startDate.year 
            ? new Date(anime.startDate.year, (anime.startDate.month || 1) - 1, anime.startDate.day || 1)
            : undefined;
        
        return {
            source_id: String(anime.id),
            source_type: 'anilist',
            title: title,
            alternative_titles: [
                anime.title.romaji,
                anime.title.native,
                ...anime.synonyms
            ].filter(t => t && t !== title),
            description: anime.description?.replace(/<[^>]*>/g, ''), // Strip HTML
            release_date: startDate,
            cover_url: anime.coverImage?.large,
            genre: anime.genres?.map(g => this.mapGenre(g)) || [],
            tags: anime.tags?.map(t => t.name.toLowerCase()) || [],
            rating: anime.averageScore ? anime.averageScore / 100 : undefined,
            popularity: anime.popularity,
            external_url: anime.siteUrl,
            metadata: {
                format: anime.format,
                status: anime.status,
                episodes: anime.episodes,
                chapters: anime.chapters,
                volumes: anime.volumes,
                source: anime.source,
                isAdult: anime.isAdult,
                banner_image: anime.bannerImage,
                mal_id: anime.idMal,
                raw_data: anime
            }
        };
    }
    
    transformToUniverse(content: SourceContent): any {
        return {
            slug: this.generateSlug(content.title),
            name: content.title,
            description: content.description?.substring(0, 2000),
            cover_url: content.metadata?.banner_image || content.cover_url,
            genre: content.genre?.[0] || 'other',
            tags: [...new Set([...(content.genre ?? []), ...(content.tags ?? [])])],
            created_at: new Date(),
            updated_at: new Date(),
            metadata: content.metadata
        };
    }
    
    transformToCharacter(content: SourceContent): any {
        return []; // Characters require separate API call
    }
    
    transformToRelease(content: SourceContent): any {
        const format = content.metadata?.format?.toLowerCase();
        let type = 'other';
        
        if (format === 'tv' || format === 'tv_short') type = 'series';
        else if (format === 'movie') type = 'movie';
        else if (format === 'ova') type = 'ova';
        else if (format === 'manga') type = 'manga';
        else if (format === 'novel') type = 'novel';
        
        return {
            title: content.title,
            description: content.description,
            release_date: content.release_date?.toISOString().split('T')[0],
            cover_url: content.cover_url,
            type: type,
            status: this.mapStatus(content.metadata?.status),
            external_url: content.external_url
        };
    }
    
    private mapGenre(anilistGenre: string): string {
        const genreMap: Record<string, string> = {
            'Action': 'action',
            'Adventure': 'adventure',
            'Comedy': 'comedy',
            'Drama': 'drama',
            'Fantasy': 'fantasy',
            'Horror': 'horror',
            'Mystery': 'mystery',
            'Romance': 'romance',
            'Sci-Fi': 'sci_fi',
            'Slice of Life': 'slice_of_life',
            'Sports': 'sports',
            'Supernatural': 'supernatural',
            'Thriller': 'thriller'
        };
        
        return genreMap[anilistGenre] || 'other';
    }
    
    private mapStatus(status: string): string {
        const statusMap: Record<string, string> = {
            'FINISHED': 'completed',
            'RELEASING': 'ongoing',
            'NOT_YET_RELEASED': 'announced',
            'CANCELLED': 'cancelled'
        };
        
        return statusMap[status] || 'announced';
    }
}