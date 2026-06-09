// apps/web/components/taxonomy/TaxonomyGrid.tsx
import React from 'react';
import Link from 'next/link';

export interface TaxonomyItem {
  id: string;
  name: string;
  imageUrl: string;
  href?: string;
}

interface Props {
  items: TaxonomyItem[];
}

/**
 * Responsive grid displaying taxonomy items.
 * Uses CSS Grid with glassmorphism background and subtle hover lift.
 */
const TaxonomyGrid: React.FC<Props> = ({ items }) => {
  return (
    <div className="grid gap-6 auto-rows-fr sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {items.map((item) => (
        <Link key={item.id} href={item.href ?? `/taxonomy/${item.id}`}>
          <a className="relative block p-4 rounded-xl bg-white/10 backdrop-blur-sm transition-transform hover:scale-[1.03] hover:shadow-xl overflow-hidden shadow-md">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-48 object-cover rounded-md mb-3"
            />
            <h3 className="text-lg font-medium text-white text-center truncate">
              {item.name}
            </h3>
          </a>
        </Link>
      ))}
    </div>
  );
};

export default TaxonomyGrid;
