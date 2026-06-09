// apps/web/components/events/EventsTrack.tsx
import React from 'react';
import { EventChip } from './EventChip';

export interface EventItem {
  id: string;
  title: string;
  date: string; // ISO string
  description?: string;
  tags?: string[];
}

interface Props {
  events: EventItem[];
}

/**
 * A vertical track that displays a list of events with timestamps.
 * Each event is rendered with an optional set of `EventChip` tags.
 */
const EventsTrack: React.FC<Props> = ({ events }) => {
  // Sort events chronologically (newest first)
  const sorted = [...events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="relative border-l-2 border-white/20 ml-4">
      {sorted.map((event, idx) => (
        <div key={event.id} className="mb-8 pl-6 relative">
          {/* Circle indicator */}
          <span className="absolute -left-4 top-1 w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full shadow-md" />
          <div className="text-sm text-gray-400 mb-1">{new Date(event.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
          <h4 className="text-lg font-semibold text-white mb-2">{event.title}</h4>
          {event.description && <p className="text-gray-300 mb-2">{event.description}</p>}
          {event.tags && (
            <div className="flex flex-wrap gap-2">
              {event.tags.map((tag) => (
                <EventChip key={tag} label={tag} />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default EventsTrack;
