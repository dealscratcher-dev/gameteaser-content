// packages/db/database.types.ts
// ─────────────────────────────────────────────────────────────────────────────
// Generated from your Supabase schema.
// To regenerate from a live project run:
//   npx supabase gen types typescript --project-id <YOUR_PROJECT_ID> \
//     --schema public > packages/db/database.types.ts
// ─────────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ── Enums ─────────────────────────────────────────────────────────────────────
// Verify exact values against your Supabase dashboard → Database → Enums
export type UniverseGenre =
  | "anime"
  | "comics"
  | "games"
  | "movies"
  | "series"
  | "sports"
  | "other";

export type ReleaseType =
  | "game"
  | "movie"
  | "series"
  | "dlc"
  | "update"
  | "other";

export type ReleaseStatus = "announced" | "released" | "cancelled" | "tba";

export type EntityType =
  | "universe"
  | "character"
  | "release"
  | "news"
  | "event";

export type InteractionType = "view" | "like" | "share" | "click" | "bookmark";

// ── Database ──────────────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      // ── users ──────────────────────────────────────────────────────────────
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          bio: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          bio?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          display_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          preferences?: Json;
          updated_at?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };

      // ── universes ──────────────────────────────────────────────────────────
      universes: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          cover_url: string | null;
          genre: UniverseGenre;
          tags: string[];
          follower_count: number;
          character_count: number;
          release_count: number;
          fts: unknown | null; // tsvector – use .textSearch() to query
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          cover_url?: string | null;
          genre: UniverseGenre;
          tags?: string[];
          follower_count?: number;
          character_count?: number;
          release_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          cover_url?: string | null;
          genre?: UniverseGenre;
          tags?: string[];
          follower_count?: number;
          character_count?: number;
          release_count?: number;
          updated_at?: string;
        };
        Relationships: [];
      };

      // ── characters ─────────────────────────────────────────────────────────
      characters: {
        Row: {
          id: string;
          universe_id: string;
          slug: string;
          name: string;
          description: string | null;
          image_url: string | null;
          role: string | null;
          aliases: string[];
          like_count: number;
          fts: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          universe_id: string;
          slug: string;
          name: string;
          description?: string | null;
          image_url?: string | null;
          role?: string | null;
          aliases?: string[];
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          universe_id?: string;
          slug?: string;
          name?: string;
          description?: string | null;
          image_url?: string | null;
          role?: string | null;
          aliases?: string[];
          like_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "characters_universe_id_fkey";
            columns: ["universe_id"];
            referencedRelation: "universes";
            referencedColumns: ["id"];
          }
        ];
      };

      // ── releases ───────────────────────────────────────────────────────────
      releases: {
        Row: {
          id: string;
          universe_id: string;
          title: string;
          type: ReleaseType;
          status: ReleaseStatus;
          cover_url: string | null;
          description: string | null;
          release_date: string | null;
          external_url: string | null;
          view_count: number;
          bookmark_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          universe_id: string;
          title: string;
          type: ReleaseType;
          status: ReleaseStatus;
          cover_url?: string | null;
          description?: string | null;
          release_date?: string | null;
          external_url?: string | null;
          view_count?: number;
          bookmark_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          universe_id?: string;
          title?: string;
          type?: ReleaseType;
          status?: ReleaseStatus;
          cover_url?: string | null;
          description?: string | null;
          release_date?: string | null;
          external_url?: string | null;
          view_count?: number;
          bookmark_count?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "releases_universe_id_fkey";
            columns: ["universe_id"];
            referencedRelation: "universes";
            referencedColumns: ["id"];
          }
        ];
      };

      // ── news ───────────────────────────────────────────────────────────────
      news: {
        Row: {
          id: string;
          universe_id: string | null;
          author_id: string | null;
          title: string;
          slug: string;
          summary: string | null;
          content: string | null;
          cover_url: string | null;
          tags: string[];
          is_published: boolean;
          view_count: number;
          published_at: string | null;
          fts: unknown | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          universe_id?: string | null;
          author_id?: string | null;
          title: string;
          slug: string;
          summary?: string | null;
          content?: string | null;
          cover_url?: string | null;
          tags?: string[];
          is_published?: boolean;
          view_count?: number;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          universe_id?: string | null;
          author_id?: string | null;
          title?: string;
          slug?: string;
          summary?: string | null;
          content?: string | null;
          cover_url?: string | null;
          tags?: string[];
          is_published?: boolean;
          view_count?: number;
          published_at?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "news_universe_id_fkey";
            columns: ["universe_id"];
            referencedRelation: "universes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "news_author_id_fkey";
            columns: ["author_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      // ── bookmarks ──────────────────────────────────────────────────────────
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          entity_type: EntityType;
          entity_id: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          entity_type: EntityType;
          entity_id: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          entity_type?: EntityType;
          entity_id?: string;
          metadata?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "bookmarks_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };

      // ── character_likes ────────────────────────────────────────────────────
      character_likes: {
        Row: {
          id: string;
          user_id: string;
          character_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          character_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          character_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "character_likes_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "character_likes_character_id_fkey";
            columns: ["character_id"];
            referencedRelation: "characters";
            referencedColumns: ["id"];
          }
        ];
      };

      // ── universe_follows ───────────────────────────────────────────────────
      universe_follows: {
        Row: {
          id: string;
          user_id: string;
          universe_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          universe_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          universe_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "universe_follows_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "universe_follows_universe_id_fkey";
            columns: ["universe_id"];
            referencedRelation: "universes";
            referencedColumns: ["id"];
          }
        ];
      };

      // ── user_interactions ──────────────────────────────────────────────────
      user_interactions: {
        Row: {
          id: string;
          user_id: string | null;
          entity_type: EntityType;
          entity_id: string;
          interaction_type: InteractionType;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          entity_type: EntityType;
          entity_id: string;
          interaction_type: InteractionType;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          entity_type?: EntityType;
          entity_id?: string;
          interaction_type?: InteractionType;
          payload?: Json;
        };
        Relationships: [];
      };

      // ── raw_imports ────────────────────────────────────────────────────────
      raw_imports: {
        Row: {
          id: string;
          source: string;
          source_id: string;
          source_endpoint: string;
          payload: Json;
          payload_checksum: string | null;
          fetched_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: string;
          source_id: string;
          source_endpoint: string;
          payload: Json;
          payload_checksum?: string | null;
          fetched_at?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: string;
          source_id?: string;
          source_endpoint?: string;
          payload?: Json;
          payload_checksum?: string | null;
          fetched_at?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      // ── content_items ──────────────────────────────────────────────────────
      content_items: {
        Row: {
          id: string;
          source: string;
          source_id: string;
          type: "game" | "release" | "event" | "anime" | "comicon" | "article";
          status: "draft" | "in_review" | "published" | "rejected" | "archived";
          title: string;
          slug: string;
          summary: string | null;
          cover_url: string | null;
          release_date: string | null;
          platforms: string[];
          genres: string[];
          tags: string[];
          external_url: string | null;
          quality_score: number | null;
          source_payload: Json;
          review_notes: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
          featured: boolean | null;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          source: string;
          source_id: string;
          type: "game" | "release" | "event" | "anime" | "comicon" | "article";
          status?: "draft" | "in_review" | "published" | "rejected" | "archived";
          title: string;
          slug: string;
          summary?: string | null;
          cover_url?: string | null;
          release_date?: string | null;
          platforms?: string[];
          genres?: string[];
          tags?: string[];
          external_url?: string | null;
          quality_score?: number | null;
          source_payload?: Json;
          review_notes?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
          featured?: boolean | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          source?: string;
          source_id?: string;
          type?: "game" | "release" | "event" | "anime" | "comicon" | "article";
          status?: "draft" | "in_review" | "published" | "rejected" | "archived";
          title?: string;
          slug?: string;
          summary?: string | null;
          cover_url?: string | null;
          release_date?: string | null;
          platforms?: string[];
          genres?: string[];
          tags?: string[];
          external_url?: string | null;
          quality_score?: number | null;
          source_payload?: Json;
          review_notes?: string | null;
          published_at?: string | null;
          updated_at?: string;
          featured?: boolean | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };

      // ── content_reviews ────────────────────────────────────────────────────
      content_reviews: {
        Row: {
          id: string;
          content_id: string;
          reviewer_id: string | null;
          review_status: "needs_review" | "approved" | "rejected" | "needs_changes";
          notes: string | null;
          ai_summary: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_id: string;
          reviewer_id?: string | null;
          review_status: "needs_review" | "approved" | "rejected" | "needs_changes";
          notes?: string | null;
          ai_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_id?: string;
          reviewer_id?: string | null;
          review_status?: "needs_review" | "approved" | "rejected" | "needs_changes";
          notes?: string | null;
          ai_summary?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      // ── content_relations ──────────────────────────────────────────────────
      content_relations: {
        Row: {
          id: string;
          from_content_id: string;
          to_content_id: string;
          relation_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          from_content_id: string;
          to_content_id: string;
          relation_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          from_content_id?: string;
          to_content_id?: string;
          relation_type?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };

    Views: {
      // ── character_details ──────────────────────────────────────────────────
      character_details: {
        Row: {
          id: string | null;
          universe_id: string | null;
          slug: string | null;
          name: string | null;
          description: string | null;
          image_url: string | null;
          role: string | null;
          aliases: string[] | null;
          like_count: number | null;
          fts: unknown | null;
          created_at: string | null;
          updated_at: string | null;
          universe_name: string | null;
          universe_slug: string | null;
          universe_genre: UniverseGenre | null;
        };
      };

      // ── universe_cards ─────────────────────────────────────────────────────
      universe_cards: {
        Row: {
          id: string | null;
          slug: string | null;
          name: string | null;
          description: string | null;
          cover_url: string | null;
          genre: UniverseGenre | null;
          tags: string[] | null;
          follower_count: number | null;
          character_count: number | null;
          release_count: number | null;
          created_at: string | null;
        };
      };

      // ── news_feed ──────────────────────────────────────────────────────────
      news_feed: {
        Row: {
          id: string | null;
          universe_id: string | null;
          author_id: string | null;
          title: string | null;
          slug: string | null;
          summary: string | null;
          content: string | null;
          cover_url: string | null;
          tags: string[] | null;
          is_published: boolean | null;
          view_count: number | null;
          published_at: string | null;
          fts: unknown | null;
          created_at: string | null;
          updated_at: string | null;
          universe_name: string | null;
          universe_slug: string | null;
          author_username: string | null;
          author_display_name: string | null;
          author_avatar_url: string | null;
        };
      };
    };

    Functions: Record<string, never>;

    Enums: {
      universe_genre: UniverseGenre;
      release_type: ReleaseType;
      release_status: ReleaseStatus;
      entity_type: EntityType;
      interaction_type: InteractionType;
    };
  };
}

// ── Convenience aliases ───────────────────────────────────────────────────────
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Inserts<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type Updates<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Views<T extends keyof Database["public"]["Views"]> =
  Database["public"]["Views"][T]["Row"];

// Named row types
export type UserRow            = Tables<"users">;
export type UniverseRow        = Tables<"universes">;
export type CharacterRow       = Tables<"characters">;
export type ReleaseRow         = Tables<"releases">;
export type NewsRow            = Tables<"news">;
export type BookmarkRow        = Tables<"bookmarks">;
export type CharacterLikeRow   = Tables<"character_likes">;
export type UniverseFollowRow  = Tables<"universe_follows">;
export type UserInteractionRow = Tables<"user_interactions">;
export type RawImportRow       = Tables<"raw_imports">;
export type ContentItemRow     = Tables<"content_items">;
export type ContentReviewRow   = Tables<"content_reviews">;
export type ContentRelationRow = Tables<"content_relations">;

// Named view types
export type CharacterDetailView = Views<"character_details">;
export type UniverseCardView    = Views<"universe_cards">;
export type NewsFeedView        = Views<"news_feed">;