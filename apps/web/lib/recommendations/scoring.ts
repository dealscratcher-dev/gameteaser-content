import { createClient } from '@supabase/supabase-js';
import * as redis from '@/lib/redis';

export class RecommendationScoring {
  private supabase;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async getUserRecommendations(userId: string, limit: number = 20) {
    const cacheKey = `recs:${userId}:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const explorationRate = await this.getExplorationRate(userId);

    const { data, error } = await this.supabase.rpc('get_user_recommendations', {
      p_user_id: userId,
      p_limit: limit,
      p_exploration_rate: explorationRate
    });

    if (error) throw error;

    await redis.set(cacheKey, data, 300);

    return data;
  }

  private async getExplorationRate(userId: string): Promise<number> {
    const stats = await redis.hgetall(`user:${userId}:stats`);

    if (!stats || !stats.totalInteractions) {
      return 0.5;
    }

    const totalInteractions = parseInt(stats.totalInteractions);
    const uniqueUniverses = parseInt(stats.uniqueUniverses || '0');

    if (totalInteractions < 10) return 0.5;
    if (uniqueUniverses < 5) return 0.3;
    if (totalInteractions > 100) return 0.1;
    return 0.2;
  }

  async trackInteraction(userId: string, entityType: string, entityId: string, interactionType: string) {
    await this.supabase.from('user_interactions').insert({
      user_id: userId,
      entity_type: entityType,
      entity_id: entityId,
      interaction_type: interactionType
    });

    await redis.hincrby(`user:${userId}:stats`, 'totalInteractions', 1);
    await redis.pfadd(`user:${userId}:unique_universes`, entityId);

    const cacheKeys = await redis.keys(`recs:${userId}:*`);
    if (cacheKeys.length > 0) {
      await redis.del(...cacheKeys);
    }
  }
}
