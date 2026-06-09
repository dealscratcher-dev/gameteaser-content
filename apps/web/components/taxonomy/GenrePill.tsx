'use client';

import Link from 'next/link';
import { Genre } from '@/lib/taxonomy/types';
import { cn } from '@/lib/utils';

interface GenrePillProps {
    genre: Genre;
    size?: 'sm' | 'md' | 'lg';
    onClick?: (genre: Genre) => void;
}

const SIZE_CLASSES = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
    lg: 'px-5 py-2 text-base',
};

export function GenrePill({ genre, size = 'md', onClick }: GenrePillProps) {
    return (
        <Link
            href={`/genre/${genre.slug}`}
            onClick={() => onClick?.(genre)}
            className={cn(
                'inline-flex items-center gap-2 rounded-full font-medium transition-all hover:scale-105',
                SIZE_CLASSES[size]
            )}
            style={{
                backgroundColor: `${genre.color}20`,
                color: genre.color,
                border: `1px solid ${genre.color}40`,
            }}
        >
            <span aria-hidden="true">{genre.icon}</span>
            {genre.name}
            {genre.count != null && (
                <span className="opacity-60 text-xs">({genre.count})</span>
            )}
        </Link>
    );
}
