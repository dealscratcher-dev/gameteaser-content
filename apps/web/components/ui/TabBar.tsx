"use client";

/**
 * TabBar.tsx
 * Futuristic animated tab bar for TheGameBit discovery pages.
 * Features: glowing active indicator, badge counts, icon support,
 * keyboard navigation, overflow scroll on mobile, ARIA tablist semantics.
 *
 * Usage:
 *   <TabBar
 *     tabs={[
 *       { id: "games", label: "Games", icon: <GamepadIcon /> },
 *       { id: "anime", label: "Anime", badge: 3 },
 *     ]}
 *     activeTab="games"
 *     onChange={setTab}
 *   />
 */

import {
  KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  /** Notification badge count — 0 hides the badge */
  badge?: number;
  disabled?: boolean;
}

export type TabBarVariant = "default" | "pill" | "underline";

export interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: TabBarVariant;
  /** Stretch tabs to fill container width */
  fullWidth?: boolean;
  /** Loading skeleton */
  loading?: boolean;
  /** aria-label for the tablist */
  ariaLabel?: string;
  className?: string;
}

// ─── Indicator position tracker ───────────────────────────────────────────────

interface IndicatorStyle {
  left: number;
  width: number;
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TabBarSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-1 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-9 animate-pulse rounded-lg bg-white/5"
          style={{ width: 60 + Math.random() * 30 }}
        />
      ))}
    </div>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────

interface TabButtonProps {
  tab: Tab;
  isActive: boolean;
  variant: TabBarVariant;
  fullWidth: boolean;
  panelId: string;
  buttonId: string;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => void;
  innerRef: (el: HTMLButtonElement | null) => void;
}

