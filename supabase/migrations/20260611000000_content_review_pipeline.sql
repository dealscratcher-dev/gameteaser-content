-- Content ingestion and review pipeline.
-- Upstream APIs such as IGDB land here first, then move to published content
-- only after review. This keeps third-party data out of the live site until
-- it has been curated.

create table if not exists public.raw_imports (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text not null,
  source_endpoint text not null,
  payload jsonb not null,
  payload_checksum text,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source, source_id, source_endpoint)
);

create index if not exists raw_imports_source_fetched_idx
  on public.raw_imports (source, fetched_at desc);

create table if not exists public.content_items (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  source_id text not null,
  type text not null check (type in ('game', 'release', 'event', 'anime', 'comicon', 'article')),
  status text not null default 'draft' check (status in ('draft', 'in_review', 'published', 'rejected', 'archived')),
  title text not null,
  slug text not null,
  summary text,
  cover_url text,
  release_date date,
  platforms text[] not null default '{}',
  genres text[] not null default '{}',
  tags text[] not null default '{}',
  external_url text,
  quality_score numeric(4, 3),
  source_payload jsonb not null default '{}'::jsonb,
  review_notes text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, source_id, type)
);

create index if not exists content_items_status_date_idx
  on public.content_items (status, release_date desc nulls last);

create index if not exists content_items_source_idx
  on public.content_items (source, source_id);

create index if not exists content_items_tags_gin_idx
  on public.content_items using gin (tags);

create table if not exists public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  content_id uuid not null references public.content_items(id) on delete cascade,
  reviewer_id uuid,
  review_status text not null check (review_status in ('needs_review', 'approved', 'rejected', 'needs_changes')),
  notes text,
  ai_summary text,
  created_at timestamptz not null default now()
);

create index if not exists content_reviews_content_created_idx
  on public.content_reviews (content_id, created_at desc);

create table if not exists public.content_relations (
  id uuid primary key default gen_random_uuid(),
  from_content_id uuid not null references public.content_items(id) on delete cascade,
  to_content_id uuid not null references public.content_items(id) on delete cascade,
  relation_type text not null,
  created_at timestamptz not null default now(),
  unique (from_content_id, to_content_id, relation_type)
);

alter table public.raw_imports enable row level security;
alter table public.content_items enable row level security;
alter table public.content_reviews enable row level security;
alter table public.content_relations enable row level security;

drop policy if exists "Published content is public" on public.content_items;
create policy "Published content is public"
  on public.content_items
  for select
  using (status = 'published');

-- Draft/review tables are intentionally service-role only by default.
-- Add authenticated admin policies later when the review UI has roles.
