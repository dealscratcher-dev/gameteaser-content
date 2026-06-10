"use client";

/**
 * SiteHeader.tsx
 * Sticky top navigation for TheGameBit.
 *
 * Features
 * ─────────
 * • Transparent-to-opaque on scroll (backdrop-blur glass)
 * • Desktop: logo | primary nav links | search bar | notification bell | avatar menu
 * • Mobile: logo | bell | hamburger → full-screen drawer
 * • Active-link detection via usePathname
 * • Keyboard-accessible (focus trap in drawer, Escape to close)
 * • Loading skeleton for SSR / auth state
 * • ARIA landmarks: <header> + <nav>
 *
 * Props accept both the original shape AND the page.tsx aliases:
 *   logoText          → custom wordmark text (default "GameTeaser")
 *   navItems          → alias for `links`
 *   showSearch        → toggle search bar (default true)
 *   showNotifications → toggle bell icon (default true)
 *   showAuth          → toggle sign-in / avatar (default true)
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
  /** Optional emoji/icon prefix */
  emoji?: string;
  badge?: number;
}

export interface UserMeta {
  displayName: string;
  avatarUrl?: string;
  /** Shown below display name */
  handle?: string;
}

export interface SiteHeaderProps {
  /** Nav links — use `links` or `navItems` (alias), or omit for defaults */
  links?: NavLink[];
  /** Alias for `links` — accepted from page.tsx */
  navItems?: { label: string; href: string }[];
  /** Custom wordmark text — default renders the GameTeaser mark */
  logoText?: string;
  user?: UserMeta | null;
  /** Loading skeleton while auth resolves */
  loading?: boolean;
  /** Notification count (bell badge) */
  notificationCount?: number;
  /** Show the search bar (default: true) */
  showSearch?: boolean;
  /** Show the notification bell (default: true) */
  showNotifications?: boolean;
  /** Show sign-in button / avatar menu (default: true) */
  showAuth?: boolean;
  onSearchSubmit?: (query: string) => void;
  /** Called when user clicks "Sign in" */
  onSignIn?: () => void;
  /** Called when user clicks "Sign out" */
  onSignOut?: () => void;
  className?: string;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_LINKS: NavLink[] = [
  { label: "Games",     href: "/games",     emoji: "🎮" },
  { label: "Anime",     href: "/anime",     emoji: "⚡" },
  { label: "Comics",    href: "/comics",    emoji: "💥" },
  { label: "Movies",    href: "/movies",    emoji: "🎬" },
  { label: "Universes", href: "/universes", emoji: "🌌" },
  { label: "Releases",  href: "/releases",  emoji: "🗓️" },
];

// ─── Logo ─────────────────────────────────────────────────────────────────────

/**
 * Three-part wordmark:
 *   "The"     — white/30 (dim prefix)
 *   "Game"    — white    (primary)
 *   "Bit"     — orange-400 (accent)
 *
 * When `logoText` is passed instead, renders it as a single styled string.
 */
function Logo({ logoText = "GameTeaser" }: { logoText?: string }) {
  const label = `${logoText} — Home`;

  return (
    <Link
      href="/"
      aria-label={label}
      className="flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 rounded-sm"
    >
      {logoText !== "TheGameBit" ? (
        <span
          className="
            font-[family-name:var(--font-barlow-condensed)]
            text-2xl font-extrabold uppercase tracking-tight leading-none
            text-white
          "
          aria-label={logoText}
        >
          {logoText}
        </span>
      ) : (
        <span
          className="
            font-[family-name:var(--font-barlow-condensed)]
            text-2xl font-extrabold uppercase tracking-tight leading-none
          "
          aria-label="TheGameBit"
        >
          <span className="text-white/30 text-xl">The</span>
          <span className="text-white">Game</span>
          <span className="text-orange-400">Bit</span>
        </span>
      )}
    </Link>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────

interface SearchBarProps {
  onSubmit?: (q: string) => void;
  className?: string;
}

function SearchBar({ onSubmit, className }: SearchBarProps) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: /
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if (
        e.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const submit = () => {
    const trimmed = q.trim();
    if (trimmed) onSubmit?.(trimmed);
  };

  return (
    <div className={cn("relative flex items-center", className)}>
      <label htmlFor="site-search" className="sr-only">
        Search games, anime, comics…
      </label>
      <div className="relative">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
        >
          <SearchIcon />
        </span>
        <input
          ref={inputRef}
          id="site-search"
          type="search"
          autoComplete="off"
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          className="
            h-11 w-full rounded-lg border border-white/10 bg-white/[0.05] sm:h-8 sm:w-48
            pl-8 pr-10 text-sm text-white placeholder:text-white/30
            transition-all duration-200
            focus:border-orange-500/40 focus:bg-white/[0.07] sm:focus:w-64
            focus:outline-none focus:ring-1 focus:ring-orange-500/30
            font-[family-name:var(--font-ibm-plex)]
          "
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1 py-0.5 font-mono text-[10px] text-white/25 transition-opacity"
          style={{ opacity: q ? 0 : 1 }}
        >
          /
        </span>
      </div>
    </div>
  );
}

// ─── NotificationBell ─────────────────────────────────────────────────────────

function NotificationBell({ count = 0 }: { count?: number }) {
  return (
    <button
      aria-label={
        count > 0
          ? `${count} unread notification${count !== 1 ? "s" : ""}`
          : "Notifications"
      }
      className="relative flex h-11 w-11 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 sm:h-8 sm:w-8"
    >
      <BellIcon />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-orange-500 text-[8px] font-bold leading-none text-zinc-950"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

// ─── AvatarMenu ───────────────────────────────────────────────────────────────

interface AvatarMenuProps {
  user: UserMeta;
  onSignOut?: () => void;
}

function AvatarMenu({ user, onSignOut }: AvatarMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((p) => !p)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-800 transition-colors hover:border-orange-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
      >
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
        ) : (
          <span className="font-[family-name:var(--font-barlow-condensed)] text-sm font-bold uppercase text-orange-400">
            {user.displayName.charAt(0)}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Account options"
          className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/[0.08] bg-zinc-900/95 py-1 shadow-[0_16px_48px_rgba(0,0,0,0.5)] backdrop-blur-md z-50"
        >
          <div className="border-b border-white/[0.06] px-4 py-3">
            <p className="text-sm font-semibold text-white">{user.displayName}</p>
            {user.handle && (
              <p className="text-xs text-white/40 font-[family-name:var(--font-ibm-plex)]">
                @{user.handle}
              </p>
            )}
          </div>

          {[
            { label: "Profile",  href: "/profile" },
            { label: "Wishlist", href: "/wishlist" },
            { label: "Settings", href: "/settings" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:bg-white/5"
            >
              {item.label}
            </Link>
          ))}

          <div className="my-1 border-t border-white/[0.06]" />
          <button
            role="menuitem"
            onClick={() => { setOpen(false); onSignOut?.(); }}
            className="flex w-full items-center px-4 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 focus-visible:outline-none focus-visible:bg-red-500/10"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MobileDrawer ─────────────────────────────────────────────────────────────

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  links: NavLink[];
  pathname: string;
  logoText?: string;
  user?: UserMeta | null;
  notificationCount?: number;
  showAuth?: boolean;
  showSearch?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onSearchSubmit?: (q: string) => void;
}

function MobileDrawer({
  open,
  onClose,
  links,
  pathname,
  logoText,
  user,
  notificationCount = 0,
  showAuth = true,
  showSearch = true,
  onSignIn,
  onSignOut,
  onSearchSubmit,
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null);

  // Focus trap
  useEffect(() => {
    if (!open) return;
    const el = drawerRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>(
      'a,button,input,[tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    const trap = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
      } else {
        if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
      }
    };
    el.addEventListener("keydown", trap);
    return () => el.removeEventListener("keydown", trap);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: globalThis.KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Panel */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-72 flex-col bg-zinc-950/95 shadow-[-16px_0_48px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-transform duration-300 ease-out lg:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
          <Logo logoText={logoText} />
          <button
            aria-label="Close menu"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="border-b border-white/[0.06] px-5 py-3">
            <SearchBar onSubmit={(q) => { onSearchSubmit?.(q); onClose(); }} className="w-full" />
          </div>
        )}

        {/* Nav links */}
        <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-0.5">
            {links.map((link) => {
              const active = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                      "font-[family-name:var(--font-ibm-plex)]",
                      active
                        ? "bg-orange-500/15 text-orange-300"
                        : "text-white/60 hover:bg-white/[0.05] hover:text-white"
                    )}
                  >
                    {link.emoji && <span aria-hidden="true">{link.emoji}</span>}
                    {link.label}
                    {!!link.badge && (
                      <span className="ml-auto rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-zinc-950">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {showAuth && (
          <div className="border-t border-white/[0.06] px-5 py-4">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-zinc-800">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-[family-name:var(--font-barlow-condensed)] text-sm font-bold uppercase text-orange-400">
                        {user.displayName.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{user.displayName}</p>
                    {user.handle && <p className="text-xs text-white/40">@{user.handle}</p>}
                  </div>
                </div>
                <button
                  onClick={() => { onSignOut?.(); onClose(); }}
                className="min-h-11 px-2 text-xs text-red-400 transition-colors hover:text-red-300 focus-visible:outline-none focus-visible:underline"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { onSignIn?.(); onClose(); }}
                className="
                  w-full rounded-none border border-orange-500 bg-orange-500
                  min-h-11 px-5 py-2 font-[family-name:var(--font-barlow-condensed)]
                  text-sm font-bold uppercase tracking-widest text-zinc-950
                  transition-all hover:bg-transparent hover:text-orange-400
                  focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400
                "
              >
                Sign In
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HeaderSkeleton() {
  return (
    <div aria-hidden="true" className="flex items-center gap-6 px-6 py-3">
      <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
      <div className="hidden lg:flex gap-4">
        {[80, 64, 72, 68, 88, 72].map((w, i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-white/10" style={{ width: w }} />
        ))}
      </div>
      <div className="ml-auto flex gap-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
        <div className="h-8 w-8 animate-pulse rounded-lg bg-white/10" />
        <div className="h-8 w-8 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <circle cx="6.5" cy="6.5" r="4" />
      <path d="M11 11l2.5 2.5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 1.5A4.5 4.5 0 0112.5 6c0 2.5.5 4 1.5 5H2c1-1 1.5-2.5 1.5-5A4.5 4.5 0 018 1.5z" />
      <path d="M6.5 11a1.5 1.5 0 003 0" />
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg viewBox="0 0 16 16" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SiteHeader({
  links,
  navItems,
  logoText,
  user,
  loading = false,
  notificationCount = 0,
  showSearch = true,
  showNotifications = true,
  showAuth = true,
  onSearchSubmit,
  onSignIn,
  onSignOut,
  className,
}: SiteHeaderProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Resolve links — accept either `links` or `navItems` (page.tsx alias)
  const resolvedLinks: NavLink[] =
    links ??
    navItems?.map((item) => ({ label: item.label, href: item.href })) ??
    DEFAULT_LINKS;

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-30 transition-all duration-300",
          scrolled
            ? "border-b border-white/[0.06] bg-zinc-950/90 shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-md"
            : "bg-transparent",
          className
        )}
      >
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Logo logoText={logoText} />

          {/* Desktop nav */}
          {!loading && (
            <nav aria-label="Primary navigation" className="hidden lg:flex">
              <ul className="flex items-center gap-1">
                {resolvedLinks.map((link) => {
                  const active =
                    pathname === link.href ||
                    pathname.startsWith(link.href + "/");
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                          "font-[family-name:var(--font-ibm-plex)]",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
                          active ? "text-white" : "text-white/50 hover:text-white"
                        )}
                      >
                        {active && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-x-2 -bottom-0.5 h-px rounded-full bg-orange-500"
                          />
                        )}
                        {link.emoji && (
                          <span aria-hidden="true" className="text-base leading-none">
                            {link.emoji}
                          </span>
                        )}
                        {link.label}
                        {!!link.badge && (
                          <span className="ml-0.5 rounded-full bg-orange-500 px-1.5 py-px text-[9px] font-bold leading-none text-zinc-950">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {loading ? (
            <HeaderSkeleton />
          ) : (
            <div className="flex items-center gap-2">
              {/* Search */}
              {showSearch && (
                <div className="hidden sm:block">
                  <SearchBar onSubmit={onSearchSubmit} />
                </div>
              )}

              {/* Bell */}
              {showNotifications && (
                <NotificationBell count={notificationCount} />
              )}

              {/* Auth */}
              {showAuth && (
                <>
                  {user ? (
                    <AvatarMenu user={user} onSignOut={onSignOut} />
                  ) : (
                    <button
                      onClick={onSignIn}
                      className="
                        hidden sm:inline-flex items-center
                        rounded-none border border-orange-500 bg-orange-500
                        px-4 py-1.5
                        font-[family-name:var(--font-barlow-condensed)]
                        text-xs font-bold uppercase tracking-widest text-zinc-950
                        transition-all hover:bg-transparent hover:text-orange-400
                        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400
                      "
                    >
                      Sign In
                    </button>
                  )}
                </>
              )}

              {/* Hamburger */}
              <button
                aria-label="Open navigation menu"
                aria-expanded={drawerOpen}
                onClick={() => setDrawerOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 lg:hidden"
              >
                <HamburgerIcon />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileDrawer
        open={drawerOpen}
        onClose={closeDrawer}
        links={resolvedLinks}
        pathname={pathname}
        logoText={logoText}
        user={user}
        notificationCount={notificationCount}
        showAuth={showAuth}
        showSearch={showSearch}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
        onSearchSubmit={onSearchSubmit}
      />
    </>
  );
}
