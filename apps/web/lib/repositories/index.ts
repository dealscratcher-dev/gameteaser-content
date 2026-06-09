// apps/web/lib/repositories/index.ts
// Import from here instead of individual files

export { universesRepo }    from "./universes.repo";
export { charactersRepo }   from "./characters.repo";
export { bookmarksRepo }    from "./bookmarks.repo";
export { newsRepo }         from "./news.repo";
export { interactionsRepo } from "./interactions.repo";

export type { ListUniversesOptions }    from "./universes.repo";
export type { ListCharactersOptions }   from "./characters.repo";
export type { ListBookmarksOptions }    from "./bookmarks.repo";
export type { ListNewsOptions }         from "./news.repo";
export type {
  TrackInteractionInput,
  ListInteractionsOptions,
} from "./interactions.repo";
