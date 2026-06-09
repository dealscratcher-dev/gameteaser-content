"use client";

/**
 * ConfigDialog.tsx
 * Futuristic settings / config dialog for TheGameBit.
 * Features: focus trap, keyboard dismiss, animated backdrop, section tabs,
 * toggle / select / text / range controls, unsaved-changes guard.
 *
 * Usage:
 *   <ConfigDialog open={open} onClose={() => setOpen(false)} sections={sections} />
 */

import {
  Fragment,
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ConfigControlType =
  | "toggle"
  | "select"
  | "text"
  | "range"
  | "radio"
  | "readonly";

export interface ConfigOption {
  label: string;
  value: string | number;
}

export interface ConfigControl {
  id: string;
  label: string;
  description?: string;
  type: ConfigControlType;
  /** Current value */
  value: string | number | boolean;
  /** For select / radio */
  options?: ConfigOption[];
  /** For range */
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Optional danger zone styling */
  danger?: boolean;
}

export interface ConfigSection {
  id: string;
  label: string;
  icon?: ReactNode;
  controls: ConfigControl[];
}

export interface ConfigDialogProps {
  open: boolean;
  onClose: () => void;
  sections: ConfigSection[];
  /** Called when user clicks Save */
  onSave?: (values: Record<string, string | number | boolean>) => Promise<void> | void;
  /** Dialog title (default: "Settings") */
  title?: string;
  className?: string;
}

// ─── Focus trap ───────────────────────────────────────────────────────────────

function useFocusTrap(ref: React.RefObject<HTMLElement | null>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handle = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    el.addEventListener("keydown", handle);
    first?.focus();
    return () => el.removeEventListener("keydown", handle);
  }, [active, ref]);
}

// ─── Control renderers ────────────────────────────────────────────────────────

interface ControlProps {
  control: ConfigControl;
  value: string | number | boolean;
  onChange: (id: string, v: string | number | boolean) => void;
  uid: string;
}

function ToggleControl({ control, value, onChange, uid }: ControlProps) {
  const checked = value as boolean;
  const id = `${uid}-${control.id}`;
  return (
    <button
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={control.label}
      disabled={control.disabled}
      onClick={() => onChange(control.id, !checked)}
      className={[
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 transition-colors duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900",
        checked ? "border-orange-500 bg-orange-600" : "border-white/10 bg-white/5",
        control.disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-3 w-3 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-[18px]" : "translate-x-0.5",
        ].join(" ")}
      />
    </button>
  );
}

