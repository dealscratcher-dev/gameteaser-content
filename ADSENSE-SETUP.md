# Monetize Season Rush with Google AdSense

## Before you apply

1. **Host the site on HTTPS** — use GitHub Pages, Netlify, Vercel, or your own domain.
2. **Add real content** — privacy policy page, about page, and contact help approval.
3. **Do not click your own ads** — Google will ban the account.

## Steps

1. Sign up at [https://www.google.com/adsense](https://www.google.com/adsense).
2. Add your site URL and wait for approval (often 1–2 weeks).
3. In AdSense → **Ads** → **By ad unit**, create:
   - One **Display** horizontal (leaderboard)
   - One **Display** rectangle
   - One **Multiplex** or **In-page** auto ad (optional)
4. Copy your **Publisher ID** (`ca-pub-XXXXXXXXXXXXXXXX`) and each **data-ad-slot** number.

## Edit `index.html`

Replace every occurrence of:

- `ca-pub-XXXXXXXXXXXXXXXX` → your publisher ID
- `data-ad-slot="0000000000"` (and 0000000001, 0000000002) → real slot IDs from AdSense

## ads.txt (required for revenue)

Create `ads.txt` in your site root:

```
google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0
```

Use the numeric part of your publisher ID (remove `ca-pub-` prefix for the middle number in some consoles — AdSense shows the exact line to copy).

## Auto-enable ads in `app.js`

Once the publisher ID in the script tag is real (not the placeholder), the page automatically:

- Hides gray placeholder boxes
- Calls `(adsbygoogle).push({})` for each unit

## Traffic tips

- Share on Reddit (r/CallOfDutyMobile, r/PUBGMobile), Discord, and YouTube descriptions.
- Update season dates when new seasons drop so users return.
- Post “X days left” screenshots when countdown hits 7 / 3 / 1 days.

## Legal

Add a footer link to a **Privacy Policy** that mentions cookies and AdSense third-party ads (Google provides a policy generator).
