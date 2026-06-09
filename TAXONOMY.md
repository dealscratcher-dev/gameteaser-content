# GameTeaser — Content taxonomy

## Verticals

| ID | Label | User intent |
|----|-------|-------------|
| `games` | Games | Battle pass FOMO, season resets, ranked splits, collab events |
| `anime` | Anime | Simulcast schedules, cour finales, movies, watch parties |
| `comicon` | Comics & Cons | Badge sales, cosplay, panels, artist alley, exclusives |

## Banner

- **File:** `assets/hero-banner.png`
- **Message:** Cross-franchise hype — mobile shooter operator + BR survivor + implied anime/con energy via site tags
- **Hero copy:** “What's ending soon?” — broad enough for all verticals

## Events (7)

See `data/content.js` → `events[]`. Each has `id`, `vertical`, `start`, `end`, `rewards[]`.

## Players (12 hologram cards)

See `data/content.js` → `players[]`. Original archetypes (not official IP).

| Vertical | Count | Examples |
|----------|-------|----------|
| games | 6 | Voltage Striker, Yellow Helm |
| anime | 3 | Crimson Hunter, Nova Pilot |
| comicon | 3 | Cosplay Legend, Panel Host |

## Engagement mechanics

- **Like** — stored in `localStorage` key `gtCardLikes`
- **Share** — Web Share API or clipboard; URL `/#player-{id}`
- **Filters** — All / Games / Anime / Comicon

## AI discovery

- `llms.txt` — full markdown index (llmstxt.org style)
- `llm.txt` — short pointer file
- `data/content.js` — structured JSON for parsers

## Adding content

1. Edit `data/content.js` — add event + optional player with `eventId`
2. Update `llms.txt` table
3. Redeploy to Netlify
