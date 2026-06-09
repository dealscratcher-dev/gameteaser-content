"use client";

/**
 * Toast.tsx
 * Accessible toast notification system for TheGameBit.
 * Supports info / success / error / warning / achievement variants,
 * auto-dismiss timers, actions, and stacked queue (up to 5 visible).
 *
 * Usage:
 *   // 1. Mount <ToastContainer /> once in root layout
 *   // 2. Use the hook anywhere:
 *   const { toast } = useToast();
 *   toast.success("Added to wishlist!", { action: { label: "Undo", onClick: () => {} } });
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useReducer,
  useRef,
} from "react";
import { createPortal } from "react-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ToastVariant =
  | "info"
  | "success"
  | "error"
  | "warning"
  | "achievement";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  /** Auto-dismiss after ms. 0 = persist until dismissed manually. Default: 4500 */
  duration?: number;
  action?: ToastAction;
  /** Icon override (React node) */
  icon?: React.ReactNode;
}

export interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  options: Required<Omit<ToastOptions, "icon">> & { icon?: React.ReactNode };
  /** Timestamp for ordering */
  ts: number;
  /** Animate-out flag */
  leaving?: boolean;
}

// ─── State / Reducer ─────────────────────────────────────────────────────────

const MAX_VISIBLE = 5;

type ToastState = { items: ToastItem[] };

type ToastAction2 =
  | { type: "ADD"; item: ToastItem }
  | { type: "MARK_LEAVING"; id: string }
  | { type: "REMOVE"; id: string };

