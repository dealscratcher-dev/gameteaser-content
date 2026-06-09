// apps/web/types/content.ts
/**
 * Core domain models for TheGameBit application.
 * All fields are designed to map directly to the PostgreSQL tables used
 * by the backend. Types are deliberately minimal yet extensible.
 */
export interface BaseEntity {
  id: string;
  createdAt: string; // ISO timestamp
  updatedAt: string;
}

export type ContentType = "universe" | "character" | "release" | "event";

export interface Universe extends BaseEntity {
  type: "universe";
  slug: string;
  name: string;
  tagline?: string;
  description?: string;
  coverImage?: string;
  genre: string[];
  fanCount: number;
  characterCount: number;
  releaseCount: number;
}

export interface Character extends BaseEntity {
  type: "character";
  slug: string;
  name: string;
  universeId: string;
  avatarUrl?: string;
  description?: string;
}

export interface Release extends BaseEntity {
  type: "release";
  slug: string;
  title: string;
  universeId: string;
  releaseDate?: string; // ISO date
  coverImage?: string;
  platform?: string[];
}

export interface Event extends BaseEntity {
  type: "event";
  slug: string;
  title: string;
  startDate: string; // ISO timestamp
  endDate?: string;
  location?: string;
  bannerUrl?: string;
}

/** Union type for any content item */
export type ContentItem = Universe | Character | Release | Event;
