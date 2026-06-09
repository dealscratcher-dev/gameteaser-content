import { createClient } from '@supabase/supabase-js';
import { IGDBIngester } from './igdb';
import { TMDBIngester } from './tmdb';
import { AniListIngester } from './anilist';
import { Deduplicator } from './dedupe';
import { IngestionJob, IngestionLog } from './types';

export class IngestionPipeline {
    private igdb: IGDBIngester;
    private tmdb: TMDBIngester;
    private anilist: AniListIngester;
    private deduplicator: Deduplicator;
    private supabase;
    
    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
        this.igdb = new IGDBIngester(supabaseUrl, supabaseKey);
        this.tmdb = new TMDBIngester(supabaseUrl, supabaseKey);
        this.anilist = new AniListIngester(supabaseUrl, supabaseKey);
        this.deduplicator = new Deduplicator(supabaseUrl, supabaseKey);
    }
    
    async runFullIngestion(options?: {
        sources?: ('igdb' | 'tmdb' | 'anilist')[];
        limit?: number;
    }): Promise<IngestionJob[]> {
        const sources = options?.sources || ['igdb', 'tmdb', 'anilist'];
        const limit = options?.limit || 100;
        
        const jobs: IngestionJob[] = [];
        
        for (const source of sources) {
            const jobId = crypto.randomUUID();
            const job: IngestionJob = {
                id: jobId,
                source_type: source,
                status: 'running',
                total_items: limit,
                processed_items: 0,
                created_at: new Date()
            };
            
            jobs.push(job);
            await this.saveJob(job);
            
            try {
                let logs: IngestionLog[] = [];
                
                switch (source) {
                    case 'igdb':
                        logs = await this.igdb.ingestUniverses(limit);
                        break;
                    case 'tmdb':
                        logs = await this.tmdb.ingestUniverses(limit);
                        break;
                    case 'anilist':
                        logs = await this.anilist.ingestUniverses(limit);
                        break;
                }
                
                job.status = 'completed';
                job.processed_items = logs.length;
                job.completed_at = new Date();
                await this.saveJob(job);
                
                console.log(`✅ Ingestion from ${source} completed: ${logs.length} items processed`);
                
            } catch (error) {
                job.status = 'failed';
                job.error = String(error);
                job.completed_at = new Date();
                await this.saveJob(job);
                
                console.error(`❌ Ingestion from ${source} failed:`, error);
            }
        }
        
        // Run deduplication after all sources
        await this.runDeduplication();
        
        return jobs;
    }
    
    async runDeduplication(): Promise<void> {
        console.log('🔍 Running deduplication...');
        
        // Find potential duplicates
        const { data: universes } = await this.supabase
            .from('universes')
            .select('id, name');
        
        if (!universes) return;
        
        const duplicates: Map<string, string[]> = new Map();
        
        for (let i = 0; i < universes.length; i++) {
            for (let j = i + 1; j < universes.length; j++) {
                const u1 = universes[i];
                const u2 = universes[j];
                
                const similarity = this.calculateSimilarity(u1.name, u2.name);
                
                if (similarity > 0.85) {
                    // Potential duplicate
                    const primary = u1.name.length >= u2.name.length ? u1.id : u2.id;
                    const duplicate = primary === u1.id ? u2.id : u1.id;
                    
                    if (!duplicates.has(primary)) {
                        duplicates.set(primary, []);
                    }
                    duplicates.get(primary)!.push(duplicate);
                }
            }
        }
        
        // Merge duplicates
        for (const [primary, duplicatesList] of duplicates) {
            console.log(`Merging ${duplicatesList.length} duplicates into ${primary}`);
            await this.deduplicator.mergeDuplicates(primary, duplicatesList);
        }
        
        console.log('✅ Deduplication completed');
    }
    
    private calculateSimilarity(str1: string, str2: string): number {
        const s1 = str1.toLowerCase();
        const s2 = str2.toLowerCase();
        
        if (s1 === s2) return 1.0;
        if (s1.includes(s2) || s2.includes(s1)) return 0.9;
        
        // Simple word overlap
        const words1 = new Set(s1.split(' '));
        const words2 = new Set(s2.split(' '));
        const intersection = new Set([...words1].filter(x => words2.has(x)));
        
        return intersection.size / Math.max(words1.size, words2.size);
    }
    
    private async saveJob(job: IngestionJob): Promise<void> {
        await this.supabase
            .from('ingestion_jobs')
            .upsert(job);
    }
}