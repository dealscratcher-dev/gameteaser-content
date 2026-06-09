// apps/web/components/countdown/CountdownCard.tsx

"use client";

import { useCountdown } from "@/hooks/useCountdown";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CountdownCardProps {
  /** ISO date string or Date object for when the event ends */
  endDate: Date | string;
  /** Optional start date — enables the progress bar */
  startDate?: Date | string;
  /** Display name, e.g. "Season 5 — Revenge" */
  title: string;
  subtitle?: string;
  /** Short badge label, e.g. "live" or "royale pass" */
  badge?: string;
  badgeVariant?: "codm" | "pubg" | "default";
  countdownLabel?: string;
  /** Urgency message override — otherwise auto-generated */
  urgencyMessage?: (urgency: "critical" | "warning" | "normal") => string;
  /** Show progress bar */
  showProgress?: boolean;
  progressLabel?: string;
  /** Accent color class for the progress fill */
  accentVariant?: "codm" | "pubg" | "default";
  loading?: boolean;
  className?: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const BADGE_VARIANTS = {
  codm:    "bg-orange-500   text-zinc-950",
  pubg:    "bg-yellow-400   text-zinc-950",
  default: "bg-white/20     text-white",
};

const ACCENT_FILL = {
  codm:    "bg-orange-500",
  pubg:    "bg-yellow-400",
  default: "bg-white/60",
};

const URGENCY_MESSAGES = {
  critical: "⚡ Less than 24 hours left. Go now.",
  warning:  "🔥 Under 3 days — don't sleep on this.",
  normal:   null,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function TimeBlock({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const display = String(value).padStart(2, "0");
  return (
    <div 
      className="flex flex-col items-center" 
      aria-label={`${value} ${label}`}
      suppressHydrationWarning
    >
      <span
        className="
          font-[family-name:var(--font-barlow-condensed)]
          tabular-nums text-5xl font-extrabold leading-none tracking-tight text-white
          sm:text-6xl
          [text-shadow:0_2px_12px_rgba(0,0,0,0.5)]
        "
        aria-hidden="true"
        suppressHydrationWarning
      >
        {display}
      </span>
      <span
        className="
          mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40
          font-[family-name:var(--font-ibm-plex)]
        "
        aria-hidden="true"
      >
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return (
    <span
      aria-hidden="true"
      className="
        font-[family-name:var(--font-barlow-condensed)]
        mb-4 self-center text-3xl font-bold text-white/30
      "
    >
      :
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export function CountdownCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading countdown"
      className={cn(
        "rounded-sm border border-white/10 bg-zinc-900/80 p-6 animate-pulse",
        className
      )}
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="h-5 w-10 rounded-none bg-white/10" />
        <div className="space-y-1.5 flex-1">
          <div className="h-6 w-2/3 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/10" />
        </div>
      </div>
      <div className="h-3 w-40 rounded bg-white/10 mb-4" />
      <div className="flex justify-center gap-3 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <div className="h-14 w-14 rounded bg-white/10" />
            <div className="h-2.5 w-8 rounded bg-white/10" />
          </div>
        ))}
      </div>
      <div className="h-2 w-full rounded-full bg-white/10" />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CountdownCard({
  endDate,
  startDate,
  title,
  subtitle,
  badge,
  badgeVariant = "default",
  countdownLabel = "Time remaining",
  urgencyMessage,
  showProgress = true,
  progressLabel,
  accentVariant = "default",
  loading = false,
  className,
}: CountdownCardProps) {
  const { days, hours, minutes, seconds, progress, expired, urgency } =
    useCountdown(endDate, startDate);

  if (loading) return <CountdownCardSkeleton className={className} />;

  const urgencyMsg =
    urgencyMessage
      ? urgencyMessage(urgency)
      : URGENCY_MESSAGES[urgency];

  const progressPct = Math.round(progress * 100);
  const fillClass = ACCENT_FILL[accentVariant];
  const badgeClass = BADGE_VARIANTS[badgeVariant];

  return (
    <section
      aria-label={`Countdown: ${title}`}
      className={cn(
        "relative isolate overflow-hidden rounded-sm",
        "border border-white/10 bg-zinc-900/80",
        "p-5 sm:p-6",
        // Subtle top gradient accent
        "before:absolute before:inset-x-0 before:top-0 before:h-px before:content-['']",
        accentVariant === "codm" && "before:bg-gradient-to-r before:from-transparent before:via-orange-500/60 before:to-transparent",
        accentVariant === "pubg" && "before:bg-gradient-to-r before:from-transparent before:via-yellow-400/60 before:to-transparent",
        accentVariant === "default" && "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
    >
      {/* ── Header ── */}
      <header className="mb-4 flex items-start gap-3">
        {badge && (
          <span
            className={cn(
              "mt-0.5 inline-block shrink-0 rounded-none px-2 py-0.5",
              "font-[family-name:var(--font-barlow-condensed)]",
              "text-[10px] font-bold uppercase tracking-widest",
              badgeClass
            )}
          >
            {badge}
          </span>
        )}
        <div className="min-w-0">
          <h2
            className="
              font-[family-name:var(--font-barlow-condensed)]
              text-xl font-extrabold uppercase leading-tight tracking-tight text-white
              sm:text-2xl
              truncate
            "
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="
                mt-0.5 truncate text-xs text-white/50
                font-[family-name:var(--font-ibm-plex)]
              "
            >
              {subtitle}
            </p>
          )}
        </div>
      </header>

      {/* ── Countdown label ── */}
      <p
        className="
          mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40
          font-[family-name:var(--font-ibm-plex)]
        "
      >
        {countdownLabel}
      </p>

      {/* ── Digit display ── */}
      {expired ? (
        <div
          className="
            py-4 text-center
            font-[family-name:var(--font-barlow-condensed)]
            text-2xl font-bold uppercase tracking-widest text-white/40
          "
          role="status"
          aria-live="polite"
        >
          Season has ended
        </div>
      ) : (
        <div
          role="timer"
          aria-live="polite"
          aria-label={`${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds remaining`}
          className="mb-5 flex items-end justify-center gap-2 sm:gap-4"
          suppressHydrationWarning
        >
          <TimeBlock value={days}    label="days" />
          <Separator />
          <TimeBlock value={hours}   label="hrs"  />
          <Separator />
          <TimeBlock value={minutes} label="min"  />
          <Separator />
          <TimeBlock value={seconds} label="sec"  />
        </div>
      )}

      {/* ── Urgency message — matches original <blockquote class="urgency"> ── */}
      {urgencyMsg && !expired && (
        <blockquote
          aria-live="polite"
          className="
            mb-4 border-l-2 border-orange-500/60 pl-3
            font-[family-name:var(--font-ibm-plex)]
            text-xs font-medium italic text-orange-300/80
          "
        >
          {urgencyMsg}
        </blockquote>
      )}

      {/* ── Progress bar — matches .progress-wrap ── */}
      {showProgress && !expired && (
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span
              className="
                text-[11px] text-white/40
                font-[family-name:var(--font-ibm-plex)]
              "
            >
              {progressLabel ?? "How deep into the season you are"}
            </span>
            <span
              aria-label={`${progressPct} percent elapsed`}
              className="
                text-[11px] font-semibold text-white/60
                font-[family-name:var(--font-ibm-plex)]
              "
              suppressHydrationWarning
            >
              {progressPct}%
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuenow={progressPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Season progress"
            className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
            suppressHydrationWarning
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                fillClass
              )}
              style={{ width: `${progressPct}%` }}
              suppressHydrationWarning
            />
          </div>
        </div>
      )}
    </section>
  );
}