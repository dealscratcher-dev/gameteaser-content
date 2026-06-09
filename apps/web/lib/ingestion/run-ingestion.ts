#!/usr/bin/env node

import { config } from 'dotenv';
import { IngestionPipeline } from '../../lib/ingestion/pipeline';

// Load environment variables
config({ path: '.env.local' });

async function main() {
    console.log('🚀 Starting data ingestion pipeline...\n');
    
    const pipeline = new IngestionPipeline(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const args = process.argv.slice(2);
    const sources = args.includes('--sources') 
        ? args[args.indexOf('--sources') + 1]?.split(',') as any
        : ['igdb', 'tmdb', 'anilist'];
    
    const limit = args.includes('--limit')
        ? parseInt(args[args.indexOf('--limit') + 1])
        : 100;
    
    console.log(`📋 Sources: ${sources.join(', ')}`);
    console.log(`📊 Limit per source: ${limit}\n`);
    
    const startTime = Date.now();
    
    const jobs = await pipeline.runFullIngestion({
        sources,
        limit
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n✨ Ingestion completed in ${duration}s`);
    console.log('📈 Summary:');
    
    for (const job of jobs) {
        const status = job.status === 'completed' ? '✅' : '❌';
        console.log(`   ${status} ${job.source_type}: ${job.processed_items} items (${job.status})`);
    }
}

main().catch(console.error);