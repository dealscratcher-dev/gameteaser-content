export interface UserProgression {
    user_id: string;
    level: number;
    total_xp: number;
    current_level_xp: number;
    next_level_xp: number;
    prestige_level: number;
    title: string;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    category: 'explorer' | 'social' | 'collector' | 'mastery';
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
    xp_reward: number;
    badge_icon: string;
    badge_color: string;
    condition_type: string;
    condition_value: number;
    hidden: boolean;
}

export interface UserAchievement {
    user_id: string;
    achievement_id: string;
    progress: number;
    completed: boolean;
    completed_at: Date | null;
    claimed_reward: boolean;
}

export interface UserStreak {
    user_id: string;
    current_streak: number;
    longest_streak: number;
    last_activity_date: Date;
    streak_frozen: boolean;
    streak_freezes_available: number;
    weekly_streak: number;
    monthly_streak: number;
}

export interface Collectible {
    id: string;
    name: string;
    description: string;
    category: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary' | 'mythic';
    image_url: string;
    unlock_condition: string;
    tradeable: boolean;
}

export interface UserCollectible {
    user_id: string;
    collectible_id: string;
    acquired_at: Date;
    display_in_gallery: boolean;
}

export interface XPActivity {
    id: string;
    user_id: string;
    action_type: string;
    xp_amount: number;
    source_type: string;
    source_id: string;
    created_at: Date;
}

/**
 * Derived level info used by LevelProgress.tsx.
 * Compute this from UserProgression + xp helpers before passing to the component.
 */
export interface LevelInfo {
  /** Current level number */
  level: number;
  /** XP accumulated within the current level */
  levelXP: number;
  /** Total XP required to complete the current level */
  levelXPRequired: number;
  /** Progress fraction 0–1 (levelXP / levelXPRequired) */
  progress: number;
  /** True when the user has hit the level cap */
  isMaxLevel: boolean;
}
