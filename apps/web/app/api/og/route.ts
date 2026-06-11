import { NextRequest } from "next/server";

export const runtime = "nodejs";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = escapeXml(searchParams.get("title") ?? "GameTeaser");
  const subtitle = escapeXml(
    searchParams.get("subtitle") ?? "Games · Anime · Comic-Cons"
  );

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#09090b"/>
      <stop offset="50%" stop-color="#18181b"/>
      <stop offset="100%" stop-color="#27272a"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#f97316"/>
      <stop offset="55%" stop-color="#22d3ee"/>
      <stop offset="100%" stop-color="#facc15"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="1040" cy="112" r="220" fill="#f97316" opacity="0.14"/>
  <circle cx="145" cy="500" r="260" fill="#06b6d4" opacity="0.10"/>
  <rect x="64" y="64" width="1072" height="502" fill="none" stroke="#ffffff" stroke-opacity="0.12"/>
  <rect x="64" y="565" width="420" height="6" fill="url(#accent)"/>
  <text x="80" y="360"
    font-family="Arial, Helvetica, sans-serif"
    font-size="76"
    font-weight="900"
    fill="#ffffff"
    letter-spacing="-2">${title}</text>
  <text x="80" y="284"
    font-family="Arial, Helvetica, sans-serif"
    font-size="30"
    font-weight="700"
    fill="#a1a1aa"
    letter-spacing="6">${subtitle}</text>
  <text x="80" y="456"
    font-family="Arial, Helvetica, sans-serif"
    font-size="28"
    font-weight="800"
    fill="#fb923c">thegamebit.online</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}
