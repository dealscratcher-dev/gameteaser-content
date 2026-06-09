export interface SourceContent {
    source_id: string;           // ID from original source
    source_type: 'igdb' | 'tmdb' | 'anilist' | 'rawg';
    title: string;
    alternative_titles?: string[];
    description?: string;
    release_date?: Date;
    cover_url?: string;
    genre?: string[];
    tags?: string[];
    rating?: number;
    popularity?: number;
    external_url?: string;
    metadata?: Record<string, any>;
}

export interface UniverseMatch {
    confidence: number;          // 0-1 score
    matched_universe_id?: string;
    suggested_name?: string;
    reason: string;
}

export interface IngestionJob {
    id: string;
    source_type: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    total_items: number;
    processed_items: number;
    created_at: Date;
    completed_at?: Date;
    error?: string;
}

export interface DedupeResult {
    original_id: string;
    duplicate_of: string | null;
    confidence: number;
    reason: string;
}

export interface IngestionLog {
    id: string;
    source_type: string;
    source_id: string;
    target_type: 'universe' | 'character' | 'release';
    target_id: string;
    action: 'created' | 'updated' | 'skipped' | 'merged';
    confidence: number;
    metadata: Record<string, any>;
    created_at: Date;
}