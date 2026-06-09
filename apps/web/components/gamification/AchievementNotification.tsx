'use client';

import { useEffect, useState } from 'react';
import { Achievement } from '@/lib/gamification/types';

interface AchievementNotificationProps {
    achievement: Achievement;
    onClose?: () => void;
    duration?: number;
}

export function AchievementNotification({ achievement, onClose, duration = 5000 }: AchievementNotificationProps) {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onClose?.();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    if (!visible) return null;

    const rarityColors = {
        common: 'from-gray-500 to-gray-600',
        rare: 'from-blue-500 to-blue-600',
        epic: 'from-purple-500 to-purple-600',
        legendary: 'from-yellow-500 to-orange-500'
    };

    return (
        <div className="fixed top-20 right-4 z-50 animate-slide-in">
            <div className={`bg-gradient-to-r ${rarityColors[achievement.rarity]} rounded-lg shadow-xl p-4 max-w-sm`}>
                <div className="flex items-start gap-3">
                    <div className="text-4xl">{achievement.badge_icon}</div>
                    <div className="flex-1">
                        <div className="text-white font-bold text-sm">ACHIEVEMENT UNLOCKED!</div>
                        <div className="text-white font-semibold">{achievement.name}</div>
                        <div className="text-white/80 text-xs mt-1">{achievement.description}</div>
                        <div className="text-white/60 text-xs mt-2">+{achievement.xp_reward} XP</div>
                    </div>
                    <button onClick={() => setVisible(false)} className="text-white/60 hover:text-white">
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
}