function toastReducer(
  state: ToastState,
  action: ToastAction2
): ToastState {
  switch (action.type) {
    case "ADD":
      return {
        items: [action.item, ...state.items].slice(0, MAX_VISIBLE),
      };
    case "MARK_LEAVING":
      return {
        items: state.items.map((t) =>
          t.id === action.id ? { ...t, leaving: true } : t
        ),
      };
    case "REMOVE":
      return { items: state.items.filter((t) => t.id !== action.id) };
    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

interface ToastContextValue {
  dispatch: (item: Omit<ToastItem, "id" | "ts">) => void;
}

const ToastCtx = createContext<ToastContextValue | null>(null);

// ─── Icons ───────────────────────────────────────────────────────────────────

const icons: Record<ToastVariant, React.ReactNode> = {
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  achievement: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
      <path
        fillRule="evenodd"
        d="M10 1a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L10 13.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L2.82 7.124a.75.75 0 01.416-1.28l4.21-.611L9.327 1.418A.75.75 0 0110 1z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

const variantStyles: Record<
  ToastVariant,
  { container: string; icon: string; bar: string }
> = {
  info: {
    container: "border-cyan-500/20 bg-cyan-500/10",
    icon: "text-cyan-400",
    bar: "bg-cyan-500",
  },
  success: {
    container: "border-emerald-500/20 bg-emerald-500/10",
    icon: "text-emerald-400",
    bar: "bg-emerald-500",
  },
  error: {
    container: "border-red-500/20 bg-red-500/10",
    icon: "text-red-400",
    bar: "bg-red-500",
  },
  warning: {
    container: "border-amber-500/20 bg-amber-500/10",
    icon: "text-amber-400",
    bar: "bg-amber-500",
  },
  achievement: {
    container: "border-violet-500/30 bg-violet-500/15",
    icon: "text-violet-300",
    bar: "bg-violet-500",
  },
};

// ─── Single Toast ─────────────────────────────────────────────────────────────

interface ToastCardProps {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

function ToastCard({ item, onDismiss }: ToastCardProps) {
  const { variant, message, options, leaving } = item;
  const style = variantStyles[variant];
  const duration = options.duration;
  const progressRef = useRef<HTMLDivElement>(null);

  // Start progress bar animation
  useEffect(() => {
    if (!duration || !progressRef.current) return;
    const el = progressRef.current;
    el.style.transition = "none";
    el.style.width = "100%";
    // Force reflow
    void el.offsetWidth;
    el.style.transition = `width ${duration}ms linear`;
    el.style.width = "0%";
  }, [duration]);

  return (
    <div
      role="status"
      aria-live={variant === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={[
        "relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border px-4 py-3",
        "shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md",
        style.container,
        "transition-all duration-300",
        leaving
          ? "translate-x-4 opacity-0"
          : "translate-x-0 opacity-100",
      ].join(" ")}
    >
      {/* Icon */}
      <span className={["mt-0.5 shrink-0", style.icon].join(" ")} aria-hidden="true">
        {options.icon ?? icons[variant]}
      </span>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug text-slate-100">
          {message}
        </p>
        {options.action && (
          <button
            onClick={() => {
              options.action?.onClick();
              onDismiss(item.id);
            }}
            className="mt-1 text-xs font-semibold text-violet-300 transition-colors hover:text-violet-200
                       focus-visible:outline-none focus-visible:underline"
          >
            {options.action.label}
          </button>
        )}
      </div>

      {/* Dismiss */}
      <button
        aria-label="Dismiss notification"
        onClick={() => onDismiss(item.id)}
        className="shrink-0 rounded p-0.5 text-slate-500 transition-colors hover:text-slate-300
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      >
        <svg viewBox="0 0 16 16" width={14} height={14} fill="currentColor">
          <path d="M4.22 4.22a.75.75 0 011.06 0L8 6.94l2.72-2.72a.75.75 0 111.06 1.06L9.06 8l2.72 2.72a.75.75 0 11-1.06 1.06L8 9.06l-2.72 2.72a.75.75 0 01-1.06-1.06L6.94 8 4.22 5.28a.75.75 0 010-1.06z" />
        </svg>
      </button>

      {/* Progress bar */}
      {!!duration && (
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 h-[2px] w-full bg-white/5"
        >
          <div
            ref={progressRef}
            className={["h-full", style.bar].join(" ")}
          />
        </div>
      )}
    </div>
  );
}

// ─── Container ───────────────────────────────────────────────────────────────

/**
 * Mount once in your root layout. Reads from ToastProvider context.
 */
export function ToastContainer() {
  const ctx = useContext(ToastCtx);
  const [state, dispatch] = useReducer(toastReducer, { items: [] });
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "MARK_LEAVING", id });
    setTimeout(() => dispatch({ type: "REMOVE", id }), 300);
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
  }, []);

  // Wire up the context-provided dispatch
  // We use a portal-less approach: ToastProvider + ToastContainer share context.
  // The provider injects `add` via the context; the container holds the state.
  // To simplify, we expose the internal dispatch via a module-level singleton.

  // (see useToast below — it references the singleton directly)
  useEffect(() => {
    _setContainerDispatch((item) => {
      const id = crypto.randomUUID();
      const full: ToastItem = { ...item, id, ts: Date.now() };
      dispatch({ type: "ADD", item: full });

      if (full.options.duration) {
        timersRef.current[id] = setTimeout(
          () => dismiss(id),
          full.options.duration
        );
      }
    });
    return () => _setContainerDispatch(null);
  }, [dismiss]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-6 right-6 z-[9998] flex flex-col-reverse gap-2 sm:bottom-8 sm:right-8"
    >
      {state.items.map((item) => (
        <div key={item.id} className="pointer-events-auto">
          <ToastCard item={item} onDismiss={dismiss} />
        </div>
      ))}
    </div>,
    document.body
  );
}

// ─── Singleton dispatch ───────────────────────────────────────────────────────

type ContainerDispatch = ((item: Omit<ToastItem, "id" | "ts">) => void) | null;
let _dispatch: ContainerDispatch = null;

function _setContainerDispatch(fn: ContainerDispatch) {
  _dispatch = fn;
}

// ─── Public API Hook ─────────────────────────────────────────────────────────

/**
 * Returns imperative helpers to fire toasts from anywhere in the tree.
 * <ToastContainer /> must be mounted in the layout.
 */
export function useToast() {
  const show = useCallback(
    (
      message: string,
      variant: ToastVariant,
      options: ToastOptions = {}
    ) => {
      const { duration = 4500, action, icon } = options;
      _dispatch?.({
        message,
        variant,
        options: { duration, action: action!, icon },
      });
    },
    []
  );

  return {
    toast: {
      info: (msg: string, opts?: ToastOptions) => show(msg, "info", opts),
      success: (msg: string, opts?: ToastOptions) => show(msg, "success", opts),
      error: (msg: string, opts?: ToastOptions) =>
        show(msg, "error", { duration: 0, ...opts }),
      warning: (msg: string, opts?: ToastOptions) =>
        show(msg, "warning", opts),
      achievement: (msg: string, opts?: ToastOptions) =>
        show(msg, "achievement", { duration: 6000, ...opts }),
    },
  };
}
