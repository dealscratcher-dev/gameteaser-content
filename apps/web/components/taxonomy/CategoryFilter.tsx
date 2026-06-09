'use client';

import Link from 'next/link';
import { ContentCategory } from '@/lib/taxonomy/types';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
    categories: ContentCategory[];
    activeSlug?: string;
    onSelect?: (category: ContentCategory) => void;
    className?: string;
}

export function CategoryFilter({
    categories,
    activeSlug,
    onSelect,
    className,
}: CategoryFilterProps) {
    return (
        <div className={cn('flex flex-wrap gap-2', className)} role="list" aria-label="Filter by category">
            {categories.map((category) => {
                const isActive = activeSlug === category.slug;
                return (
                    <Link
                        key={category.id}
                        href={`/category/${category.slug}`}
                        onClick={() => onSelect?.(category)}
                        role="listitem"
                        className={cn(
                            'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                            isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                        )}
                    >
                        <span aria-hidden="true">{category.icon}</span>
                        {category.name}
                        {category.count != null && (
                            <span className="text-xs opacity-70">({category.count})</span>
                        )}
                    </Link>
                );
            })}
        </div>
    );
}
