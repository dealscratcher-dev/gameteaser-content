// apps/web/types/api.ts
/**
 * Shared request/response DTOs for the web API layer.
 * These are used by the `fetch` helpers in the client code and by
 * server‑side route handlers.
 */

/** Pagination parameters used by most list endpoints. */
export interface PaginationParams {
  /** Zero‑based page index */
  page?: number;
  /** Number of items per page */
  limit?: number;
}

/** Generic paginated response envelope. */
export interface PaginatedResponse<T> {
  /** Total number of items across all pages */
  total: number;
  /** Current page index */
  page: number;
  /** Items for this page */
  items: T[];
}

/** Standard error payload returned by API routes. */
export interface ApiError {
  /** HTTP status code */
  status: number;
  /** Short machine‑readable error code */
  code: string;
  /** Human‑readable message */
  message: string;
}