function TabButton({
  tab,
  isActive,
  variant,
  fullWidth,
  panelId,
  buttonId,
  onClick,
  onKeyDown,
  innerRef,
}: TabButtonProps) {
  const isPill = variant === "pill";
  const isUnderline = variant === "underline";

  return (
    <button
      ref={innerRef}
      id={buttonId}
      role="tab"
      aria-selected={isActive}
      aria-controls={panelId}
      aria-disabled={tab.disabled}
      tabIndex={isActive ? 0 : -1}
      disabled={tab.disabled}
      onClick={onClick}
      onKeyDown={onKeyDown}
      className={[
        "relative flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium",
        "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2",
        "focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
        fullWidth ? "flex-1 justify-center" : "",
        tab.disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
        // Variant-specific active/inactive
        isPill && isActive
          ? "bg-orange-600 text-white shadow-[0_0_12px_rgba(249,115,22,0.4)]"
          : isPill
          ? "text-slate-400 hover:bg-white/5 hover:text-slate-200"
          : isUnderline && isActive
          ? "text-orange-300"
          : isUnderline
          ? "text-slate-500 hover:text-slate-300"
          : // default
          isActive
          ? "text-slate-100"
          : "text-slate-500 hover:text-slate-300",
      ].join(" ")}
    >
      {tab.icon && (
        <span
          aria-hidden="true"
          className={[
            "transition-colors",
            isActive ? "text-orange-400" : "text-slate-600",
          ].join(" ")}
        >
          {tab.icon}
        </span>
      )}
      <span>{tab.label}</span>
      {!!tab.badge && (
        <span
          aria-label={`${tab.badge} new`}
          className={[
            "inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1",
            "text-[10px] font-bold tabular-nums leading-none",
            isActive
              ? "bg-orange-500 text-white"
              : "bg-white/10 text-slate-400",
          ].join(" ")}
        >
          {tab.badge > 99 ? "99+" : tab.badge}
        </span>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function TabBar({
  tabs,
  activeTab,
  onChange,
  variant = "default",
  fullWidth = false,
  loading = false,
  ariaLabel = "Navigation tabs",
  className,
}: TabBarProps) {
  const uid = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState<IndicatorStyle>({
    left: 0,
    width: 0,
  });

  // Update glide indicator on active tab change
  useEffect(() => {
    const btn = buttonRefs.current[activeTab];
    const list = listRef.current;
    if (!btn || !list) return;

    const listRect = list.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicator({
      left: btnRect.left - listRect.left + list.scrollLeft,
      width: btnRect.width,
    });
  }, [activeTab, tabs]);

  // Keyboard navigation (arrow keys within tablist)
  const handleKeyDown = (
    e: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number
  ) => {
    const enabledTabs = tabs.filter((t) => !t.disabled);
    const currentEnabled = enabledTabs.findIndex(
      (t) => t.id === tabs[currentIndex].id
    );

    let nextEnabled: Tab | undefined;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      nextEnabled =
        enabledTabs[(currentEnabled + 1) % enabledTabs.length];
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      nextEnabled =
        enabledTabs[
          (currentEnabled - 1 + enabledTabs.length) % enabledTabs.length
        ];
    } else if (e.key === "Home") {
      e.preventDefault();
      nextEnabled = enabledTabs[0];
    } else if (e.key === "End") {
      e.preventDefault();
      nextEnabled = enabledTabs[enabledTabs.length - 1];
    }

    if (nextEnabled) {
      onChange(nextEnabled.id);
      buttonRefs.current[nextEnabled.id]?.focus();
    }
  };

  const isPill = variant === "pill";
  const isUnderline = variant === "underline";
  const isDefault = variant === "default";

  return (
    <div
      className={[
        "relative",
        isDefault
          ? "rounded-xl border border-white/[0.06] bg-zinc-900/80 p-1 backdrop-blur-md"
          : "",
        isPill ? "rounded-xl bg-white/[0.03] p-1" : "",
        isUnderline
          ? "border-b border-white/[0.06]"
          : "",
        className ?? "",
      ].join(" ")}
    >
      {loading ? (
        <TabBarSkeleton count={tabs.length} />
      ) : (
        <div
          ref={listRef}
          role="tablist"
          aria-label={ariaLabel}
          aria-orientation="horizontal"
          className={[
            "relative flex overflow-x-auto scrollbar-none",
            isUnderline ? "gap-0" : "gap-0.5",
            fullWidth ? "w-full" : "",
            // Hide scrollbar cross-browser
            "[&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
          ].join(" ")}
        >
          {/* Glide indicator — only for default variant */}
          {isDefault && (
            <div
              aria-hidden="true"
              className={[
                "pointer-events-none absolute inset-y-0 my-auto h-7 rounded-md",
                "bg-gradient-to-r from-orange-600/80 to-orange-500/80",
                "shadow-[0_0_16px_rgba(249,115,22,0.35)]",
                "transition-[left,width] duration-200 ease-out",
              ].join(" ")}
              style={{ left: indicator.left, width: indicator.width }}
            />
          )}

          {/* Underline indicator */}
          {isUnderline && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 h-0.5 rounded-full bg-orange-500 transition-[left,width] duration-200 ease-out"
              style={{ left: indicator.left, width: indicator.width }}
            />
          )}

          {tabs.map((tab, i) => (
            <TabButton
              key={tab.id}
              tab={tab}
              isActive={activeTab === tab.id}
              variant={variant}
              fullWidth={fullWidth}
              buttonId={`${uid}-tab-${tab.id}`}
              panelId={`${uid}-panel-${tab.id}`}
              onClick={() => !tab.disabled && onChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              innerRef={(el) => {
                buttonRefs.current[tab.id] = el;
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Companion panel wrapper — links to the tab via ARIA.
 * Wrap each tab's content with this.
 */
export function TabPanel({
  tabId,
  activeTab,
  children,
  className,
}: {
  tabId: string;
  activeTab: string;
  children: React.ReactNode;
  className?: string;
}) {
  const uid = useId();
  const isActive = tabId === activeTab;

  return (
    <div
      id={`${uid}-panel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`${uid}-tab-${tabId}`}
      hidden={!isActive}
      tabIndex={0}
      className={[
        "focus-visible:outline-none",
        isActive ? "block" : "hidden",
        className ?? "",
      ].join(" ")}
    >
      {isActive ? children : null}
    </div>
  );
}
