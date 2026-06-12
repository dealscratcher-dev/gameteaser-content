// components/countdown/ReleaseWheel.tsx
"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useCountdown } from "@/components/countdown/CountdownDisplay";

export interface Release {
  id: string;
  title: string;
  short: string;
  status: "past" | "current" | "upcoming";
  releaseDate: string;
  targetDate?: string;
  coverUrl?: string;  // thumbnail image for the release
}

export interface ReleaseWheelProps {
  posterSrc: string;
  posterAlt: string;
  eyebrow?: string;
  posterTitle: string;
  releases: Release[];
  defaultSelected?: number;
}

// ─── Theme helper ────────────────────────────────────────────────────────────

interface GameTheme {
  brand: string;
  accent: string;
  glow: string;
  border: string;
}

function getGameTheme(release: Release): GameTheme {
  const titleLower = release.title.toLowerCase();
  const shortUpper = release.short.toUpperCase();
  
  if (titleLower.includes("warzone")) {
    return {
      brand: "WARZONE",
      accent: "#eab308",
      glow: "rgba(234, 179, 8, 0.12)",
      border: "rgba(234, 179, 8, 0.25)"
    };
  } else if (titleLower.includes("pubg")) {
    return {
      brand: "PUBG MOBILE",
      accent: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.12)",
      border: "rgba(245, 158, 11, 0.25)"
    };
  } else if (shortUpper.startsWith("MW")) {
    return {
      brand: "MODERN WARFARE",
      accent: "#5ba338",
      glow: "rgba(91, 163, 56, 0.12)",
      border: "rgba(91, 163, 56, 0.25)"
    };
  } else {
    return {
      brand: "BLACK OPS",
      accent: "#ff7a00",
      glow: "rgba(255, 122, 0, 0.12)",
      border: "rgba(255, 122, 0, 0.25)"
    };
  }
}

// ─── Game Badge ──────────────────────────────────────────────────────────────

function GameBadge({ release, size = "md" }: { release: Release; size?: "sm" | "md" }) {
  const theme = getGameTheme(release);
  const badgeSize = size === "sm" ? 26 : 32;
  const logoTextSize = size === "sm" ? 8 : 10;
  const brandTextSize = size === "sm" ? 4 : 5;

  return (
    <div style={{
      width: badgeSize,
      height: badgeSize,
      borderRadius: 4,
      background: "linear-gradient(135deg, #161616 0%, #080808 100%)",
      border: `1px solid ${size === "sm" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.08)"}`,
      boxShadow: size === "sm" ? "none" : `0 0 10px ${theme.accent}12`,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      position: "relative",
      overflow: "hidden"
    }}>
      <span style={{
        fontSize: brandTextSize,
        fontWeight: 800,
        color: "rgba(255, 255, 255, 0.3)",
        letterSpacing: "0.02em",
        textTransform: "uppercase",
        lineHeight: 1,
        marginBottom: size === "sm" ? 0.5 : 1,
        fontFamily: "var(--font-ibm-plex), sans-serif"
      }}>
        {theme.brand === "BLACK OPS" ? "COD" : theme.brand === "MODERN WARFARE" ? "COD" : theme.brand}
      </span>
      <span style={{
        fontSize: logoTextSize,
        fontWeight: 950,
        color: theme.accent,
        letterSpacing: "-0.01em",
        lineHeight: 1,
        fontFamily: "var(--font-barlow-condensed), sans-serif"
      }}>
        {release.short.toUpperCase()}
      </span>
      <div style={{
        position: "absolute",
        bottom: 0,
        right: 0,
        width: 2,
        height: 2,
        backgroundColor: theme.accent
      }} />
    </div>
  );
}

// ─── Countdown Digits ────────────────────────────────────────────────────────

