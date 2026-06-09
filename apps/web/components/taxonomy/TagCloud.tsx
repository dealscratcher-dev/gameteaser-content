'use client';

import Link from 'next/link';
import { TaxonomyTag } from '@/lib/taxonomy/types';

interface TagCloudProps {
    tags: TaxonomyTag[];
    minSize?: number;
    maxSize?: number;
    onTagClick?: (tag: TaxonomyTag) => void;
}

export function TagCloud({ tags, minSize = 12, maxSize = 32, onTagClick }: TagCloudProps) {
    const maxPopularity = Math.max(...tags.map(t => t.popularity_score), 1);
    const minPopularity = Math.min(...tags.map(t => t.popularity_score), 0);
    
    const getTagSize = (score: number): number => {
        const normalized = (score - minPopularity) / (maxPopularity - minPopularity);
        return minSize + normalized * (maxSize - minSize);
    };
    
    const categoryColors: Record<string, string> = {
        theme: 'text-blue-400',
        mechanic: 'text-green-400',
        mood: 'text-purple-400',
        setting: 'text-orange-400',
        feature: 'text-pink-400'
    };
    
    return (
        <div className="flex flex-wrap gap-3 justify-center p-6">
            {tags.map(tag => (
                <Link
                    key={tag.id}
                    href={`/tag/${tag.slug}`}
                    onClick={() => onTagClick?.(tag)}
                    style={{ fontSize: `${getTagSize(tag.popularity_score)}px` }}
                    className={`${categoryColors[tag.category]} hover:opacity-75 transition-all hover:scale-105 inline-block`}
                >
                    <span className="inline-flex items-center gap-1">
                        #{tag.name}
                        {tag.is_trending && (
                            <span className="text-xs bg-red-500/20 text-red-400 px-1 rounded">🔥</span>
                        )}
                    </span>
                </Link>
            ))}
        </div>
    );
}