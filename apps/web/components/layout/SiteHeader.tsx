// apps/web/components/layout/SiteHeader.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  badge?: string | number;
  children?: NavItem[];
}

export interface SiteHeaderProps {
  /** Navigation items rendered in the primary nav */
  navItems?: NavItem[];
  /** Show/hide the search trigger */
  showSearch?: boolean;
  /** Callback fired when search icon is clicked */
  onSearchOpen?: () => void;
  /** Override logo text (defaults to brand mark) */
  logoText?: string;
  /** Show notification bell with optional count */
  notificationCount?: number;
  /** Whether the current user is authenticated */
  isAuthenticated?: boolean;
  /** Avatar URL for authenticated user */
  avatarSrc?: string;
  /** Display name for authenticated user */
  userName?: string;
  /** Skeleton / loading state */
  loading?: boolean;
  className?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DEFAULT_NAV: NavItem[] = [
  { label: "Discover", href: "/discover" },
  { label: "Games", href: "/games" },
  { label: "Anime", href: "/anime" },
  { label: "Comics", href: "/comics" },
  { label: "Movies", href: "/movies" },
  { label: "Universe", href: "/universe" },
];

// ─── Icons (inline SVG — zero deps) ──────────────────────────────────────────

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      <circle cx="8.5" cy="8.5" r="5.25" />
      <path d="M12.5 12.5 17 17" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      <path d="M10 2a6 6 0 0 1 6 6c0 3.5 1.5 5 1.5 5H2.5S4 11.5 4 8a6 6 0 0 1 6-6Z" />
      <path d="M8.5 17a1.5 1.5 0 0 0 3 0" />
    </svg>
  );
}

function IconMenu({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      <path d="M3 5h14M3 10h14M3 15h14" />
    </svg>
  );
}

function IconClose({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      <path d="M4 4 16 16M16 4 4 16" />
    </svg>
  );
}

