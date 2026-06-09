import { BaseIngester } from './base';
import { SourceContent } from './types';

interface IGDBGame {
    id: number;
    name: string;
    alternative_names?: Array<{ name: string }>;
    summary?: string;
    first_release_date?: number;
    cover?: { url: string };
    genres?: Array<{ name: string }>;
    themes?: Array<{ name: string }>;
    rating?: number;
    popularity?: number;
    url?: string;
    franchises?: Array<{ name: string }>;
    involved_companies?: Array<{ company: { name: string } }>;
}

export class IGDBIngester extends BaseIngester {
    private accessToken: string | null = null;
    private tokenExpiry: Date | null = null;
    
    constructor(supabaseUrl: string, supabaseKey: string) {
        super(supabaseUrl, supabaseKey, 'igdb');
    }
    
    private async getAccessToken(): Promise<string> {
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
            return this.accessToken;
        }
        
        const response = await fetch('https://id.twitch.tv/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: process.env.TWITCH_CLIENT_ID!,
                client_secret: process.env.TWITCH_CLIENT_SECRET!,
                grant_type: 'client_credentials'
            })
        });
        
        const data = await response.json();
        this.accessToken = data.access_token ?? null;
        this.tokenExpiry = new Date(Date.now() + data.expires_in * 1000);

        if (!this.accessToken) {
            throw new Error("IGDB auth failed: no access token returned");
        }

        return this.accessToken;
    }
    
    async fetchContent(limit: number = 100, offset: number = 0): Promise<SourceContent[]> {
        const token = await this.getAccessToken();
        
        const query = `
            fields id, name, alternative_names.name, summary, first_release_date, 
                    cover.url, genres.name, themes.name, rating, popularity, url,
                    franchises.name, involved_companies.company.name;
            where version_parent = null & category = 0;
            sort popularity desc;
            limit ${limit};
            offset ${offset};
        `;
        
        const response = await fetch('https://api.igdb.com/v4/games', {
            method: 'POST',
            headers: {
                'Client-ID': process.env.TWITCH_CLIENT_ID!,
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'text/plain'
            },
            body: query
        });
        
        const games: IGDBGame[] = await response.json();
        
        return games.map(game => this.transformToSourceContent(game));
    }
    
    private transformToSourceContent(game: IGDBGame): SourceContent {
        return {
            source_id: String(game.id),
            source_type: 'igdb',
            title: game.name,
            alternative_titles: game.alternative_names?.map(n => n.name) || [],
            description: game.summary,
            release_date: game.first_release_date ? new Date(game.first_release_date * 1000) : undefined,
            cover_url: game.cover?.url?.replace('//', 'https://') || undefined,
            genre: game.genres?.map(g => this.mapGenre(g.name)) || [],
            tags: [
                ...(game.themes?.map(t => t.name.toLowerCase()) || []),
                ...(game.franchises?.map(f => f.name.toLowerCase()) || [])
            ],
            rating: game.rating ? game.rating / 100 : undefined,
            popularity: game.popularity,
            external_url: game.url,
            metadata: {
                companies: game.involved_companies?.map(c => c.company.name) || [],
                source: 'igdb',
                raw_data: game
            }
        };
    }
    
    transformToUniverse(content: SourceContent): any {
        return {
            slug: this.generateSlug(content.title),
            name: content.title,
            description: content.description?.substring(0, 2000),
            cover_url: content.cover_url,
            genre: content.genre?.[0] || 'other',
            tags: [...new Set([...(content.genre ?? []), ...(content.tags ?? [])])],
            created_at: new Date(),
            updated_at: new Date(),
            metadata: content.metadata
        };
    }
    
    transformToCharacter(content: SourceContent): any {
        // Extract characters from game metadata if available
        const characters = content.metadata?.raw_data?.characters || [];
        return characters.map((char: any) => ({
            name: char.name,
            description: char.description,
            image_url: char.image_url,
            role: 'character'
        }));
    }
    
    transformToRelease(content: SourceContent): any {
        return {
            title: content.title,
            description: content.description,
            release_date: content.release_date?.toISOString().split('T')[0],
            cover_url: content.cover_url,
            type: 'game',
            status: content.release_date && content.release_date < new Date() ? 'completed' : 'announced'
        };
    }
    
    private mapGenre(igdbGenre: string): string {
        const genreMap: Record<string, string> = {
            'Action': 'action',
            'Adventure': 'adventure',
            'RPG': 'rpg',
            'Role-playing (RPG)': 'rpg',
            'Strategy': 'strategy',
            'Shooter': 'shooter',
            'Fighting': 'fighting',
            'Racing': 'racing',
            'Sports': 'sports',
            'Simulation': 'simulation',
            'Horror': 'horror',
            'Puzzle': 'puzzle',
            'Platform': 'platform',
            'Indie': 'indie'
        };
        
        return genreMap[igdbGenre] || 'other';
    }
}