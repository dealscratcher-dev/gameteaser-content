import { createClient } from '@supabase/supabase-js';
import { SourceContent } from './types';

interface MatchResult {
    universe_id: string;
    confidence: number;
    matched_fields: string[];
}

export class EntityMatcher {
    private supabase;
    
    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    async matchToExistingUniverse(content: SourceContent): Promise<MatchResult | null> {
        let bestMatch: MatchResult | null = null;
        let highestConfidence = 0;
        
        // Strategy 1: Exact title match
        const exactMatch = await this.matchByExactTitle(content.title);
        if (exactMatch && exactMatch.confidence > highestConfidence) {
            bestMatch = exactMatch;
            highestConfidence = exactMatch.confidence;
        }
        
        // Strategy 2: External ID match (IGDB, TMDB, AniList)
        const externalMatch = await this.matchByExternalId(content.source_type, content.source_id);
        if (externalMatch && externalMatch.confidence > highestConfidence) {
            bestMatch = externalMatch;
            highestConfidence = externalMatch.confidence;
        }
        
        // Strategy 3: Alternative titles
        if (content.alternative_titles) {
            for (const altTitle of content.alternative_titles) {
                const altMatch = await this.matchByExactTitle(altTitle);
                if (altMatch && altMatch.confidence > highestConfidence) {
                    bestMatch = altMatch;
                    highestConfidence = altMatch.confidence;
                }
            }
        }
        
        // Strategy 4: URL match
        if (content.external_url) {
            const urlMatch = await this.matchByUrl(content.external_url);
            if (urlMatch && urlMatch.confidence > highestConfidence) {
                bestMatch = urlMatch;
                highestConfidence = urlMatch.confidence;
            }
        }
        
        return bestMatch;
    }
    
    private async matchByExactTitle(title: string): Promise<MatchResult | null> {
        const { data } = await this.supabase
            .from('universes')
            .select('id, name')
            .ilike('name', title)
            .maybeSingle();
        
        if (data) {
            return {
                universe_id: data.id,
                confidence: 1.0,
                matched_fields: ['title']
            };
        }
        
        return null;
    }
    
    private async matchByExternalId(sourceType: string, sourceId: string): Promise<MatchResult | null> {
        const { data } = await this.supabase
            .from('ingestion_logs')
            .select('target_id')
            .eq('source_type', sourceType)
            .eq('source_id', sourceId)
            .eq('action', 'created')
            .maybeSingle();
        
        if (data) {
            return {
                universe_id: data.target_id,
                confidence: 1.0,
                matched_fields: ['external_id']
            };
        }
        
        return null;
    }
    
    private async matchByUrl(url: string): Promise<MatchResult | null> {
        const { data } = await this.supabase
            .from('universes')
            .select('id')
            .eq('external_url', url)
            .maybeSingle();
        
        if (data) {
            return {
                universe_id: data.id,
                confidence: 1.0,
                matched_fields: ['url']
            };
        }
        
        return null;
    }
    
    async suggestFranchiseConnection(content: SourceContent): Promise<string[]> {
        const suggestions: string[] = [];
        
        // Check if this content belongs to a known franchise
        const keywords = [
            ...(content.tags || []),
            ...(content.genre || []),
            ...(content.metadata?.collection ? [content.metadata.collection] : [])
        ];
        
        for (const keyword of keywords) {
            const { data } = await this.supabase
                .from('universes')
                .select('name')
                .ilike('name', `%${keyword}%`)
                .limit(3);
            
            if (data) {
                suggestions.push(...data.map(u => u.name));
            }
        }
        
        return [...new Set(suggestions)];
    }
}