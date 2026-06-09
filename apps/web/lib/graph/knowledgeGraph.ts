import { createClient } from '@supabase/supabase-js';
import * as redis from '@/lib/redis';

export interface UniverseNode {
    id: string;
    name: string;
    slug: string;
    cover_url: string | null;
    genre: string;
    similarity_score?: number;
    depth?: number;
    path?: string[];
    node_id?: string;
    node_name?: string;
    node_genre?: string;
}

export interface RelatedUniverse {
    universe_id: string;
    universe_slug: string;
    universe_name: string;
    relationship_type?: string;
    similarity: number;
    reason?: string;
}

export interface Relationship {
    source_id: string;
    target_id: string;
    relationship_type: string;
    weight: number;
    confidence: number;
}

export class KnowledgeGraph {
    private supabase;

    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }

    async getUniverseGraph(
        universeId: string,
        depth: number = 2,
        limit: number = 50
    ): Promise<UniverseNode[]> {
        const cacheKey = `graph:${universeId}:depth${depth}`;

        const cached = await redis.get<UniverseNode[]>(cacheKey);
        if (cached) return cached;

        const { data, error } = await this.supabase.rpc('get_universe_graph', {
            p_universe_id: universeId,
            p_depth: depth,
            p_limit: limit
        });

        if (error) throw error;

        await redis.set(cacheKey, data, 3600);

        return data as UniverseNode[];
    }

    async getRelatedUniverses(
        universeId: string,
        limit: number = 10,
        minSimilarity: number = 0.2
    ): Promise<RelatedUniverse[]> {
        const cacheKey = `related:${universeId}`;

        const cached = await redis.get<RelatedUniverse[]>(cacheKey);
        if (cached) return cached;

        const { data, error } = await this.supabase.rpc('get_related_universes_graph', {
            p_universe_id: universeId,
            p_limit: limit,
            p_min_similarity: minSimilarity
        });

        if (error) throw error;

        const mapped = (data as Record<string, unknown>[] ?? []).map((row) => ({
            universe_id: String(row.universe_id ?? row.id ?? row.node_id ?? ''),
            universe_slug: String(row.universe_slug ?? row.slug ?? ''),
            universe_name: String(row.universe_name ?? row.name ?? row.node_name ?? ''),
            relationship_type: row.relationship_type ? String(row.relationship_type) : undefined,
            similarity: Number(row.similarity ?? row.similarity_score ?? 0),
            reason: row.reason ? String(row.reason) : undefined,
        }));

        await redis.set(cacheKey, mapped, 21600);

        return mapped;
    }

    async findPath(
        startId: string,
        endId: string,
        maxDepth: number = 5
    ): Promise<{
        path: string[];
        pathNames: string[];
        totalWeight: number;
        steps: number;
    } | null> {
        const cacheKey = `path:${startId}:${endId}`;

        const cached = await redis.get<{
            path: string[];
            pathNames: string[];
            totalWeight: number;
            steps: number;
        }>(cacheKey);
        if (cached) return cached;

        const { data, error } = await this.supabase.rpc('find_universe_path', {
            p_start_id: startId,
            p_end_id: endId,
            p_max_depth: maxDepth
        });

        if (error) throw error;

        if (data && data.length > 0) {
            await redis.set(cacheKey, data[0], 86400);
            return data[0];
        }

        return null;
    }

    async addConnection(
        sourceId: string,
        targetId: string,
        relationshipType: string,
        userId: string,
        confidence: number = 0.5
    ): Promise<string> {
        const { data, error } = await this.supabase.rpc('add_universe_connection', {
            p_source_id: sourceId,
            p_target_id: targetId,
            p_relationship_type: relationshipType,
            p_user_id: userId,
            p_confidence: confidence
        });

        if (error) throw error;

        await this.invalidateUniverseCache(sourceId);
        await this.invalidateUniverseCache(targetId);

        return data;
    }

    async voteOnRelationship(
        relationshipId: string,
        userId: string,
        vote: boolean,
        confidence: number = 0.5
    ): Promise<void> {
        const { error } = await this.supabase
            .from('relationship_votes')
            .upsert({
                relationship_id: relationshipId,
                user_id: userId,
                vote: vote,
                confidence: confidence
            });

        if (error) throw error;

        await this.supabase.rpc('update_relationship_weight', {
            p_relationship_id: relationshipId
        });
    }

    async getSimilarityMatrix(universeId?: string): Promise<Record<string, unknown>[]> {
        let query = this.supabase
            .from('universe_similarity_matrix')
            .select('*')
            .order('similarity_score', { ascending: false });

        if (universeId) {
            query = query.or(`universe_a.eq.${universeId},universe_b.eq.${universeId}`);
        }

        const { data, error } = await query.limit(100);

        if (error) throw error;
        return data ?? [];
    }

    async getRelationshipStats(universeId: string): Promise<{
        totalConnections: number;
        averageWeight: number;
        byType: Record<string, number>;
        topRelated: RelatedUniverse[];
    }> {
        const { data: relationships, error } = await this.supabase
            .from('universe_relationships')
            .select(`
                *,
                target:target_universe_id (id, name, slug, cover_url),
                source:source_universe_id (id, name, slug, cover_url)
            `)
            .or(`source_universe_id.eq.${universeId},target_universe_id.eq.${universeId}`);

        if (error) throw error;

        const byType: Record<string, number> = {};
        let totalWeight = 0;

        relationships?.forEach((rel: { relationship_type: string; weight: number }) => {
            const type = rel.relationship_type;
            byType[type] = (byType[type] || 0) + 1;
            totalWeight += rel.weight;
        });

        const topRelated = await this.getRelatedUniverses(universeId, 10);

        return {
            totalConnections: relationships?.length || 0,
            averageWeight: relationships?.length ? totalWeight / relationships.length : 0,
            byType,
            topRelated
        };
    }

    private async invalidateUniverseCache(universeId: string): Promise<void> {
        const patterns = [
            `graph:${universeId}:*`,
            `related:${universeId}`,
            `path:*${universeId}*`
        ];

        for (const pattern of patterns) {
            const keyList = await redis.keys(pattern);
            if (keyList.length > 0) {
                await redis.del(...keyList);
            }
        }
    }

    async refreshSimilarityMatrix(): Promise<void> {
        await this.supabase.rpc('refresh_universe_similarity');

        const keyList = await redis.keys('graph:*');
        if (keyList.length > 0) {
            await redis.del(...keyList);
        }
    }
}

export function formatForD3Visualization(nodes: UniverseNode[], relationships: Relationship[]) {
    const formattedNodes = nodes.map(node => ({
        id: node.id,
        name: node.name,
        genre: node.genre,
        size: node.similarity_score ? 10 + (node.similarity_score * 20) : 10
    }));

    const formattedLinks = relationships.map(rel => ({
        source: rel.source_id,
        target: rel.target_id,
        weight: rel.weight,
        type: rel.relationship_type
    }));

    return { nodes: formattedNodes, links: formattedLinks };
}
