// games.ts – Ingest games data from RAWG API and export as a constant
import fs from "fs";
import path from "path";

// Node 18+ global fetch – no need for node-fetch

interface Game {
  id: number;
  name: string;
  background_image: string;
  rating: number;
}

const RAWG_API_KEY = process.env.RAWG_API_KEY || "YOUR_RAWG_API_KEY";
const OUTPUT_PATH = path.resolve(process.cwd(), "public/data/games.ts");

async function fetchGames(): Promise<Game[]> {
  const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&ordering=-added&page_size=20`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`RAWG request failed: ${res.status}`);
  const data = await res.json();
  return data.results.map((g: any) => ({
    id: g.id,
    name: g.name,
    background_image: g.background_image || "",
    rating: g.rating,
  }));
}

(async () => {
  try {
    const games = await fetchGames();
    const fileContent = `export const games = ${JSON.stringify(games, null, 2)} as const;`;
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, fileContent, "utf-8");
    console.log(`✅ Games data written to ${OUTPUT_PATH}`);
  } catch (e) {
    console.error("❌ Failed to fetch games:", e);
    process.exit(1);
  }
})();
