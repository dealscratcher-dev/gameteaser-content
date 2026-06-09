# Redeploy GameTeaser to Netlify (fixes ads.txt + AdSense)

Your live site was broken because **Netlify's build step overwrote** `ads.txt` and `ads-config.js` with placeholder IDs every deploy. That is now fixed.

## Deploy in 2 minutes

### Option A — Netlify Drop (fastest)
1. Open [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Drag the entire **`game-season-timer`** folder from `Documents`
3. If it creates a new site, go to **Domain settings** and set **gameteaser.netlify.app** or update DNS

### Option B — Same Netlify site (Git / manual upload)
1. Netlify dashboard → your **gameteaser** site
2. **Site configuration → Build & deploy → Build settings**
3. Set **Build command** to **empty** (leave blank)
4. Set **Publish directory** to `.`
5. **Remove** env var `ADSENSE_PUBLISHER_ID` if set to placeholder, OR set it to `ca-pub-4190145625443935`
6. Deploy → **Deploy site** → upload folder or trigger deploy

## After deploy — verify

| Check | URL |
|-------|-----|
| ads.txt | https://gameteaser.netlify.app/ads.txt |
| Should show | `google.com, pub-4190145625443935, DIRECT, f08c47fec0942fa0` |
| Cookie bar | Bottom of page — **Got it** (does not block ads) |
| Auto ads | Enabled via `enable_page_level_ads` in page head |

## Enable ads in AdSense dashboard

1. [AdSense](https://adsense.google.com) → **Ads** → **By site**
2. Select **gameteaser.netlify.app**
3. Turn **ON** → Auto ads (anchor, side rail, vignette)
4. New sites can take **24–48 hours** before ads appear
5. Disable ad blockers when testing

## Optional — in-page ad boxes

AdSense → **Ads → By ad unit** → create Display ad → copy slot ID into `adsense.js` → `SLOTS` object → redeploy.

## Share link

**https://gameteaser.netlify.app/** — copy button is on the site.
