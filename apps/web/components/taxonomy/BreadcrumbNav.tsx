'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Breadcrumb {
    name: string;
    slug: string;
    type: string;
}

interface BreadcrumbNavProps {
    taxonomyType: 'category' | 'subcategory' | 'genre';
    taxonomyId: string;
}

export function BreadcrumbNav({ taxonomyType, taxonomyId }: BreadcrumbNavProps) {
    const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
    
    useEffect(() => {
        fetchBreadcrumbs();
    }, [taxonomyType, taxonomyId]);
    
    const fetchBreadcrumbs = async () => {
        const response = await fetch(`/api/taxonomy?type=breadcrumbs&breadcrumbType=${taxonomyType}&id=${taxonomyId}`);
        const { data } = await response.json();
        setBreadcrumbs(data || []);
    };
    
    if (breadcrumbs.length === 0) return null;
    
    return (
        <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/" className="hover:text-white transition">
                Home
            </Link>
            
            {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-2">
                    <span>/</span>
                    {index === breadcrumbs.length - 1 ? (
                        <span className="text-white font-medium">{crumb.name}</span>
                    ) : (
                        <Link 
                            href={`/${crumb.type}/${crumb.slug}`}
                            className="hover:text-white transition"
                        >
                            {crumb.name}
                        </Link>
                    )}
                </div>
            ))}
        </nav>
    );
}