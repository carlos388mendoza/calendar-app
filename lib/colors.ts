import type { EventColor } from "@/types";

export interface EventColorStyle {
  /** Styling for a small chip / block in the calendar grid. */
  chip: string;
  /** Background tint used for larger blocks (day/week grid). */
  block: string;
  /** Left accent border for grid blocks. */
  accent: string;
  /** Small solid dot used in lists. */
  dot: string;
  /** Ring + background for the selected swatch in the color picker. */
  picker: string;
}

/**
 * Pastel palette used across the whole app.
 * Class strings are full literals on purpose so Tailwind can scan them.
 */
export const EVENT_COLORS: Record<EventColor, EventColorStyle> = {
  sky: {
    chip: "bg-sky-100 text-sky-800 border-sky-200 hover:bg-sky-200/70",
    block: "bg-sky-100 border-sky-200",
    accent: "bg-sky-400",
    dot: "bg-sky-400",
    picker: "bg-sky-200 ring-2 ring-sky-500",
  },
  rose: {
    chip: "bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200/70",
    block: "bg-rose-100 border-rose-200",
    accent: "bg-rose-400",
    dot: "bg-rose-400",
    picker: "bg-rose-200 ring-2 ring-rose-500",
  },
  amber: {
    chip: "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200/70",
    block: "bg-amber-100 border-amber-200",
    accent: "bg-amber-400",
    dot: "bg-amber-400",
    picker: "bg-amber-200 ring-2 ring-amber-500",
  },
  emerald: {
    chip: "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200/70",
    block: "bg-emerald-100 border-emerald-200",
    accent: "bg-emerald-400",
    dot: "bg-emerald-400",
    picker: "bg-emerald-200 ring-2 ring-emerald-500",
  },
  violet: {
    chip: "bg-violet-100 text-violet-800 border-violet-200 hover:bg-violet-200/70",
    block: "bg-violet-100 border-violet-200",
    accent: "bg-violet-400",
    dot: "bg-violet-400",
    picker: "bg-violet-200 ring-2 ring-violet-500",
  },
  cyan: {
    chip: "bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200/70",
    block: "bg-cyan-100 border-cyan-200",
    accent: "bg-cyan-400",
    dot: "bg-cyan-400",
    picker: "bg-cyan-200 ring-2 ring-cyan-500",
  },
  orange: {
    chip: "bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200/70",
    block: "bg-orange-100 border-orange-200",
    accent: "bg-orange-400",
    dot: "bg-orange-400",
    picker: "bg-orange-200 ring-2 ring-orange-500",
  },
  lime: {
    chip: "bg-lime-100 text-lime-800 border-lime-200 hover:bg-lime-200/70",
    block: "bg-lime-100 border-lime-200",
    accent: "bg-lime-400",
    dot: "bg-lime-400",
    picker: "bg-lime-200 ring-2 ring-lime-500",
  },
};

export const EVENT_COLOR_LIST = Object.keys(EVENT_COLORS) as EventColor[];

/** Human-readable Spanish label for each color. */
export const EVENT_COLOR_LABELS: Record<EventColor, string> = {
  sky: "Cielo",
  rose: "Rosa",
  amber: "Ámbar",
  emerald: "Esmeralda",
  violet: "Violeta",
  cyan: "Cian",
  orange: "Naranja",
  lime: "Lima",
};

export function getColorStyle(color: EventColor): EventColorStyle {
  return EVENT_COLORS[color] ?? EVENT_COLORS.sky;
}