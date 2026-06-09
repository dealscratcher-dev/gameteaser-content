export interface SeasonEvent {
  id: string;
  vertical: "games" | "anime" | "comicon";
  title: string;
  subtitle: string;
  start: string;
  end: string;
  rewards: string[];
  panelKey?: "codm" | "pubg";
}

export interface PlayerCard {
  id: string;
  name: string;
  role: string;
  vertical: string;
  franchise: string;
  eventId: string;
  tagline: string;
  holo: string[];
  glyph: string;
}

export const SEASON_EVENTS: SeasonEvent[] = [
  {
    id: "codm-s5",
    vertical: "games",
    title: "COD Mobile — Season 5 Revenge",
    subtitle: "The Boys collab · Armored Royale · BAL-27",
    start: "2026-05-27T12:00:00",
    end: "2026-06-24T12:00:00",
    rewards: [
      "Mythic operator draw",
      "The Boys themed skins",
      "Battle Pass legendary tiers",
      "Armored Royale mode loot",
    ],
    panelKey: "codm",
  },
  {
    id: "pubg-a19",
    vertical: "games",
    title: "PUBG Mobile — Royale Pass A19",
    subtitle: "Olympian Academy · S30 Ranked · Scorpion 3D",
    start: "2026-05-16T00:00:00",
    end: "2026-07-15T23:59:59",
    rewards: [
      "Level 100 mythic set",
      "Scorpion elite skins",
      "3D lobby finishes",
      "UC rebate at max RP",
    ],
    panelKey: "pubg",
  },
  {
    id: "anime-summer-2026",
    vertical: "anime",
    title: "Summer 2026 simulcast peak",
    subtitle: "Major cour finales & movie window (estimate)",
    start: "2026-06-01T00:00:00",
    end: "2026-09-30T23:59:59",
    rewards: ["Finale episodes", "Movie premieres", "Manga volume drops"],
  },
  {
    id: "anime-one-arc",
    vertical: "anime",
    title: "Long-running shonen — arc climax season",
    subtitle: "Fan watch-parties · episode 1-hour specials",
    start: "2026-07-01T00:00:00",
    end: "2026-08-15T23:59:59",
    rewards: ["Special episodes", "OST releases", "Collab merch"],
  },
  {
    id: "sdcc-2026",
    vertical: "comicon",
    title: "San Diego Comic-Con 2026",
    subtitle: "Hall H · exclusives · cosplay peak",
    start: "2026-07-23T00:00:00",
    end: "2026-07-26T23:59:59",
    rewards: ["Badge days", "Exclusive drops", "Trailer reveals"],
  },
  {
    id: "nycc-2026",
    vertical: "comicon",
    title: "New York Comic Con 2026",
    subtitle: "Artist Alley · panels · gaming floor",
    start: "2026-10-09T00:00:00",
    end: "2026-10-12T23:59:59",
    rewards: ["Signing slots", "Funko drops", "Indie comic debuts"],
  },
  {
    id: "comic-india-2026",
    vertical: "comicon",
    title: "Comic Con India 2026",
    subtitle: "Cosplay championships · pop culture expo",
    start: "2026-11-01T00:00:00",
    end: "2026-11-03T23:59:59",
    rewards: ["Cosplay finals", "Anime zone", "Creator meetups"],
  },
];

export const PLAYER_CARDS: PlayerCard[] = [
  { id: "codm-voltage", name: "Voltage Striker", role: "Assault specialist", vertical: "games", franchise: "COD Mobile", eventId: "codm-s5", tagline: "Mythic draw chase", holo: ["#e85d24", "#ff8a57", "#6ee7ff"], glyph: "⚡" },
  { id: "codm-ghost", name: "Ivory Ghost", role: "Recon operator", vertical: "games", franchise: "COD Mobile", eventId: "codm-s5", tagline: "Legendary skin tier", holo: ["#c0c0c0", "#6ee7ff", "#a855f7"], glyph: "👤" },
  { id: "codm-reaper", name: "Reaper Unit", role: "Collab operator archetype", vertical: "games", franchise: "COD Mobile", eventId: "codm-s5", tagline: "Limited season only", holo: ["#ff4444", "#1a1a1a", "#ff6b2c"], glyph: "💀" },
  { id: "pubg-helm", name: "Yellow Helm", role: "Royale pass icon", vertical: "games", franchise: "PUBG Mobile", eventId: "pubg-a19", tagline: "A19 centerpiece skin", holo: ["#d4a017", "#f0c84a", "#fff3a0"], glyph: "🪖" },
  { id: "pubg-scorpion", name: "Desert Scorpion", role: "3D reward tier", vertical: "games", franchise: "PUBG Mobile", eventId: "pubg-a19", tagline: "Elite pass flex", holo: ["#b8860b", "#e85d24", "#14b8a6"], glyph: "🦂" },
  { id: "pubg-loot", name: "Loot King", role: "RP grinder", vertical: "games", franchise: "PUBG Mobile", eventId: "pubg-a19", tagline: "Weeklies or bust", holo: ["#5cb87a", "#d4a017", "#3b82f6"], glyph: "👑" },
  { id: "anime-crimson", name: "Crimson Hunter", role: "Finale-week protagonist", vertical: "anime", franchise: "Shonen simulcast", eventId: "anime-summer-2026", tagline: "Don't miss the last ep", holo: ["#ef4444", "#f97316", "#fde047"], glyph: "🔥" },
  { id: "anime-tide", name: "Tide Walker", role: "Fan-favorite rival", vertical: "anime", franchise: "Shonen simulcast", eventId: "anime-summer-2026", tagline: "Watch party hero", holo: ["#3b82f6", "#06b6d4", "#a855f7"], glyph: "🌊" },
  { id: "anime-mecha", name: "Nova Pilot", role: "Mecha cour lead", vertical: "anime", franchise: "Sci-fi anime", eventId: "anime-one-arc", tagline: "Arc climax incoming", holo: ["#6366f1", "#ec4899", "#22d3ee"], glyph: "🤖" },
  { id: "con-cosplay", name: "Cosplay Legend", role: "Convention floor icon", vertical: "comicon", franchise: "Global comic-cons", eventId: "sdcc-2026", tagline: "Hall cosplay day 3", holo: ["#a855f7", "#ec4899", "#f59e0b"], glyph: "✨" },
  { id: "con-panel", name: "Panel Host", role: "Hall H energy", vertical: "comicon", franchise: "SDCC", eventId: "sdcc-2026", tagline: "Trailer drop watch", holo: ["#f59e0b", "#ef4444", "#fff"], glyph: "🎤" },
  { id: "con-artist", name: "Artist Alley Star", role: "Indie creator", vertical: "comicon", franchise: "NYCC / regional cons", eventId: "nycc-2026", tagline: "Exclusive prints", holo: ["#10b981", "#3b82f6", "#f472b6"], glyph: "🎨" },
];

export function getEventById(id: string): SeasonEvent | undefined {
  return SEASON_EVENTS.find((e) => e.id === id);
}

export function getPlayerById(id: string): PlayerCard | undefined {
  return PLAYER_CARDS.find((p) => p.id === id);
}

export function getEventsByPanel(panelKey: "codm" | "pubg"): SeasonEvent[] {
  return SEASON_EVENTS.filter((e) => e.panelKey === panelKey);
}

export function getPlayersByEvent(eventId: string): PlayerCard[] {
  return PLAYER_CARDS.filter((p) => p.eventId === eventId);
}