function SelectControl({ control, value, onChange, uid }: ControlProps) {
  const id = `${uid}-${control.id}`;
  return (
    <select
      id={id}
      value={value as string | number}
      disabled={control.disabled}
      onChange={(e) => onChange(control.id, e.target.value)}
      className={[
        "rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200",
        "focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/40",
        "transition-colors",
        control.disabled ? "cursor-not-allowed opacity-40" : "",
      ].join(" ")}
    >
      {control.options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function TextControl({ control, value, onChange, uid }: ControlProps) {
  const id = `${uid}-${control.id}`;
  return (
    <input
      id={id}
      type="text"
      value={value as string}
      disabled={control.disabled}
      onChange={(e) => onChange(control.id, e.target.value)}
      className={[
        "rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-sm text-slate-200",
        "placeholder:text-slate-600 focus:border-orange-500/50 focus:outline-none focus:ring-1 focus:ring-orange-500/40",
        "transition-colors min-w-0 w-48",
        control.disabled ? "cursor-not-allowed opacity-40" : "",
      ].join(" ")}
    />
  );
}

function RangeControl({ control, value, onChange, uid }: ControlProps) {
  const id = `${uid}-${control.id}`;
  const num = value as number;
  return (
    <div className="flex items-center gap-3">
      <input
        id={id}
        type="range"
        min={control.min ?? 0}
        max={control.max ?? 100}
        step={control.step ?? 1}
        value={num}
        disabled={control.disabled}
        onChange={(e) => onChange(control.id, Number(e.target.value))}
        className={[
          "h-1.5 w-32 cursor-pointer appearance-none rounded-full",
          "bg-white/10 accent-orange-500",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-orange-400 [&::-webkit-slider-thumb]:bg-zinc-900",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
        ].join(" ")}
      />
      <span className="w-8 text-right font-mono text-xs text-slate-400">
        {num}
      </span>
    </div>
  );
}

function RadioControl({ control, value, onChange, uid }: ControlProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {control.options?.map((opt) => {
        const id = `${uid}-${control.id}-${opt.value}`;
        const active = value === opt.value;
        return (
          <label
            key={opt.value}
            htmlFor={id}
            className={[
              "cursor-pointer rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
              active
                ? "border-orange-500/50 bg-orange-500/15 text-orange-200"
                : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-slate-300",
              control.disabled ? "cursor-not-allowed opacity-40" : "",
            ].join(" ")}
          >
            <input
              type="radio"
              id={id}
              name={`${uid}-${control.id}`}
              value={opt.value}
              checked={active}
              disabled={control.disabled}
              onChange={() => onChange(control.id, opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        );
      })}
    </div>
  );
}

function ReadonlyControl({ control }: ControlProps) {
  return (
    <span className="rounded bg-white/[0.03] px-2 py-1 font-mono text-xs text-slate-500">
      {String(control.value)}
    </span>
  );
}

function ControlRow({
  control,
  value,
  onChange,
  uid,
}: ControlProps) {
  const labelId = `${uid}-${control.id}-label`;

  const renderControl = () => {
    switch (control.type) {
      case "toggle":
        return <ToggleControl {...{ control, value, onChange, uid }} />;
      case "select":
        return <SelectControl {...{ control, value, onChange, uid }} />;
      case "text":
        return <TextControl {...{ control, value, onChange, uid }} />;
      case "range":
        return <RangeControl {...{ control, value, onChange, uid }} />;
      case "radio":
        return <RadioControl {...{ control, value, onChange, uid }} />;
      case "readonly":
        return <ReadonlyControl {...{ control, value, onChange, uid }} />;
    }
  };

  return (
    <div
      className={[
        "flex flex-col gap-3 rounded-lg px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        "transition-colors",
        control.danger ? "border border-red-500/10 bg-red-500/5" : "hover:bg-white/[0.02]",
      ].join(" ")}
    >
      <div className="min-w-0">
        <label
          id={labelId}
          htmlFor={`${uid}-${control.id}`}
          className={[
            "text-sm font-medium",
            control.danger ? "text-red-300" : "text-slate-200",
          ].join(" ")}
        >
          {control.label}
        </label>
        {control.description && (
          <p className="mt-0.5 text-xs text-slate-500">{control.description}</p>
        )}
      </div>
      <div className="shrink-0">{renderControl()}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ConfigDialog({
  open,
  onClose,
  sections,
  onSave,
  title = "Settings",
  className,
}: ConfigDialogProps) {
  const uid = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(sections[0]?.id ?? "");
  const [values, setValues] = useState<Record<string, string | number | boolean>>(
    () =>
      Object.fromEntries(
        sections.flatMap((s) => s.controls.map((c) => [c.id, c.value]))
      )
  );
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useFocusTrap(dialogRef, open);

  // Prevent body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handle = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  const handleChange = useCallback(
    (id: string, v: string | number | boolean) => {
      setValues((prev) => ({ ...prev, [id]: v }));
      setDirty(true);
    },
    []
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave?.(values);
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  const currentSection = sections.find((s) => s.id === activeSection);

  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <div
      aria-modal="true"
      role="dialog"
      aria-label={title}
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog surface */}
      <div
        ref={dialogRef}
        className={[
          "relative flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl",
          "border border-white/[0.08] bg-zinc-950 shadow-[0_32px_80px_rgba(0,0,0,0.6)]",
          "max-h-[90dvh]",
          className ?? "",
        ].join(" ")}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4">
          <h2 className="text-base font-semibold text-slate-100">{title}</h2>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <svg viewBox="0 0 16 16" width={16} height={16} fill="currentColor">
              <path d="M4.22 4.22a.75.75 0 011.06 0L8 6.94l2.72-2.72a.75.75 0 111.06 1.06L9.06 8l2.72 2.72a.75.75 0 11-1.06 1.06L8 9.06l3.28-2.72a.75.75 0 010-1.06L8.94 6 6.22 3.28a.75.75 0 010-1.06z" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 overflow-hidden">
          {/* Sidebar nav */}
          <nav
            aria-label="Settings sections"
            className="hidden w-44 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-white/[0.05] p-3 sm:flex"
          >
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                aria-current={activeSection === section.id ? "page" : undefined}
                className={[
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/50",
                  activeSection === section.id
                    ? "bg-orange-600/20 text-orange-200"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-300",
                ].join(" ")}
              >
                {section.icon && (
                  <span
                    aria-hidden="true"
                    className={
                      activeSection === section.id
                        ? "text-orange-400"
                        : "text-slate-600"
                    }
                  >
                    {section.icon}
                  </span>
                )}
                {section.label}
              </button>
            ))}
          </nav>

          {/* Mobile section select */}
          <div className="flex sm:hidden w-full border-b border-white/[0.06] px-4 py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={[
                  "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeSection === section.id
                    ? "bg-orange-600/20 text-orange-200"
                    : "text-slate-500",
                ].join(" ")}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Controls area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {currentSection ? (
              <div className="flex flex-col gap-1">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-600">
                  {currentSection.label}
                </h3>
                {currentSection.controls.map((control) => (
                  <ControlRow
                    key={control.id}
                    control={control}
                    value={values[control.id] ?? control.value}
                    onChange={handleChange}
                    uid={uid}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/[0.06] px-6 py-3">
          <span className="text-xs text-slate-600">
            {dirty ? "Unsaved changes" : ""}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors
                         hover:bg-white/5 hover:text-slate-200 focus-visible:outline-none
                         focus-visible:ring-2 focus-visible:ring-white/20"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className={[
                "inline-flex items-center gap-2 rounded-lg px-5 py-2 text-sm font-semibold transition-all",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
                dirty && !saving
                  ? "bg-orange-600 text-white hover:bg-orange-500 shadow-[0_0_16px_rgba(249,115,22,0.3)]"
                  : "cursor-not-allowed bg-white/5 text-slate-600",
              ].join(" ")}
            >
              {saving && (
                <svg
                  aria-hidden="true"
                  className="h-3.5 w-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="31.4"
                    strokeDashoffset="10"
                  />
                </svg>
              )}
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
