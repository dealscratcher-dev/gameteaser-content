'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { UserProgression, UserStreak, Achievement } from '@/lib/gamification/types';
import { AchievementNotification } from './AchievementNotification';

interface GamificationWidgetProps {
    compact?: boolean;
}

export function GamificationWidget({ compact = false }: GamificationWidgetProps) {
    const [userId, setUserId] = useState<string | null>(null);
    const [progression, setProgression] = useState<UserProgression | null>(null);
    const [streak, setStreak] = useState<UserStreak | null>(null);
    const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);

    useEffect(() => {
        const supabase = createBrowserSupabaseClient();

        supabase.auth.getUser().then(({ data: { user } }) => {
            setUserId(user?.id ?? null);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUserId(session?.user?.id ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (userId) {
            fetchStats();
        }
    }, [userId]);

    const fetchStats = async () => {
        const response = await fetch('/api/gamification?type=stats');
        const { data } = await response.json();
        setProgression(data?.progression ?? null);
        setStreak(data?.streak ?? null);

        if (data?.recent_achievements?.length > 0 && !recentAchievement) {
            setRecentAchievement(data.recent_achievements[0]);
            setTimeout(() => setRecentAchievement(null), 5000);
        }
    };

    if (!userId) return null;

    const xpPercent = progression
        ? (progression.current_level_xp / progression.next_level_xp) * 100
        : 0;

    if (compact) {
        return (
            <>
                <div className="flex items-center gap-3 bg-gray-800 rounded-full px-3 py-1">
                    <div className="flex items-center gap-1">
                        <span className="text-yellow-400">⭐</span>
                        <span className="text-sm font-semibold">{progression?.level || 1}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-600" />
                    <div className="flex items-center gap-1">
                        <span className="text-orange-400">🔥</span>
                        <span className="text-sm">{streak?.current_streak || 0}</span>
                    </div>
                    <div className="h-4 w-px bg-gray-600" />
                    <div className="w-16 bg-gray-700 rounded-full h-1.5">
                        <div
                            className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${xpPercent}%` }}
                        />
                    </div>
                </div>
                {recentAchievement && (
                    <AchievementNotification
                        achievement={recentAchievement}
                        onClose={() => setRecentAchievement(null)}
                    />
                )}
            </>
        );
    }

    return (
        <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <div className="text-sm text-gray-400">Level {progression?.level}</div>
                    <div className="text-2xl font-bold">{progression?.title || 'Explorer'}</div>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-400">Total XP</div>
                    <div className="text-xl font-bold">{progression?.total_xp?.toLocaleString()}</div>
                </div>
            </div>

            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Progress to Level {(progression?.level ?? 0) + 1}</span>
                    <span>{progression?.current_level_xp} / {progression?.next_level_xp} XP</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all"
                        style={{ width: `${xpPercent}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-around pt-4 border-t border-gray-700">
                <div className="text-center">
                    <div className="text-2xl">🔥</div>
                    <div className="text-sm font-semibold">{streak?.current_streak || 0}</div>
                    <div className="text-xs text-gray-400">Day Streak</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl">🏆</div>
                    <div className="text-sm font-semibold">{streak?.longest_streak || 0}</div>
                    <div className="text-xs text-gray-400">Best Streak</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl">⭐</div>
                    <div className="text-sm font-semibold">{progression?.prestige_level || 0}</div>
                    <div className="text-xs text-gray-400">Prestige</div>
                </div>
            </div>
        </div>
    );
}
