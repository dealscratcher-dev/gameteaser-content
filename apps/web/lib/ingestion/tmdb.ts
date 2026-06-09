import { BaseIngester } from './base';
import { SourceContent } from './types';

interface TMDBMovie {
    id: number;
    title: string;
    original_title: string;
    overview: string;
    release_date: string;
    poster_path: string;
    backdrop_path: string;
    vote_average: number;
    popularity: number;
    genres: Array<{ id: number; name: string }>;
    keywords?: { keywords: Array<{ name: string }> };
    belongs_to_collection?: { name: string };
    homepage?: string;
    imdb_id?: string;
}

export class TMDBIngester extends BaseIngester {
    private apiKey: string;
    private baseUrl = 'https://api.themoviedb.org/3';
    
    constructor(supabaseUrl: string, supabaseKey: string) {
        super(supabaseUrl, supabaseKey, 'tmdb');
        this.apiKey = process.env.TMDB_API_KEY!;
    }
    
    async fetchContent(limit: number = 100, offset: number = 0): Promise<SourceContent[]> {
        const page = Math.floor(offset / 20) + 1;
        
        const response = await fetch(
            `${this.baseUrl}/movie/popular?api_key=${this.apiKey}&page=${page}&language=en-US`
        );
        
        const data = await response.json();
        const movies: TMDBMovie[] = data.results.slice(0, limit);
        
        // Fetch full details for each movie
        const fullMovies = await Promise.all(
            movies.map(movie => this.fetchMovieDetails(movie.id))
        );
        
        return fullMovies.map(movie => this.transformToSourceContent(movie));
    }
    
    private async fetchMovieDetails(movieId: number): Promise<TMDBMovie> {
        const [details, keywords] = await Promise.all([
            fetch(`${this.baseUrl}/movie/${movieId}?api_key=${this.apiKey}&language=en-US`).then(r => r.json()),
            fetch(`${this.baseUrl}/movie/${movieId}/keywords?api_key=${this.apiKey}`).then(r => r.json())
        ]);
        
        return { ...details, keywords: keywords };
    }
    
    private transformToSourceContent(movie: TMDBMovie): SourceContent {
        return {
            source_id: String(movie.id),
            source_type: 'tmdb',
            title: movie.title,
            alternative_titles: movie.original_title !== movie.title ? [movie.original_title] : [],
            description: movie.overview,
            release_date: movie.release_date ? new Date(movie.release_date) : undefined,
            cover_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : undefined,
            genre: movie.genres?.map(g => this.mapGenre(g.name)) || [],
            tags: movie.keywords?.keywords?.map(k => k.name.toLowerCase()) || [],
            rating: movie.vote_average / 10,
            popularity: movie.popularity,
            external_url: movie.homepage || `https://www.themoviedb.org/movie/${movie.id}`,
            metadata: {
                collection: movie.belongs_to_collection?.name,
                imdb_id: movie.imdb_id,
                backdrop_url: movie.backdrop_path ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}` : undefined,
                source: 'tmdb',
                raw_data: movie
            }
        };
    }
    
    transformToUniverse(content: SourceContent): any {
        // For movies, create universe from franchise/collection if available
        const universeName = content.metadata?.collection || content.title;
        
        return {
            slug: this.generateSlug(universeName),
            name: universeName,
            description: content.description?.substring(0, 2000),
            cover_url: content.metadata?.backdrop_url || content.cover_url,
            genre: content.genre?.[0] || 'other',
            tags: [...new Set([...(content.genre ?? []), ...(content.tags ?? [])])],
            created_at: new Date(),
            updated_at: new Date(),
            metadata: content.metadata
        };
    }
    
    transformToCharacter(content: SourceContent): any {
        return []; // TMDB doesn't provide character data in basic API
    }
    
    transformToRelease(content: SourceContent): any {
        return {
            title: content.title,
            description: content.description,
            release_date: content.release_date?.toISOString().split('T')[0],
            cover_url: content.cover_url,
            type: 'movie',
            status: content.release_date && content.release_date < new Date() ? 'completed' : 'announced',
            external_url: content.external_url
        };
    }
    
    private mapGenre(tmdbGenre: string): string {
        const genreMap: Record<string, string> = {
            'Action': 'action',
            'Adventure': 'adventure',
            'Animation': 'animation',
            'Comedy': 'comedy',
            'Crime': 'crime',
            'Documentary': 'documentary',
            'Drama': 'drama',
            'Family': 'family',
            'Fantasy': 'fantasy',
            'History': 'historical',
            'Horror': 'horror',
            'Music': 'music',
            'Mystery': 'mystery',
            'Romance': 'romance',
            'Science Fiction': 'sci_fi',
            'Thriller': 'thriller',
            'War': 'war',
            'Western': 'western'
        };
        
        return genreMap[tmdbGenre] || 'other';
    }
}