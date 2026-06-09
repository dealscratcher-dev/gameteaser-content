'use client';

import { useState, useEffect } from 'react';
import { UserCollectible, Collectible } from '@/lib/gamification/types';

interface CollectiblesGalleryProps {
    userId: string;
}

export function CollectiblesGallery({ userId }: CollectiblesGalleryProps) {
    const [collectibles, setCollectibles] = useState<(UserCollectible & { collectibles: Collectible })[]>([]);
    const [selectedRarity, setSelectedRarity] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchCollectibles();
    }, [userId]);
    
    const fetchCollectibles = async () => {
        const response = await fetch(`/api/gamification/collectibles?userId=${userId}`);
        const data = await response.json();
        setCollectibles(data);
        setLoading(false);
    };
    
    const rarities = ['all', 'common', 'rare', 'epic', 'legendary', 'mythic'];
    const rarityColors: Record<string, string> = {
        common: 'border-gray-500',
        rare: 'border-blue-500',
        epic: 'border-purple-500',
        legendary: 'border-yellow-500',
        mythic: 'border-red-500'
    };
    
    const filtered = selectedRarity === 'all' 
        ? collectibles 
        : collectibles.filter(c => c.collectibles.rarity === selectedRarity);
    
    if (loading) {
        return (
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                        <div className="h-20 w-20 bg-gray-700 rounded-full mx-auto mb-3"></div>
                        <div className="h-3 bg-gray-700 rounded w-3/4 mx-auto"></div>
                    </div>
                ))}
            </div>
        );
    }
    
    return (
        <div>
            <div className="flex gap-2 mb-6">
                {rarities.map(rarity => (
                    <button
                        key={rarity}
                        onClick={() => setSelectedRarity(rarity)}
                        className={`px-3 py-1 rounded-full text-sm capitalize transition ${
                            selectedRarity === rarity
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                        }`}
                    >
                        {rarity}
                    </button>
                ))}
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                {filtered.map((item) => (
                    <div
                        key={item.collectible_id}
                        className={`bg-gray-800 rounded-lg p-4 text-center border-2 ${rarityColors[item.collectibles.rarity]} hover:scale-105 transition-transform`}
                    >
                        <div className="text-4xl mb-2">{item.collectibles.image_url ? '🖼️' : '🏆'}</div>
                        <div className="font-semibold text-sm truncate">{item.collectibles.name}</div>
                        <div className="text-xs text-gray-400 mt-1 capitalize">{item.collectibles.rarity}</div>
                        <div className="text-xs text-gray-500 mt-2">
                            {new Date(item.acquired_at).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
            
            {filtered.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    No collectibles yet. Keep exploring universes to unlock them!
                </div>
            )}
        </div>
    );
}