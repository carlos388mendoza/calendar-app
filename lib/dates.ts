import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import type { CalendarView, Event } from "@/types";

export const HOUR_HEIGHT_PX = 56;
export const MIN_EVENT_HEIGHT_PX = 16;
export const SNAP_MINUTES = 30;
export const DAY_MS = 86_400_000;

export const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export const DATE_TIME_FORMAT = "yyyy-MM-dd'T'HH:mm:ss";

/** ISO string (yyyy-MM-dd) for a date. */
export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
};

/** Presentational title for the calendar header, per view. */
export function formatHeaderTitle(current: Date, view: CalendarView): string {
  if (view === "month") {
    return format(current, "LLLL yyyy", { locale: es }).toUpperCase();
  }
  if (view === "week") {
    const start = startOfWeek(current, { weekStartsOn: 1 });
    const end = endOfWeek(current, { weekStartsOn: 1 });
    if (isSameMonth(start, end)) {
      return `${format(start, "d")} – ${format(end, "d MMM yyyy", { locale: es })}`.toUpperCase();
    }
    return `${format(start, "d MMM", { locale: es })} – ${format(end, "d MMM yyyy", { locale: es })}`.toUpperCase();
  }
  return format(current, "cccc, d 'de' MMMM yyyy", { locale: es })
    .toUpperCase();
}

/** Navigate a date by one step in the given view. */
export function navigateDate(current: Date, view: CalendarView, dir: 1 | -1): Date {
  if (view === "month") return addMonths(current, dir);
  if (view === "week") return addWeeks(current, dir);
  return addDays(current, dir);
}

export type DateRange = { start: Date; end: Date };

/** The visible date range for a given view, anchored on `current`. */
export function rangeForView(current: Date, view: CalendarView): DateRange {
  if (view === "month") {
    return { start: startOfMonth(current), end: endOfMonth(current) };
  }
  if (view === "week") {
    const start = startOfWeek(current, { weekStartsOn: 1 });
    return { start, end: endOfWeek(current, { weekStartsOn: 1 }) };
  }
  return { start: startOfDay(current), end: startOfDay(current) };
}

/** All days rendered by the month grid (42 cells, ISO weeks starting Monday). */
export function monthGridDays(current: Date): Date[] {
  const monthStart = startOfMonth(current);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(addDays(gridStart, 41), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

/** Convert a Date to a full timestamp ISO string. */
export function toISO(d: Date): string {
  return format(d, DATE_TIME_FORMAT);
}

/** Build an ISO timestamp from a day + hour/minute. */
export function combine(date: Date | string, hours: number, minutes: number): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  const next = new Date(d);
  next.setHours(hours, minutes, 0, 0);
  return toISO(next);
}

export function fromISO(iso: string): number {
  return parseISO(iso).getTime();
}

/** Fractional hour (0–24) of an event start. */
export function minutesOfDay(iso: string): number {
  const d = parseISO(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function durationMinutes(ev: Pick<Event, "startTime" | "endTime">): number {
  return Math.max(0, fromISO(ev.endTime) - fromISO(ev.startTime)) / 60_000;
}

export function formatTime(iso: string): string {
  return format(parseISO(iso), "HH:mm");
}

export function formatEventRange(ev: Pick<Event, "startTime" | "endTime" | "allDay">): string {
  if (ev.allDay) return "Todo el día";
  return `${formatTime(ev.startTime)} – ${formatTime(ev.endTime)}`;
}

export function formatDayShort(date: Date): string {
  return format(date, "EEE", { locale: es });
}

export function formatDayNumber(date: Date): string {
  return format(date, "d");
}

export function formatLongDate(date: Date): string {
  return format(date, "EEE dd 'de' MMMM yyyy", { locale: es });
}

/** Snap a minute-of-day to the nearest interval (e.g. 30 min). */
export function snapToInterval(totalMinutes: number, interval = SNAP_MINUTES): number {
  return Math.round(totalMinutes / interval) * interval;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}