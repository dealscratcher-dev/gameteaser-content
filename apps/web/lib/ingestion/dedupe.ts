import { createClient } from '@supabase/supabase-js';
import { SourceContent, UniverseMatch, DedupeResult } from './types';
import * as stringSimilarity from 'string-similarity';

export class Deduplicator {
    private supabase;
    
    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    async findDuplicateUniverse(content: SourceContent): Promise<UniverseMatch | null> {
        // Check by exact title match
        const { data: exactMatch } = await this.supabase
            .from('universes')
            .select('id, name, slug')
            .ilike('name', content.title)
            .maybeSingle();
        
        if (exactMatch) {
            return {
                confidence: 1.0,
                matched_universe_id: exactMatch.id,
                suggested_name: exactMatch.name,
                reason: 'Exact title match'
            };
        }
        
        // Check by alternative titles
        for (const altTitle of content.alternative_titles || []) {
            const { data: altMatch } = await this.supabase
                .from('universes')
                .select('id, name, slug')
                .ilike('name', altTitle)
                .maybeSingle();
            
            if (altMatch) {
                return {
                    confidence: 0.9,
                    matched_universe_id: altMatch.id,
                    suggested_name: altMatch.name,
                    reason: `Alternative title match: "${altTitle}"`
                };
            }
        }
        
        // Fuzzy match on title
        const { data: allUniverses } = await this.supabase
            .from('universes')
            .select('id, name');
        
        if (allUniverses) {
            const matches = allUniverses.map(u => ({
                id: u.id,
                name: u.name,
                similarity: stringSimilarity.compareTwoStrings(
                    content.title.toLowerCase(),
                    u.name.toLowerCase()
                )
            }));
            
            const bestMatch = matches.sort((a, b) => b.similarity - a.similarity)[0];
            
            if (bestMatch && bestMatch.similarity > 0.8) {
                return {
                    confidence: bestMatch.similarity,
                    matched_universe_id: bestMatch.id,
                    suggested_name: bestMatch.name,
                    reason: `Fuzzy title match (${Math.round(bestMatch.similarity * 100)}% similar)`
                };
            }
        }
        
        return null;
    }
    
    async findDuplicateCharacter(name: string, universeId: string): Promise<UniverseMatch | null> {
        const { data: existing } = await this.supabase
            .from('characters')
            .select('id, name')
            .eq('universe_id', universeId)
            .ilike('name', name)
            .maybeSingle();
        
        if (existing) {
            return {
                confidence: 1.0,
                matched_universe_id: existing.id,
                suggested_name: existing.name,
                reason: 'Character already exists in this universe'
            };
        }
        
        // Fuzzy match
        const { data: allCharacters } = await this.supabase
            .from('characters')
            .select('id, name')
            .eq('universe_id', universeId);
        
        if (allCharacters) {
            const matches = allCharacters.map(c => ({
                id: c.id,
                name: c.name,
                similarity: stringSimilarity.compareTwoStrings(name.toLowerCase(), c.name.toLowerCase())
            }));
            
            const bestMatch = matches.sort((a, b) => b.similarity - a.similarity)[0];
            
            if (bestMatch && bestMatch.similarity > 0.85) {
                return {
                    confidence: bestMatch.similarity,
                    matched_universe_id: bestMatch.id,
                    suggested_name: bestMatch.name,
                    reason: `Similar character name (${Math.round(bestMatch.similarity * 100)}% match)`
                };
            }
        }
        
        return null;
    }
    
    async findDuplicateRelease(title: string, universeId: string): Promise<UniverseMatch | null> {
        const { data: existing } = await this.supabase
            .from('releases')
            .select('id, title')
            .eq('universe_id', universeId)
            .ilike('title', title)
            .maybeSingle();
        
        if (existing) {
            return {
                confidence: 1.0,
                matched_universe_id: existing.id,
                suggested_name: existing.title,
                reason: 'Release already exists in this universe'
            };
        }
        
        return null;
    }
    
    async mergeDuplicates(primaryId: string, duplicateIds: string[]): Promise<void> {
        // Update all relationships to point to primary
        await this.supabase
            .from('universe_relationships')
            .update({ source_universe_id: primaryId })
            .in('source_universe_id', duplicateIds);
        
        await this.supabase
            .from('universe_relationships')
            .update({ target_universe_id: primaryId })
            .in('target_universe_id', duplicateIds);
        
        // Update characters
        await this.supabase
            .from('characters')
            .update({ universe_id: primaryId })
            .in('universe_id', duplicateIds);
        
        // Update releases
        await this.supabase
            .from('releases')
            .update({ universe_id: primaryId })
            .in('universe_id', duplicateIds);
        
        // Delete duplicates
        await this.supabase
            .from('universes')
            .delete()
            .in('id', duplicateIds);
        
        // Log merge
        await this.supabase.from('ingestion_logs').insert({
            source_type: 'system',
            source_id: primaryId,
            target_type: 'universe',
            target_id: primaryId,
            action: 'merged',
            confidence: 1.0,
            metadata: { merged_ids: duplicateIds },
            created_at: new Date()
        });
    }
}