function CountdownDigits({ unit, urgent, themeColor }: { unit: any; urgent: boolean; themeColor: string }) {
  const pad = (n: number) => String(n).padStart(2, "0");
  
  const digitStyle: React.CSSProperties = {
    fontFamily: "var(--font-barlow-condensed), sans-serif",
    fontSize: 26,
    fontWeight: 850,
    color: "#ffffff",
    lineHeight: 1,
    letterSpacing: "-0.01em",
    textShadow: urgent ? `0 0 16px ${themeColor}bb` : "none"
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "var(--font-ibm-plex), sans-serif",
    fontSize: 8,
    fontWeight: 700,
    color: "rgba(255, 255, 255, 0.4)",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginTop: 3,
    textAlign: "center"
  };

  const separatorStyle: React.CSSProperties = {
    fontFamily: "var(--font-barlow-condensed), sans-serif",
    fontSize: 20,
    fontWeight: 700,
    color: urgent ? themeColor : "rgba(255,255,255,0.12)",
    lineHeight: 1,
    alignSelf: "flex-start",
    marginTop: 2
  };

  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
        <span style={digitStyle}>{pad(unit.days)}</span>
        <span style={labelStyle}>DAYS</span>
      </div>
      <span style={separatorStyle}>:</span>
      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
        <span style={digitStyle}>{pad(unit.hours)}</span>
        <span style={labelStyle}>HRS</span>
      </div>
      <span style={separatorStyle}>:</span>
      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
        <span style={digitStyle}>{pad(unit.minutes)}</span>
        <span style={labelStyle}>MINS</span>
      </div>
      <span style={separatorStyle}>:</span>
      
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32 }}>
        <span style={digitStyle}>{pad(unit.seconds)}</span>
        <span style={labelStyle}>SECS</span>
      </div>
    </div>
  );
}

// ─── Ghost Card with cover image ────────────────────────────────────────────

function GhostCard({ release }: { release: Release }) {
  const subtitle = release.status === "past" ? release.releaseDate : "Coming Soon";
  
  return (
    <div style={{
      width: "250px",
      height: 60,
      display: "flex",
      alignItems: "center",
      gap: 10,
      opacity: 0.45,
      padding: "0 8px 0 12px",
      boxSizing: "border-box",
      userSelect: "none"
    }}>
      {release.coverUrl && (
        <img 
          src={release.coverUrl} 
          alt={release.title}
          style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 4, flexShrink: 0 }}
        />
      )}
      <GameBadge release={release} size="sm" />
      <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
        <h3 style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#ffffff",
          fontFamily: "var(--font-barlow-condensed), sans-serif",
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap"
        }}>
          {release.title}
        </h3>
        <span style={{
          fontSize: 9,
          color: "rgba(255,255,255,0.45)",
          fontFamily: "var(--font-ibm-plex), sans-serif",
          letterSpacing: "0.03em",
          marginTop: 2
        }}>
          {subtitle}
        </span>
      </div>
    </div>
  );
}

// ─── Active card with cover image ───────────────────────────────────────────

