'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { RelatedUniverse } from '@/lib/graph/knowledgeGraph';

interface RelatedUniversesProps {
    universeId: string;
    limit?: number;
    onSelect?: (universeId: string) => void;
}

export function RelatedUniverses({ universeId, limit = 6, onSelect }: RelatedUniversesProps) {
    const [universes, setUniverses] = useState<RelatedUniverse[]>([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        fetchRelated();
    }, [universeId]);
    
    const fetchRelated = async () => {
        setLoading(true);
        const response = await fetch(`/api/graph/related/${universeId}?limit=${limit}`);
        const { data } = await response.json();
        setUniverses(data || []);
        setLoading(false);
    };
    
    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-800 rounded-lg p-4 animate-pulse">
                        <div className="h-32 bg-gray-700 rounded mb-3"></div>
                        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }
    
    if (universes.length === 0) {
        return (
            <div className="text-center text-gray-400 py-8">
                No related universes found yet. Be the first to add a connection!
            </div>
        );
    }
    
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {universes.map((universe) => (
                <Link
                    key={universe.universe_id}
                    href={`/universe/${universe.universe_slug}`}
                    onClick={() => onSelect?.(universe.universe_id)}
                    className="group block bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-all"
                >
                    <div className="p-4">
                        <h3 className="font-semibold text-lg group-hover:text-blue-400 transition">
                            {universe.universe_name}
                        </h3>
                        
                        <div className="mt-2 flex items-center gap-2">
                            {universe.relationship_type && (
                                <span className="text-xs px-2 py-1 bg-blue-600/20 text-blue-400 rounded-full">
                                    {universe.relationship_type.replace('_', ' ')}
                                </span>
                            )}
                            <span className="text-xs text-gray-400">
                                {Math.round(universe.similarity * 100)}% match
                            </span>
                        </div>
                        
                        <p className="text-xs text-gray-400 mt-2">
                            {universe.reason}
                        </p>
                    </div>
                </Link>
            ))}
        </div>
    );
}