function IconChevronDown({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-3 w-3", className)}
    >
      <path d="M2 4 6 8 10 4" />
    </svg>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function BrandLogo({ text = "TheGameBit" }: { text?: string }) {
  const [game, ...rest] = text.startsWith("The") ? ["The", text.slice(3)] : ["", text];
  const after = rest.join("");
  return (
    <span
      className="
        font-[family-name:var(--font-barlow-condensed)]
        text-xl font-extrabold uppercase tracking-tight leading-none
        select-none
      "
      aria-label={text}
    >
      <span className="text-white/40 text-base font-bold">{game}</span>
      <span className="text-white">{after.slice(0, after.indexOf("Bit"))}</span>
      <span className="text-orange-400">{after.slice(after.indexOf("Bit"))}</span>
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SiteHeaderSkeleton() {
  return (
    <header
      aria-busy="true"
      aria-label="Loading site header"
      className="fixed inset-x-0 top-0 z-50 h-14 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center gap-6 px-4 md:px-6">
        <div className="h-5 w-32 rounded bg-white/10 animate-pulse" />
        <div className="hidden md:flex gap-5 flex-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-3 w-14 rounded bg-white/10 animate-pulse" />
          ))}
        </div>
        <div className="ml-auto flex gap-3">
          <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>
    </header>
  );
}

// ─── Nav item (desktop, with optional dropdown) ───────────────────────────────

function NavItemDesktop({ item, pathname }: { item: NavItem; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  if (item.children?.length) {
    return (
      <div ref={ref} className="relative">
        <button
          aria-expanded={open}
          aria-haspopup="true"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "group flex items-center gap-1 py-1 text-sm font-medium transition-colors",
            "font-[family-name:var(--font-ibm-plex)] tracking-wide",
            isActive ? "text-white" : "text-white/50 hover:text-white"
          )}
        >
          {item.label}
          <IconChevronDown
            className={cn("transition-transform duration-200", open && "rotate-180")}
          />
        </button>

        {open && (
          <div
            role="menu"
            className="
              absolute left-0 top-full mt-2 min-w-[160px]
              rounded border border-white/10 bg-zinc-900/95 py-1 shadow-2xl backdrop-blur-xl
              animate-in fade-in slide-in-from-top-1 duration-150
            "
          >
            {item.children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="
                  block px-4 py-2 text-sm text-white/60
                  font-[family-name:var(--font-ibm-plex)]
                  hover:bg-white/5 hover:text-white transition-colors
                "
              >
                {child.label}
                {child.badge != null && (
                  <span className="ml-2 rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-300">
                    {child.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "relative py-1 text-sm font-medium transition-colors",
        "font-[family-name:var(--font-ibm-plex)] tracking-wide",
        isActive ? "text-white" : "text-white/50 hover:text-white",
        // Active underline
        isActive && [
          "after:absolute after:inset-x-0 after:-bottom-[17px]",
          "after:h-px after:bg-orange-400",
        ]
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {item.label}
      {item.badge != null && (
        <span className="ml-1.5 rounded bg-orange-500/20 px-1.5 py-0.5 text-[10px] font-bold text-orange-300">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * Fixed top navigation bar for TheGameBit.
 *
 * Features:
 * - Glassmorphic frosted backdrop
 * - Active page indicator (orange underline)
 * - Dropdown support for nav items with children
 * - Mobile hamburger with slide-down drawer
 * - Notification badge
 * - User avatar / auth state
 * - Scroll-aware opacity lift
 * - Skeleton loading state
 */
export default function SiteHeader({
  navItems = DEFAULT_NAV,
  showSearch = true,
  onSearchOpen,
  logoText = "TheGameBit",
  notificationCount,
  isAuthenticated = false,
  avatarSrc,
  userName,
  loading = false,
  className,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Lift background opacity on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  if (loading) return <SiteHeaderSkeleton />;

  const badgeCount =
    notificationCount != null && notificationCount > 0
      ? notificationCount > 99
        ? "99+"
        : String(notificationCount)
      : null;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-300",
          "border-b border-white/[0.06]",
          scrolled
            ? "bg-zinc-950/90 backdrop-blur-2xl shadow-lg shadow-black/40"
            : "bg-zinc-950/60 backdrop-blur-xl",
          className
        )}
      >
        {/* ── Accent line ── */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent"
        />

        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 md:px-6">

          {/* Logo */}
          <Link
            href="/"
            aria-label={`${logoText} — home`}
            className="shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400 rounded-sm"
          >
            <BrandLogo text={logoText} />
          </Link>

          {/* ── Desktop nav ── */}
          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-6 flex-1"
          >
            {navItems.map((item) => (
              <NavItemDesktop key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          {/* ── Right controls ── */}
          <div className="ml-auto flex items-center gap-1">

            {/* Search */}
            {showSearch && (
              <button
                aria-label="Open search"
                onClick={onSearchOpen}
                className="
                  flex h-9 w-9 items-center justify-center rounded-full
                  text-white/50 transition-colors hover:bg-white/8 hover:text-white
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400
                "
              >
                <IconSearch />
              </button>
            )}

            {/* Notification bell */}
            <button
              aria-label={
                badgeCount
                  ? `Notifications — ${badgeCount} unread`
                  : "Notifications"
              }
              className="
                relative flex h-9 w-9 items-center justify-center rounded-full
                text-white/50 transition-colors hover:bg-white/8 hover:text-white
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400
              "
            >
              <IconBell />
              {badgeCount && (
                <span
                  aria-hidden="true"
                  className="
                    absolute right-1.5 top-1.5 flex h-[14px] min-w-[14px] items-center
                    justify-center rounded-full bg-orange-500 px-0.5
                    text-[9px] font-bold leading-none text-zinc-950
                  "
                >
                  {badgeCount}
                </span>
              )}
            </button>

            {/* Auth: avatar or sign-in */}
            {isAuthenticated ? (
              <button
                aria-label={`Account menu for ${userName ?? "you"}`}
                className="
                  ml-1 flex h-8 w-8 items-center justify-center rounded-full
                  ring-2 ring-orange-500/40 hover:ring-orange-400 transition-all
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400
                  overflow-hidden bg-zinc-800 shrink-0
                "
              >
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarSrc}
                    alt={userName ?? "User avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="text-xs font-bold uppercase text-white"
                  >
                    {userName?.[0] ?? "U"}
                  </span>
                )}
              </button>
            ) : (
              <Link
                href="/auth/sign-in"
                className="
                  ml-2 hidden md:inline-flex items-center gap-1.5
                  rounded-none border border-orange-500/60 bg-transparent
                  px-4 py-1.5
                  font-[family-name:var(--font-barlow-condensed)]
                  text-xs font-bold uppercase tracking-widest text-orange-400
                  transition-all hover:bg-orange-500 hover:text-zinc-950 hover:border-orange-500
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400
                "
              >
                Sign In
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
              onClick={() => setMobileOpen((v) => !v)}
              className="
                ml-1 flex h-9 w-9 items-center justify-center rounded-full
                text-white/50 transition-colors hover:bg-white/8 hover:text-white
                focus-visible:outline focus-visible:outline-2 focus-visible:outline-orange-400
                md:hidden
              "
            >
              {mobileOpen ? <IconClose /> : <IconMenu />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-zinc-950/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          <nav
            id="mobile-nav"
            aria-label="Mobile navigation"
            className="
              fixed inset-x-0 top-14 z-40 md:hidden
              border-b border-white/[0.08]
              bg-zinc-950/95 backdrop-blur-2xl
              animate-in slide-in-from-top-2 duration-200
            "
          >
            <ul className="flex flex-col divide-y divide-white/[0.06] px-4 py-2">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex items-center justify-between py-3.5",
                        "font-[family-name:var(--font-barlow-condensed)]",
                        "text-base font-bold uppercase tracking-wide",
                        isActive ? "text-orange-400" : "text-white/60"
                      )}
                    >
                      {item.label}
                      {item.badge != null && (
                        <span className="rounded bg-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                    {item.children?.length ? (
                      <ul className="mb-2 ml-4 flex flex-col gap-1">
                        {item.children.map((child) => (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              className="block py-1.5 text-sm text-white/40 hover:text-white transition-colors font-[family-name:var(--font-ibm-plex)]"
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                );
              })}
              {!isAuthenticated && (
                <li className="py-4">
                  <Link
                    href="/auth/sign-in"
                    className="
                      block w-full text-center
                      border border-orange-500/60 bg-transparent
                      py-2.5
                      font-[family-name:var(--font-barlow-condensed)]
                      text-sm font-bold uppercase tracking-widest text-orange-400
                      transition-all hover:bg-orange-500 hover:text-zinc-950
                    "
                  >
                    Sign In
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