function ActiveCard({ release }: { release: Release }) {
  const hasTimer = !!release.targetDate && release.status !== "past";
  const cd = useCountdown({
    targetDate: release.targetDate ?? new Date(Date.now() + 86_400_000).toISOString(),
    intervalMs: hasTimer ? 1_000 : 0,
  });

  const theme = getGameTheme(release);
  const urgent = hasTimer && cd.totalMs > 0 && cd.totalMs < 24 * 60 * 60 * 1000;

  return (
    <div 
      style={{
        width: "250px",
        height: 180,
        borderRadius: 16,
        padding: "16px 14px",
        background: "linear-gradient(160deg, rgba(20,20,20,0.95) 0%, rgba(8,8,8,0.99) 100%)",
        border: `1px solid ${urgent ? "#ff7a00" : "rgba(255,122,0,0.2)"}`,
        borderLeft: `3px solid ${theme.accent}`,
        boxShadow: `0 0 35px ${theme.accent}12, 0 12px 35px rgba(0,0,0,0.85)`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        position: "relative",
        overflow: "hidden",
        cursor: "default"
      }}
    >
      <div style={{
        position: "absolute",
        top: -30,
        left: -30,
        width: 80,
        height: 80,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${theme.accent}0e 0%, transparent 70%)`,
        pointerEvents: "none"
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 10, zIndex: 2 }}>
        {release.coverUrl && (
          <img 
            src={release.coverUrl} 
            alt={release.title}
            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 6, flexShrink: 0 }}
          />
        )}
        <GameBadge release={release} />
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0, flex: 1 }}>
          <span style={{
            fontSize: 9,
            fontWeight: 800,
            color: theme.accent,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontFamily: "var(--font-ibm-plex), sans-serif",
            lineHeight: 1.1
          }}>
            {release.status === "current" ? "CURRENT RELEASE" : release.status === "upcoming" ? "UPCOMING RELEASE" : "PAST RELEASE"}
          </span>
          <h3 style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#ffffff",
            fontFamily: "var(--font-barlow-condensed), sans-serif",
            lineHeight: 1.2,
            marginTop: 2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap"
          }}>
            {release.title}
          </h3>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", zIndex: 2, margin: "10px 0" }}>
        <span style={{
          fontSize: 8,
          fontWeight: 600,
          color: "rgba(255,255,255,0.3)",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          fontFamily: "var(--font-ibm-plex), sans-serif",
          marginBottom: 6
        }}>
          TIME UNTIL RELEASE
        </span>
        
        {hasTimer && cd.hydrated ? (
          <CountdownDigits unit={cd} urgent={urgent} themeColor={theme.accent} />
        ) : (
          <div style={{
            fontSize: 13,
            fontWeight: 700,
            color: "rgba(255,255,255,0.45)",
            fontFamily: "var(--font-barlow-condensed), sans-serif",
            letterSpacing: "0.05em",
            textTransform: "uppercase"
          }}>
            {release.releaseDate}
          </div>
        )}
      </div>

      <div style={{ 
        display: "flex", 
        justifyContent: "center", 
        fontSize: 9, 
        fontWeight: 700, 
        color: urgent ? "#ff7a00" : "rgba(255,255,255,0.22)", 
        letterSpacing: "0.12em", 
        textTransform: "uppercase",
        fontFamily: "var(--font-ibm-plex), sans-serif",
        zIndex: 2
      }}>
        {urgent ? "⚠️ Resetting Soon" : release.status === "current" ? "Active Season" : "Ready"}
      </div>
    </div>
  );
}

// ─── Chevrons ────────────────────────────────────────────────────────────────

function ChevronUp({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "absolute",
        top: 8,
        left: "50%",
        transform: "translateX(-50%)",
        background: "none",
        border: "none",
        color: disabled ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.45)",
        cursor: disabled ? "default" : "pointer",
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
        transition: "color 0.2s, transform 0.2s"
      }}
      className={disabled ? "" : "hover:scale-110 hover:text-white"}
    >
      <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 7L7 1L13 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function ChevronDown({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: "absolute",
        bottom: 8,
        left: "50%",
        transform: "translateX(-50%)",
        background: "none",
        border: "none",
        color: disabled ? "rgba(255, 255, 255, 0.15)" : "rgba(255, 255, 255, 0.45)",
        cursor: disabled ? "default" : "pointer",
        zIndex: 30,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
        transition: "color 0.2s, transform 0.2s"
      }}
      className={disabled ? "" : "hover:scale-110 hover:text-white"}
    >
      <svg width="14" height="8" viewBox="0 0 14 8" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const SHARED_H = 500;
const ACTIVE_H = 180;
const GHOST_H  = 60;
const SLOT_H   = 120;
const CENTER_Y = SHARED_H / 2; // 250

export default function ReleaseWheel({
  posterSrc,
  posterAlt,
  eyebrow = "Franchise Timeline",
  posterTitle,
  releases,
  defaultSelected,
}: ReleaseWheelProps) {
  const init = defaultSelected ?? Math.max(0, releases.findIndex((r) => r.status === "current"));
  const [selected, setSelected] = useState(init);

  const reelRef     = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const lastWheel   = useRef(0);

  const atTop    = selected === 0;
  const atBottom = selected === releases.length - 1;

  const prev = () => setSelected((p) => Math.max(0, p - 1));
  const next = () => setSelected((p) => Math.min(releases.length - 1, p + 1));

  useEffect(() => {
    const el = reelRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      const down = e.deltaY > 0;
      if (down && atBottom) return;
      if (!down && atTop)   return;
      e.preventDefault();
      const now = Date.now();
      if (now - lastWheel.current < 260) return;
      lastWheel.current = now;
      down ? next() : prev();
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [atTop, atBottom]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[45fr_55fr] gap-6 w-full max-w-[600px] h-auto md:h-[532px] bg-[#0a0a0a] rounded-[20px] p-4 border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] mx-auto overflow-hidden">

      {/* Poster */}
      <div className="relative w-full h-[320px] md:h-[500px] rounded-[18px] overflow-hidden border border-white/5 shadow-md flex-shrink-0">
        <img src={posterSrc} alt={posterAlt}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.6) 100%)",
        }} />
        <div style={{ position: "absolute", left: 16, top: 16, right: 16 }}>
          <p style={{ margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "#ff7a00", fontFamily: "var(--font-ibm-plex), sans-serif" }}>
            {eyebrow}
          </p>
          <h2 style={{ margin: "6px 0 0", fontSize: 36, fontWeight: 800, textTransform: "uppercase", lineHeight: 1.1, color: "#fff", fontFamily: "var(--font-barlow-condensed), sans-serif" }}>
            {posterTitle}
          </h2>
        </div>
      </div>

      {/* Reel */}
      <div
        ref={reelRef}
        className="relative w-full h-[500px] flex-shrink-0 overflow-hidden"
        onTouchStart={(e) => { touchStartY.current = e.touches[0].clientY; }}
        onTouchEnd={(e) => {
          const diff = touchStartY.current - e.changedTouches[0].clientY;
          if (Math.abs(diff) < 28) return;
          if (diff > 0 && !atBottom) next();
          if (diff < 0 && !atTop)   prev();
        }}
      >
        <ChevronUp onClick={prev} disabled={atTop} />
        <ChevronDown onClick={next} disabled={atBottom} />

        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 85,
          background: "linear-gradient(to bottom, #0a0a0a 0%, transparent 100%)",
          pointerEvents: "none", zIndex: 20,
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, height: 85,
          background: "linear-gradient(to top, #0a0a0a 0%, transparent 100%)",
          pointerEvents: "none", zIndex: 20,
        }} />

        <div style={{
          position: "absolute", left: "calc(50% - 125px)", width: 250,
          top: CENTER_Y - ACTIVE_H / 2 - 2,
          height: ACTIVE_H + 4,
          background: "transparent",
          borderTop: "1px solid rgba(255,122,0,0.06)",
          borderBottom: "1px solid rgba(255,122,0,0.06)",
          pointerEvents: "none", zIndex: 1,
        }} />

        {releases.map((release, index) => {
          const offset  = index - selected;
          const active  = offset === 0;
          if (Math.abs(offset) > 2) return null;

          const itemH   = active ? ACTIVE_H : GHOST_H;
          const topY    = (CENTER_Y + offset * SLOT_H) - itemH / 2;
          const opacity = active ? 1 : Math.abs(offset) === 1 ? 0.45 : 0;
          const scale   = active ? 1 : Math.abs(offset) === 1 ? 0.92 : 0.78;

          return (
            <motion.div
              key={release.id}
              animate={{ y: topY, opacity, scale }}
              initial={false}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              style={{
                position: "absolute", left: 0, right: 0,
                display: "flex", justifyContent: "center",
                zIndex: active ? 10 : 5,
                cursor: active ? "default" : "pointer",
                transformOrigin: "center center",
              }}
              onClick={() => !active && setSelected(index)}
            >
              {active ? (
                <ActiveCard release={release} />
              ) : (
                <GhostCard release={release} />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
