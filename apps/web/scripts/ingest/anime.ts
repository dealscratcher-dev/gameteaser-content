// apps/web/scripts/ingest/anime.ts
import * as fs from 'fs';
import * as path from 'path';

// Node.js 18+ has global fetch – no need for node-fetch

/**
 * Simple ingestion script for anime data.
 * It attempts to read a local JSON file at `data/anime.json`.
 * If the file does not exist, it falls back to the Jikan API
 * (https://api.jikan.moe/v4/top/anime) and writes the result to
 * `public/data/anime.ts` as an exported constant.
 */
async function loadLocal(): Promise<any[] | null> {
  const localPath = path.resolve(process.cwd(), 'data', 'anime.json');
  if (fs.existsSync(localPath)) {
    const raw = fs.readFileSync(localPath, 'utf-8');
    return JSON.parse(raw);
  }
  return null;
}

async function fetchRemote(): Promise<any[]> {
  const resp = await fetch('https://api.jikan.moe/v4/top/anime');
  const data = await resp.json();
  // Normalise to a minimal shape used by the front‑end
  return (data?.data || []).map((a: any) => ({
    id: a.mal_id,
    title: a.title,
    imageUrl: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url,
    score: a.score,
  }));
}

async function writeExport(items: any[]) {
  const destDir = path.resolve(process.cwd(), 'public', 'data');
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  const destFile = path.join(destDir, 'anime.ts');
  const content = `export const animeData = ${JSON.stringify(items, null, 2)} as const;\n`;
  fs.writeFileSync(destFile, content, 'utf-8');
  console.log(`✅ Wrote ${items.length} anime items to ${destFile}`);
}

(async () => {
  const local = await loadLocal();
  const items = local ?? (await fetchRemote());
  await writeExport(items);
})();
