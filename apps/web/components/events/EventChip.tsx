// apps/web/components/events/EventChip.tsx
import React from 'react';

type Color = 'gray' | 'blue' | 'green' | 'red' | 'purple';

interface Props {
  label: string;
  color?: Color;
  onClick?: () => void;
}

/**
 * Small badge used to display a tag or category for an event.
 * Uses a glass‑morphism background with a subtle lift on hover.
 */
export const EventChip: React.FC<Props> = ({ label, color = 'gray', onClick }) => {
  const bgClasses = {
    gray: 'bg-white/10 text-white',
    blue: 'bg-blue-500/20 text-blue-200',
    green: 'bg-green-500/20 text-green-200',
    red: 'bg-red-500/20 text-red-200',
    purple: 'bg-purple-500/20 text-purple-200',
  }[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-sm font-medium transition-transform hover:scale-105 hover:shadow-lg ${bgClasses}`}
    >
      {label}
    </button>
  );
};

export default EventChip;
