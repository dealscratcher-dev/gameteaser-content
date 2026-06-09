// apps/web/components/cards/UniverseCard.tsx
"use client";

import React from "react";
import { useStreak } from "@/hooks/useStreak";

/**
 * Props for the UniverseCard component.
 */
export interface UniverseCardProps {
  /** Title displayed on the card */
  title: string;
  /** Short description */
  description?: string;
  /** Optional background image URL */
  imageUrl?: string;
}

/**
 * A premium-looking card used on the "Universe" pages. It showcases
 * the current streak using the `useStreak` hook and applies a subtle
 * glassmorphism effect.
 */
export function UniverseCard({
  title,
  description = "",
  imageUrl,
}: UniverseCardProps) {
  // useStreak returns { streak: number, increment, reset }
  // streak is a plain number — not an object with .count
  const { streak } = useStreak();

  const containerStyle: React.CSSProperties = {
    position: "relative",
    borderRadius: "1rem",
    overflow: "hidden",
    padding: "1.5rem",
    background: "rgba(255, 255, 255, 0.1)",
    backdropFilter: "blur(12px) saturate(150%)",
    boxShadow: "0 4px 30px rgba(0,0,0,0.1)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "200px",
    backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };

  return (
    <div style={containerStyle} className="universe-card">
      <h2 style={{ margin: 0 }}>{title}</h2>
      {description && <p>{description}</p>}
      <div style={{ marginTop: "auto", fontSize: "0.9rem", opacity: 0.85 }}>
        {/* streak is a number directly — was incorrectly accessed as streak.count */}
        🔥 Streak: {streak} day(s)
      </div>
    </div>
  );
}

export default UniverseCard;
