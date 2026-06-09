import { createClient } from '@supabase/supabase-js';
import { UserProgression, UserStreak, Achievement, UserAchievement } from './types';

export class GamificationEngine {
    private supabase;
    
    constructor(supabaseUrl: string, supabaseKey: string) {
        this.supabase = createClient(supabaseUrl, supabaseKey);
    }
    
    async trackAction(
        userId: string,
        action: string,
        metadata?: Record<string, any>
    ): Promise<{
        xp_gained: number;
        new_level?: number;
        achievements_unlocked: Achievement[];
        streak_updated: number;
        collectibles_unlocked: string[];
    }> {
        const result: {
            xp_gained: number;
            new_level?: number;
            achievements_unlocked: Achievement[];
            streak_updated: number;
            collectibles_unlocked: string[];
        } = {
            xp_gained: 0,
            achievements_unlocked: [],
            streak_updated: 0,
            collectibles_unlocked: [],
        };
        
        // 1. Award XP based on action
        const xpMap: Record<string, number> = {
            'view_universe': 5,
            'view_character': 3,
            'bookmark': 10,
            'follow': 15,
            'share': 20,
            'like': 5,
            'comment': 10,
            'daily_login': 25
        };
        
        const xpAmount = xpMap[action] || 1;
        
        if (xpAmount > 0) {
            const { data: xpResult } = await this.supabase.rpc('add_xp', {
                p_user_id: userId,
                p_amount: xpAmount,
                p_action_type: action,
                p_source_type: metadata?.source_type || null,
                p_source_id: metadata?.source_id || null,
                p_metadata: metadata || {}
            });
            result.xp_gained = xpAmount;
        }
        
        // 2. Update streak
        if (action === 'daily_login' || action === 'view_universe') {
            const { data: streak } = await this.supabase.rpc('update_streak', {
                p_user_id: userId
            });
            result.streak_updated = streak;
        }
        
        // 3. Check achievements
        const { data: achievements } = await this.supabase.rpc('check_achievements', {
            p_user_id: userId
        });
        
        if (achievements && achievements.length > 0) {
            const { data: achievementDetails } = await this.supabase
                .from('achievements')
                .select('*')
                .in('id', achievements.map((a: any) => a.achievement_id));
            
            result.achievements_unlocked = achievementDetails || [];
        }
        
        // 4. Check collectibles based on action
        if (action === 'view_universe' && metadata?.universe_slug) {
            const collectibleId = `${metadata.universe_slug}_collectible`;
            const { data: awarded } = await this.supabase.rpc('award_collectible', {
                p_user_id: userId,
                p_collectible_id: collectibleId,
                p_metadata: { unlocked_by: action, universe: metadata.universe_slug }
            });
            
            if (awarded) {
                result.collectibles_unlocked.push(collectibleId);
            }
        }
        
        // Check first visit collectible
        if (action === 'first_visit') {
            const { data: awarded } = await this.supabase.rpc('award_collectible', {
                p_user_id: userId,
                p_collectible_id: 'first_visit_badge',
                p_metadata: { unlocked_by: 'first_visit' }
            });
            
            if (awarded) {
                result.collectibles_unlocked.push('first_visit_badge');
            }
        }
        
        // 5. Check for level up
        const { data: progression } = await this.supabase
            .from('user_progression')
            .select('level')
            .eq('user_id', userId)
            .single();
        
        if (progression && progression.level > (metadata?.old_level || 0)) {
            result.new_level = progression.level;
        }
        
        return result;
    }
    
    async getUserStats(userId: string): Promise<{
        progression: UserProgression;
        streak: UserStreak;
        achievements: UserAchievement[];
        recent_achievements: Achievement[];
        top_collectibles: any[];
    }> {
        const [progression, streak, achievements, recentAchievements, collectibles] = await Promise.all([
            this.supabase.from('user_progression').select('*').eq('user_id', userId).single(),
            this.supabase.from('user_streaks').select('*').eq('user_id', userId).single(),
            this.supabase.from('user_achievements').select('*, achievements(*)').eq('user_id', userId).eq('completed', true),
            this.supabase.from('user_achievements')
                .select('*, achievements(*)')
                .eq('user_id', userId)
                .eq('completed', true)
                .order('completed_at', { ascending: false })
                .limit(5),
            this.supabase.from('user_collectibles')
                .select('*, collectibles(*)')
                .eq('user_id', userId)
                .eq('display_in_gallery', true)
                .order('acquired_at', { ascending: false })
                .limit(10)
        ]);
        
        return {
            progression: progression.data as UserProgression,
            streak: streak.data as UserStreak,
            achievements: achievements.data || [],
            recent_achievements: recentAchievements.data?.map((ua: any) => ua.achievements) || [],
            top_collectibles: collectibles.data || []
        };
    }
    
    async getLeaderboard(limit: number = 50): Promise<Array<UserProgression & { username: string }>> {
        const { data } = await this.supabase
            .from('user_progression')
            .select('*, users(username)')
            .order('level', { ascending: false })
            .order('total_xp', { ascending: false })
            .limit(limit);
        
        return data || [];
    }
    
    async getAchievementsProgress(userId: string): Promise<Array<Achievement & { progress: number; completed: boolean }>> {
        const { data: achievements } = await this.supabase
            .from('achievements')
            .select('*')
            .order('category')
            .order('xp_reward');
        
        const { data: userAchievements } = await this.supabase
            .from('user_achievements')
            .select('*')
            .eq('user_id', userId);
        
        const userMap = new Map();
        userAchievements?.forEach(ua => {
            userMap.set(ua.achievement_id, ua);
        });
        
        return achievements?.map(ach => ({
            ...ach,
            progress: userMap.get(ach.id)?.progress || 0,
            completed: userMap.get(ach.id)?.completed || false
        })) || [];
    }
}