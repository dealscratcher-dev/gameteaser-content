// apps/web/components/cards/UniverseCardSkeleton.tsx
"use client";

import React from "react";
import { useStreak } from "@/hooks/useStreak";

/** Simple skeleton placeholder for loading state */
export default function UniverseCardSkeleton() {
  const { streak } = useStreak();
  return (
    <div
      style={{
        minHeight: "200px",
        borderRadius: "1rem",
        background: "rgba(255,255,255,0.1)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#aaa",
        fontStyle: "italic",
      }}
    >
      Loading... (Streak: {streak})
    </div>
  );
}
