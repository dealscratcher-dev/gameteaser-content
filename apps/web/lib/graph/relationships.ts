// relationships.ts – utilities to retrieve and map entity relationships

export type EntityId = string | number;

export interface Relationship {
  from: EntityId;
  to: EntityId;
  type: string; // e.g., "friend", "related", "belongsTo"
}

/**
 * Fetch raw relationship data.
 * In a real project this would call a backend endpoint; here we provide a mock
 * implementation that reads a JSON file from `public/data/relationships.json`
 * if it exists.
 */
export async function fetchRelationships(): Promise<Relationship[]> {
  try {
    const resp = await fetch('/data/relationships.json');
    if (!resp.ok) throw new Error('Network response was not ok');
    const data = (await resp.json()) as Relationship[];
    return data;
  } catch (e) {
    // Fallback to an empty array – the UI can handle no relationships.
    console.warn('Failed to load relationships, returning empty list.', e);
    return [];
  }
}

/**
 * Build a adjacency map from an array of relationships.
 * Returns a map where the key is an entity id and the value is an array of
 * connected entity ids together with the relationship type.
 */
export function buildAdjacencyMap(
  rels: Relationship[]
): Map<EntityId, { to: EntityId; type: string }[]> {
  const map = new Map<EntityId, { to: EntityId; type: string }[]>();
  for (const { from, to, type } of rels) {
    if (!map.has(from)) map.set(from, []);
    map.get(from)!.push({ to, type });
    // optionally also create reverse link if needed
    if (!map.has(to)) map.set(to, []);
    map.get(to)!.push({ to: from, type: `reverse:${type}` });
  }
  return map;
}

/**
 * Get related entities for a given id.
 * The function accepts a pre‑built adjacency map for performance.
 */
export function getRelatedEntities(
  id: EntityId,
  adjacency: Map<EntityId, { to: EntityId; type: string }[]>
): { to: EntityId; type: string }[] {
  return adjacency.get(id) ?? [];
}
