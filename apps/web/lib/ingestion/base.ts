import { createClient } from '@supabase/supabase-js';
import { SourceContent, IngestionLog, UniverseMatch } from './types';
import { Deduplicator } from './dedupe';
import { EntityMatcher } from './matcher';

export abstract class BaseIngester {
    protected supabase;
    protected deduplicator: Deduplicator;
    protected matcher: EntityMatcher;
    protected sourceType: string;
    
    constructor(
        supabaseUrl: string,
        supabaseKey: string,
        sourceType: string
    ) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.deduplicator = new Deduplicator(supabaseUrl, supabaseKey);
        this.matcher = new EntityMatcher(supabaseUrl, supabaseKey);
        this.sourceType = sourceType;
    }
    
    // Abstract methods to be implemented by each source
    abstract fetchContent(limit?: number, offset?: number): Promise<SourceContent[]>;
    abstract transformToUniverse(content: SourceContent): any;
    abstract transformToCharacter(content: SourceContent): any;
    abstract transformToRelease(content: SourceContent): any;
    
    // Common ingestion logic
    async ingestUniverses(limit: number = 100): Promise<IngestionLog[]> {
        const logs: IngestionLog[] = [];
        const contents = await this.fetchContent(limit);
        
        for (const content of contents) {
            try {
                // Check for duplicates
                const match = await this.deduplicator.findDuplicateUniverse(content);
                
                if (match && match.confidence > 0.8) {
                    // High confidence duplicate - skip
                    logs.push({
                        id: crypto.randomUUID(),
                        source_type: this.sourceType,
                        source_id: content.source_id,
                        target_type: 'universe',
                        target_id: match.matched_universe_id!,
                        action: 'skipped',
                        confidence: match.confidence,
                        metadata: { reason: match.reason },
                        created_at: new Date()
                    });
                    continue;
                }
                
                if (match && match.confidence > 0.5) {
                    // Medium confidence - suggest merge but don't auto-create
                    logs.push({
                        id: crypto.randomUUID(),
                        source_type: this.sourceType,
                        source_id: content.source_id,
                        target_type: 'universe',
                        target_id: '',
                        action: 'skipped',
                        confidence: match.confidence,
                        metadata: { 
                            reason: match.reason,
                            suggested_match: match.matched_universe_id,
                            suggested_name: match.suggested_name
                        },
                        created_at: new Date()
                    });
                    continue;
                }
                
                // No duplicate - create new universe
                const universeData = this.transformToUniverse(content);
                
                const { data: universe, error } = await this.supabase
                    .from('universes')
                    .insert(universeData)
                    .select()
                    .single();
                
                if (error) throw error;
                
                logs.push({
                    id: crypto.randomUUID(),
                    source_type: this.sourceType,
                    source_id: content.source_id,
                    target_type: 'universe',
                    target_id: universe.id,
                    action: 'created',
                    confidence: 1.0,
                    metadata: { title: content.title },
                    created_at: new Date()
                });
                
                // Also ingest characters and releases if available
                if (content.metadata?.characters) {
                    await this.ingestCharacters(content, universe.id);
                }
                
                if (content.metadata?.releases) {
                    await this.ingestReleases(content, universe.id);
                }
                
            } catch (error) {
                console.error(`Failed to ingest ${content.source_id}:`, error);
                logs.push({
                    id: crypto.randomUUID(),
                    source_type: this.sourceType,
                    source_id: content.source_id,
                    target_type: 'universe',
                    target_id: '',
                    action: 'skipped',
                    confidence: 0,
                    metadata: { error: String(error) },
                    created_at: new Date()
                });
            }
        }
        
        // Save logs
        await this.saveLogs(logs);
        
        return logs;
    }
    
    private async ingestCharacters(content: SourceContent, universeId: string): Promise<void> {
        const characters = content.metadata?.characters || [];
        
        for (const char of characters) {
            const match = await this.deduplicator.findDuplicateCharacter(char.name, universeId);
            
            if (match && match.confidence > 0.7) {
                continue; // Skip existing character
            }
            
            const characterData = {
                universe_id: universeId,
                slug: this.generateSlug(char.name),
                name: char.name,
                description: char.description,
                image_url: char.image_url,
                role: char.role || 'supporting',
                aliases: char.aliases || []
            };
            
            await this.supabase.from('characters').insert(characterData);
        }
    }
    
    private async ingestReleases(content: SourceContent, universeId: string): Promise<void> {
        const releases = content.metadata?.releases || [];
        
        for (const release of releases) {
            const match = await this.deduplicator.findDuplicateRelease(release.title, universeId);
            
            if (match && match.confidence > 0.7) {
                continue;
            }
            
            const releaseData = {
                universe_id: universeId,
                title: release.title,
                type: release.type || 'other',
                status: release.status || 'announced',
                description: release.description,
                release_date: release.release_date,
                cover_url: release.cover_url,
                external_url: release.external_url
            };
            
            await this.supabase.from('releases').insert(releaseData);
        }
    }
    
    protected generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
    }
    
    private async saveLogs(logs: IngestionLog[]): Promise<void> {
        if (logs.length === 0) return;
        
        await this.supabase.from('ingestion_logs').insert(logs);
    }
}