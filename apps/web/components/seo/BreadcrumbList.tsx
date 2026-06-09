import Link from 'next/link';
import { BreadcrumbItem } from '@/lib/seo/types';
import { SchemaMarkup } from './SchemaMarkup';

interface BreadcrumbListProps {
    items: BreadcrumbItem[];
    className?: string;
}

export function BreadcrumbList({ items, className = '' }: BreadcrumbListProps) {
    const schema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': items.map((item, index) => ({
            '@type': 'ListItem',
            'position': item.position || index + 1,
            'name': item.name,
            'item': item.url
        }))
    };
    
    return (
        <>
            <SchemaMarkup data={schema} />
            <nav className={`flex items-center gap-2 text-sm ${className}`} aria-label="Breadcrumb">
                {items.map((item, index) => (
                    <div key={item.url} className="flex items-center gap-2">
                        {index > 0 && <span className="text-gray-500">/</span>}
                        {index === items.length - 1 ? (
                            <span className="text-gray-300 font-medium" aria-current="page">
                                {item.name}
                            </span>
                        ) : (
                            <Link href={item.url} className="text-gray-400 hover:text-white transition">
                                {item.name}
                            </Link>
                        )}
                    </div>
                ))}
            </nav>
        </>
    );
}