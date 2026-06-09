import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const title = searchParams.get("title") ?? "TheGameBit";
  const subtitle = searchParams.get("subtitle") ?? "Games · Anime · Comic-Cons";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "64px",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            color: "#a1a1aa",
            textTransform: "uppercase",
            letterSpacing: "0.15em",
            marginBottom: 16,
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            color: "#ffffff",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 24,
            color: "#f97316",
            fontWeight: 700,
          }}
        >
          thegamebit.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
