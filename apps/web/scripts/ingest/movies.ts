// movies.ts – Ingest movies data from TMDB API and export as a constant
import fs from "fs";
import path from "path";

// Node 18+ global fetch – no need for node-fetch

interface Movie {
  id: number;
  title: string;
  poster: string;
  rating: number;
}

const TMDB_API_KEY = process.env.TMDB_API_KEY || "YOUR_TMDB_API_KEY";
const OUTPUT_PATH = path.resolve(process.cwd(), "public/data/movies.ts");

async function fetchMovies(): Promise<Movie[]> {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&sort_by=popularity.desc&include_adult=false&include_video=false&page=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB request failed: ${res.status}`);
  const data = await res.json();
  return data.results.map((m: any) => ({
    id: m.id,
    title: m.title,
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "",
    rating: m.vote_average,
  }));
}

(async () => {
  try {
    const movies = await fetchMovies();
    const fileContent = `export const movies = ${JSON.stringify(movies, null, 2)} as const;`;
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, fileContent, "utf-8");
    console.log(`✅ Movies data written to ${OUTPUT_PATH}`);
  } catch (e) {
    console.error("❌ Failed to fetch movies:", e);
    process.exit(1);
  }
})();
