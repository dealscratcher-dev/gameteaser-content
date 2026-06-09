"use client";

/**
 * VertFilter.tsx
 * Vertical sidebar filter panel for TheGameBit discovery pages.
 * Supports collapsible sections, multi-select chips, range sliders,
 * radio groups, and loading skeletons.
 *
 * Usage:
 *   <VertFilter sections={sections} onChange={setFilters} />
 */

import {
  Fragment,
  KeyboardEvent,
  useCallback,
  useId,
  useReducer,
  useState,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type FilterOptionValue = string | number;

export interface FilterOption {
  label: string;
  value: FilterOptionValue;
  /** Optional badge count (e.g. result count) */
  count?: number;
  disabled?: boolean;
}

export type FilterSectionType = "multi" | "single" | "range";

export interface FilterSection {
  id: string;
  label: string;
  type: FilterSectionType;
  options?: FilterOption[];
  /** For type="range": min/max/step */
  min?: number;
  max?: number;
  step?: number;
  defaultCollapsed?: boolean;
  icon?: React.ReactNode;
}

export type FilterState = Record<
  string,
  FilterOptionValue | FilterOptionValue[] | [number, number]
>;

export interface VertFilterProps {
  sections: FilterSection[];
  /** Controlled state — if provided, `onChange` is called on every change */
  value?: FilterState;
  onChange?: (state: FilterState) => void;
  /** Show loading skeletons instead of real content */
  loading?: boolean;
  /** Callback when user clicks "Clear all" */
  onClear?: () => void;
  className?: string;
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

type Action =
  | { type: "TOGGLE_MULTI"; sectionId: string; value: FilterOptionValue }
  | { type: "SET_SINGLE"; sectionId: string; value: FilterOptionValue }
  | { type: "SET_RANGE"; sectionId: string; value: [number, number] }
  | { type: "CLEAR" };

function filterReducer(state: FilterState, action: Action): FilterState {
  switch (action.type) {
    case "TOGGLE_MULTI": {
      const current = (state[action.sectionId] as FilterOptionValue[]) ?? [];
      const exists = current.includes(action.value);
      return {
        ...state,
        [action.sectionId]: exists
          ? current.filter((v) => v !== action.value)
          : [...current, action.value],
      };
    }
    case "SET_SINGLE":
      return { ...state, [action.sectionId]: action.value };
    case "SET_RANGE":
      return { ...state, [action.sectionId]: action.value };
    case "CLEAR":
      return {};
    default:
      return state;
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SectionHeaderProps {
  label: string;
  icon?: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  id: string;
  panelId: string;
}

function SectionHeader({
  label,
  icon,
  open,
  onToggle,
  id,
  panelId,
}: SectionHeaderProps) {
  return (
    <button
      id={id}
      aria-expanded={open}
      aria-controls={panelId}
      onClick={onToggle}
      className="flex w-full items-center justify-between px-3 py-2.5 text-left
                 rounded-lg transition-colors duration-150
                 text-slate-200 hover:bg-white/5 focus-visible:outline-none
                 focus-visible:ring-2 focus-visible:ring-orange-500/60"
    >
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-400">
        {icon && <span className="text-orange-400">{icon}</span>}
        {label}
      </span>
      <ChevronIcon open={open} />
    </button>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width={14}
      height={14}
      className={[
        "shrink-0 text-slate-500 transition-transform duration-200",
        open ? "rotate-180" : "",
      ].join(" ")}
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

interface MultiSelectProps {
  options: FilterOption[];
  selected: FilterOptionValue[];
  onToggle: (v: FilterOptionValue) => void;
}

function MultiSelect({ options, selected, onToggle }: MultiSelectProps) {
  return (
    <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-1">
      {options.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            disabled={opt.disabled}
            aria-pressed={active}
            onClick={() => onToggle(opt.value)}
            className={[
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
              "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
              active
                ? "border-orange-500 bg-orange-500/20 text-orange-200"
                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300",
              opt.disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer",
            ].join(" ")}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span
                className={[
                  "rounded-full px-1 text-[10px]",
                  active ? "text-orange-300" : "text-slate-500",
                ].join(" ")}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

interface SingleSelectProps {
  options: FilterOption[];
  selected: FilterOptionValue | undefined;
  onSelect: (v: FilterOptionValue) => void;
  groupName: string;
}

function SingleSelect({
  options,
  selected,
  onSelect,
  groupName,
}: SingleSelectProps) {
  const handleKey = (
    e: KeyboardEvent<HTMLLabelElement>,
    value: FilterOptionValue
  ) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(value);
    }
  };

  return (
    <div className="flex flex-col gap-0.5 px-3 pb-3 pt-1">
      {options.map((opt) => {
        const id = `${groupName}-${opt.value}`;
        const active = selected === opt.value;
        return (
          <label
            key={opt.value}
            htmlFor={id}
            tabIndex={0}
            onKeyDown={(e) => handleKey(e, opt.value)}
            className={[
              "flex cursor-pointer items-center justify-between rounded-md px-2 py-1.5 text-sm",
              "transition-colors duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/60",
              active
                ? "bg-orange-500/15 text-orange-200"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-300",
            ].join(" ")}
          >
            <span className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className={[
                  "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                  active ? "border-orange-500 bg-orange-500" : "border-slate-600",
                ].join(" ")}
              >
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </span>
              <input
                type="radio"
                id={id}
                name={groupName}
                value={String(opt.value)}
                checked={active}
                disabled={opt.disabled}
                onChange={() => onSelect(opt.value)}
                className="sr-only"
              />
              {opt.label}
            </span>
            {opt.count !== undefined && (
              <span className="text-xs text-slate-600">{opt.count}</span>
            )}
          </label>
        );
      })}
    </div>
  );
}

interface RangeSliderProps {
  min: number;
  max: number;
  step: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  sectionId: string;
}

function RangeSlider({
  min,
  max,
  step,
  value,
  onChange,
  sectionId,
}: RangeSliderProps) {
  const [low, high] = value;
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div className="px-3 pb-4 pt-2">
      <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
        <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono">{low}</span>
        <span className="text-slate-600">–</span>
        <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono">{high}</span>
      </div>
      <div className="relative h-1 rounded-full bg-white/10">
        {/* Track fill */}
        <div
          aria-hidden="true"
          className="absolute h-full rounded-full bg-orange-500"
          style={{
            left: `${pct(low)}%`,
            width: `${pct(high) - pct(low)}%`,
          }}
        />
        {/* Min thumb */}
        <input
          type="range"
          aria-label={`${sectionId} minimum`}
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= high) onChange([v, high]);
          }}
          className="pointer-events-none absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent
                     [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-orange-400
                     [&::-webkit-slider-thumb]:bg-zinc-900 [&::-webkit-slider-thumb]:transition-transform
                     [&::-webkit-slider-thumb]:hover:scale-125 focus-visible:outline-none"
        />
        {/* Max thumb */}
        <input
          type="range"
          aria-label={`${sectionId} maximum`}
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= low) onChange([low, v]);
          }}
          className="pointer-events-none absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent
                     [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-cyan-400
                     [&::-webkit-slider-thumb]:bg-zinc-900 [&::-webkit-slider-thumb]:transition-transform
                     [&::-webkit-slider-thumb]:hover:scale-125 focus-visible:outline-none"
        />
      </div>
    </div>
  );
}

function SkeletonSection() {
  return (
    <div className="animate-pulse space-y-2 p-3">
      <div className="h-3 w-1/3 rounded bg-white/5" />
      <div className="flex flex-wrap gap-1.5 pt-1">
        {[48, 64, 52, 72, 40].map((w, i) => (
          <div
            key={i}
            className="h-6 rounded-full bg-white/5"
            style={{ width: w }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VertFilter({
  sections,
  value: controlledValue,
  onChange,
  loading = false,
  onClear,
  className,
}: VertFilterProps) {
  const [internalState, dispatch] = useReducer(filterReducer, {});
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(
    () =>
      Object.fromEntries(
        sections.map((s) => [s.id, !s.defaultCollapsed])
      )
  );

  const uid = useId();
  const state = controlledValue ?? internalState;

  const emit = useCallback(
    (next: FilterState) => {
      if (!controlledValue) dispatch({ type: "CLEAR" }); // handled via reducer
      onChange?.(next);
    },
    [controlledValue, onChange]
  );

  const dispatchAndEmit = useCallback(
    (action: Action) => {
      dispatch(action);
      const nextState = filterReducer(state, action);
      onChange?.(nextState);
    },
    [state, onChange]
  );

  const toggleSection = (id: string) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleClear = () => {
    dispatch({ type: "CLEAR" });
    onClear?.();
    emit({});
  };

  const hasActive = Object.values(state).some(
    (v) => (Array.isArray(v) && v.length > 0) || (!Array.isArray(v) && v !== undefined)
  );

  return (
    <aside
      aria-label="Filters"
      className={[
        "flex w-56 shrink-0 flex-col gap-1 rounded-xl border border-white/[0.06]",
        "bg-zinc-900/80 py-3 backdrop-blur-md",
        className ?? "",
      ].join(" ")}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
          Filters
        </span>
        {hasActive && !loading && (
          <button
            onClick={handleClear}
            className="text-[11px] font-medium text-orange-400 transition-colors hover:text-orange-300
                       focus-visible:outline-none focus-visible:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="mx-3 mb-1 h-px bg-white/[0.06]" />

      {/* Sections */}
      {loading
        ? Array.from({ length: 4 }).map((_, i) => <SkeletonSection key={i} />)
        : sections.map((section) => {
            const open = openSections[section.id] ?? true;
            const headerId = `${uid}-${section.id}-hdr`;
            const panelId = `${uid}-${section.id}-panel`;

            return (
              <Fragment key={section.id}>
                <div>
                  <SectionHeader
                    label={section.label}
                    icon={section.icon}
                    open={open}
                    onToggle={() => toggleSection(section.id)}
                    id={headerId}
                    panelId={panelId}
                  />

                  {open && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                    >
                      {section.type === "multi" && section.options && (
                        <MultiSelect
                          options={section.options}
                          selected={
                            (state[section.id] as FilterOptionValue[]) ?? []
                          }
                          onToggle={(v) =>
                            dispatchAndEmit({
                              type: "TOGGLE_MULTI",
                              sectionId: section.id,
                              value: v,
                            })
                          }
                        />
                      )}

                      {section.type === "single" && section.options && (
                        <SingleSelect
                          options={section.options}
                          selected={
                            state[section.id] as FilterOptionValue | undefined
                          }
                          onSelect={(v) =>
                            dispatchAndEmit({
                              type: "SET_SINGLE",
                              sectionId: section.id,
                              value: v,
                            })
                          }
                          groupName={`${uid}-${section.id}`}
                        />
                      )}

                      {section.type === "range" && (
                        <RangeSlider
                          min={section.min ?? 0}
                          max={section.max ?? 100}
                          step={section.step ?? 1}
                          value={
                            (state[section.id] as [number, number]) ?? [
                              section.min ?? 0,
                              section.max ?? 100,
                            ]
                          }
                          onChange={(v) =>
                            dispatchAndEmit({
                              type: "SET_RANGE",
                              sectionId: section.id,
                              value: v,
                            })
                          }
                          sectionId={section.id}
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className="mx-3 h-px bg-white/[0.04]" />
              </Fragment>
            );
          })}
    </aside>
  );
}
