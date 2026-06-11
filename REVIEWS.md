# Content Curation and Review Pipeline

This project implements a curated content ingestion pipeline. Instead of publishing third-party content (e.g. from IGDB) directly to the public website, items are ingested as **Drafts**, reviewed by admins, and then published.

Here is the step-by-step pipeline workflow:

```
+------------+        +---------------+        +------------------+        +--------------+
|  IGDB API  | -----> |  raw_imports  | -----> |  content_items   | -----> | Admin Review |
|            |        |               |        |  (status=draft)  |        |  Dashboard   |
+------------+        +---------------+        +------------------+        +--------------+
                                                                                  |
                                                                                  v
+------------+        +-----------------+                                  +--------------+
| Live Site  | <----- |  content_items  | <--------------------------------|   Approve!   |
|  Homepage  |        | (status=publ.)  |                                  +--------------+
+------------+        +-----------------+
```

---

## 1. Database Migrations

The database migration sets up the table structure for the pipeline:
- `raw_imports`: Holds the raw payload checksums and logs.
- `content_items`: Standardized items with a `status` field (`'draft'`, `'in_review'`, `'published'`, `'rejected'`, `'archived'`).
- `content_reviews`: History of admin approvals, rejections, or requested changes.
- `content_relations`: Relational mapping between items.

If you are setting up the project locally for the first time, apply the migration:
```bash
npx supabase migration up
# Or if utilizing local docker setup
supabase migration new content_review_pipeline
```
The migration is located at: `supabase/migrations/20260611000000_content_review_pipeline.sql`.

---

## 2. Ingesting IGDB Drafts

To fetch upcoming game releases from IGDB and store them as drafts, run the package script:
```bash
# Ingest 5 draft releases (default limit is 25)
pnpm --filter web ingest:igdb:drafts -- --limit 5

# Perform a dry run without saving to the database
pnpm --filter web ingest:igdb:drafts -- --dry-run --limit 2
```

Make sure your `apps/web/.env.local` contains the following environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `TWITCH_CLIENT_ID`
- `TWITCH_CLIENT_SECRET`

---

## 3. Reviewing Drafts in the Admin UI

Access the Admin Review dashboard at:
`http://localhost:3000/admin/review`

This interface retrieves all `draft` and `in_review` items. Curators can:
1. **Approve & Publish**: Changes status to `published` and sets `published_at = now()`. This moves the release live.
2. **Reject**: Marks status as `rejected` and removes it from the queue.
3. **Needs Changes**: Lets you add notes and keeps the status in drafts so the ingestion script won't overwrite it without attention.

---

## 4. Frontend Integration & Public API

- **Public Endpoint**: Exposes published content items at `/api/content?type=release&limit=10`. Drafts are strictly hidden.
- **Homepage Section**: The homepage (`/`) queries the database for published items. If there are no published releases in the database, the section falls back automatically to displaying static releases from `SEASON_EVENTS`.

---

## 5. Automated Daily Ingestion (via Supabase pg_cron)

You can trigger the ingestion automatically 3 times a day using Supabase Database Cron (`pg_cron`) sending an HTTP POST call to your Next.js API route `/api/ingest`.

### Env Setup
Add a `CRON_SECRET` variable in your hosting platform (e.g. Netlify) and your local `.env.local` to protect the endpoint:
```env
CRON_SECRET="YOUR_RANDOM_SECRET_KEY"
```

### SQL Cron Setup
Open your Supabase SQL Editor and execute the following queries:

* **For Deployed Site (Production)**:
  ```sql
  -- 1. Enable the pg_net extension to allow HTTP calls from postgres
  create extension if not exists pg_net;

  -- 2. Schedule the POST request to run 3 times a day (every 8 hours)
  select cron.schedule(
    'fetch-igdb-drafts-cron',
    '0 */8 * * *',
    $$ select net.http_post(
         'https://your-domain.netlify.app/api/ingest',
         '{}',
         '{}',
         '{"x-cron-secret": "YOUR_RANDOM_SECRET_KEY"}'
       ) $$
  );
  ```

* **For Local Supabase CLI / Docker**:
  If you are running Supabase locally via the CLI, the Docker container needs to refer to your host computer via `host.docker.internal`:
  ```sql
  select cron.schedule(
    'fetch-igdb-drafts-cron-local',
    '0 */8 * * *',
    $$ select net.http_post(
         'http://host.docker.internal:3000/api/ingest',
         '{}',
         '{}',
         '{"x-cron-secret": "YOUR_RANDOM_SECRET_KEY"}'
       ) $$
  );
  ```

### Manual testing on Localhost
You can manually test the local endpoint using `curl` from your terminal to trigger the ingestion logic immediately:
```bash
curl -X POST \
  -H "x-cron-secret: YOUR_RANDOM_SECRET_KEY" \
  http://localhost:3000/api/ingest
```
