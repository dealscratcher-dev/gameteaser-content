// lib/graph/relationships.ts
export type RelationType = 'similar' | 'co-view' | 'author';

export interface Relation {
  sourceId: string;
  targetId: string;
  type: RelationType;
  /** Deterministic weight for ordering – higher means stronger relation */
  weight: number;
}

/**
 * Create a deterministic Relation object.
 * If weight is omitted a simple hash based on the IDs and type is generated.
 */
export function makeRelation(
  sourceId: string,
  targetId: string,
  type: RelationType,
  weight?: number
): Relation {
  const w = weight ?? hashRelation(sourceId, targetId, type);
  return { sourceId, targetId, type, weight: w };
}

/**
 * Simple deterministic hash (FNV‑1a) that returns a positive 32‑bit integer.
 * Suitable for use as a stable primary‑key weight in PostgreSQL.
 */
export function hashRelation(sourceId: string, targetId: string, type: string): number {
  let hash = 0x811c9dc5; // FNV offset basis
  const data = `${sourceId}|${targetId}|${type}`;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0; // FNV prime, keep 32‑bit unsigned
  }
  return hash;
}
