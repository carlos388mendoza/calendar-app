"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { getColorStyle } from "@/lib/colors";
import { useCalendarStore } from "@/store/useCalendarStore";
import {
  HOUR_HEIGHT_PX,
  MIN_EVENT_HEIGHT_PX,
  SNAP_MINUTES,
  addDays,
  clamp,
  combine,
  eachDayOfInterval,
  formatDayNumber,
  formatDayShort,
  formatTime,
  isToday,
  minutesOfDay,
  snapToInterval,
  startOfDay,
  startOfWeek,
  toISODate,
} from "@/lib/dates";
import type { Event } from "@/types";

const MAX_MINUTES = 24 * 60;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

interface DragSession {
  id: string;
  mode: "move" | "resize";
  startMin: number;
  endMin: number;
  dayIndex: number;
  px: number;
  py: number;
  moved: boolean;
}

interface Preview {
  id: string;
  dayIndex: number;
  startMin: number;
  endMin: number;
}

interface PlacedEvent {
  event: Event;
  leftPct: number;
  widthPct: number;
  topMin: number;
  heightMin: number;
}

interface Overflow {
  count: number;
  fromMin: number;
  toMin: number;
}

/** Greedy column layout for overlapping events, with "+N" overflow. */
function layoutDay(events: Event[], maxCols: number): { placed: PlacedEvent[]; overflow: Overflow | null } {
  const sorted = [...events].sort(
    (a, b) =>
      minutesOfDay(a.startTime) - minutesOfDay(b.startTime) ||
      (minutesOfDay(b.endTime) - minutesOfDay(a.endTime))
  );

  const placed: PlacedEvent[] = [];
  const over: Event[] = [];
  let cluster: Event[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const cols: number[] = [];
    const colIdx = new Map<string, number>();
    const clusterOver: Event[] = [];

    for (const ev of cluster) {
      const start = minutesOfDay(ev.startTime);
      const end = Math.max(minutesOfDay(ev.endTime), start + 1);
      const idx = cols.findIndex((c) => c <= start);
      if (idx >= 0) {
        cols[idx] = end;
        colIdx.set(ev.id, idx);
      } else if (cols.length < maxCols) {
        cols.push(end);
        colIdx.set(ev.id, cols.length - 1);
      } else {
        clusterOver.push(ev);
        colIdx.set(ev.id, maxCols);
      }
    }

    const nCols = Math.min(cluster.length, maxCols);
    const widthPct = (100 - 1) / nCols;
    for (const ev of cluster) {
      const idx = colIdx.get(ev.id) ?? 0;
      if (idx >= maxCols) continue;
      placed.push({
        event: ev,
        leftPct: (idx * 100) / nCols,
        widthPct,
        topMin: minutesOfDay(ev.startTime),
        heightMin: Math.max(minutesOfDay(ev.endTime) - minutesOfDay(ev.startTime), 10),
      });
    }
    over.push(...clusterOver);
    cluster = [];
    clusterEnd = -1;
  };

  for (const ev of sorted) {
    const start = minutesOfDay(ev.startTime);
    if (cluster.length === 0 || start < clusterEnd) {
      cluster.push(ev);
      clusterEnd = Math.max(clusterEnd, minutesOfDay(ev.endTime));
    } else {
      flush();
      cluster = [ev];
      clusterEnd = minutesOfDay(ev.endTime);
    }
  }
  flush();

  let overflow: Overflow | null = null;
  if (over.length > 0) {
    const fromMin = Math.min(...over.map((e) => minutesOfDay(e.startTime)));
    const toMin = Math.max(...over.map((e) => minutesOfDay(e.startTime)));
    overflow = { count: over.length, fromMin, toMin };
  }
  return { placed, overflow };
}

const px = (minutes: number) => (minutes / 60) * HOUR_HEIGHT_PX;

interface DayBlockProps {
  event: Event;
  topMin: number;
  heightMin: number;
  leftPct: number;
  widthPct: number;
  dimmed?: boolean;
  onPointerDown: (e: ReactPointerEvent) => void;
  onResizePointerDown: (e: ReactPointerEvent) => void;
  onClick: (e: ReactMouseEvent) => void;
}

function DayBlock({
  event,
  topMin,
  heightMin,
  leftPct,
  widthPct,
  dimmed,
  onPointerDown,
  onResizePointerDown,
  onClick,
}: DayBlockProps) {
  const style = getColorStyle(event.color);
  return (
    <div
      onPointerDown={onPointerDown}
      onDoubleClick={(e) => e.stopPropagation()}
      onClick={onClick}
      className={cn(
        "absolute z-10 select-none touch-none overflow-hidden rounded-md border text-left shadow-sm transition-opacity",
        style.block,
        dimmed && "opacity-30"
      )}
      style={{
        top: px(topMin),
        height: Math.max(px(heightMin), MIN_EVENT_HEIGHT_PX),
        left: `${leftPct}%`,
        width: `calc(${widthPct}% - 3px)`,
      }}
    >
      <span className={cn("absolute inset-y-0 left-0 w-0.5", style.accent)} />
      <div className="truncate px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-slate-800 sm:text-[11px]">
        {event.allDay ? event.title : `${formatTime(event.startTime)} ${event.title}`}
      </div>
      <div
        onPointerDown={onResizePointerDown}
        className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize rounded-b-md bg-slate-900/10 hover:bg-slate-900/20"
        aria-hidden
      />
    </div>
  );
}

export interface TimeGridViewProps {
  days: 1 | 7;
}

/** Shared implementation for the Day and Week views. */
export function TimeGridView({ days }: TimeGridViewProps) {
  const currentDate = useCalendarStore((s) => s.currentDate);
  const events = useCalendarStore((s) => s.events);
  const loading = useCalendarStore((s) => s.loading);
  const error = useCalendarStore((s) => s.error);
  const openModal = useCalendarStore((s) => s.openModal);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const loadRange = useCalendarStore((s) => s.loadRange);

  const maxCols = days === 1 ? 6 : 4;

  const dayStarts = useMemo(() => {
    const anchor =
      days === 1 ? startOfDay(currentDate) : startOfWeek(currentDate, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: anchor, end: addDays(anchor, days - 1) });
  }, [currentDate, days]);

  const byColumn = useMemo(() => {
    const arr: { timed: Event[]; allDay: Event[] }[] = dayStarts.map(() => ({
      timed: [],
      allDay: [],
    }));
    for (const ev of events.values()) {
      const dayKey = ev.startTime.slice(0, 10);
      const idx = dayStarts.findIndex((d) => toISODate(d) === dayKey);
      if (idx < 0) continue;
      (ev.allDay ? arr[idx].allDay : arr[idx].timed).push(ev);
    }
    for (const d of arr) {
      d.timed.sort((a, b) => a.startTime.localeCompare(b.startTime));
      d.allDay.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return arr;
  }, [events, dayStarts]);

  const laidOut = useMemo(
    () => byColumn.map((c) => layoutDay(c.timed, maxCols)),
    [byColumn, maxCols]
  );

  // ─── Drag state ───────────────────────────────────────────────────────────
  const sessionRef = useRef<DragSession | null>(null);
  const previewRef = useRef<Preview | null>(null);
  const movedRef = useRef(false);
  const [preview, setPreview] = useState<Preview | null>(null);

  const eventsRef = useRef(events);
  eventsRef.current = events;
  const dayStartsRef = useRef(dayStarts);
  dayStartsRef.current = dayStarts;
  const daysRef = useRef(days);
  daysRef.current = days;
  const updateEventRef = useRef(updateEvent);
  updateEventRef.current = updateEvent;

  const beginDrag = useCallback(
    (e: ReactPointerEvent, ev: Event, mode: "move" | "resize") => {
      if (e.button !== 0) return;
      const dayKey = ev.startTime.slice(0, 10);
      const dayIndex = dayStartsRef.current.findIndex((d) => toISODate(d) === dayKey);
      if (dayIndex < 0) return;
      sessionRef.current = {
        id: ev.id,
        mode,
        startMin: minutesOfDay(ev.startTime),
        endMin: minutesOfDay(ev.endTime),
        dayIndex,
        px: e.clientX,
        py: e.clientY,
        moved: false,
      };
      movedRef.current = false;
      document.body.classList.add("dragging-body");
    },
    []
  );

  const handleMove = useCallback((e: PointerEvent) => {
    const s = sessionRef.current;
    if (!s) return;
    const colsEl = document.getElementById("timegrid-columns");
    if (!colsEl) return;

    const rect = colsEl.getBoundingClientRect();
    const x = clamp(e.clientX - rect.left, 0, rect.width - 1);
    const y = clamp(e.clientY - rect.top, 0, px(MAX_MINUTES) - 1);

    if (!s.moved) {
      if (Math.hypot(e.clientX - s.px, e.clientY - s.py) < 6) return;
      s.moved = true;
    }
    movedRef.current = true;

    const colW = rect.width / daysRef.current;
    const dayIndex = clamp(Math.floor(x / colW), 0, daysRef.current - 1);
    const rawMin = Math.floor((y / HOUR_HEIGHT_PX) * 60);
    const snapped = snapToInterval(rawMin);

    let next: Preview;
    if (s.mode === "move") {
      const dur = Math.max(s.endMin - s.startMin, 30);
      const startMin = clamp(snapped, 0, MAX_MINUTES - 30 - 30);
      next = { id: s.id, dayIndex, startMin, endMin: Math.min(startMin + dur, MAX_MINUTES - 1) };
    } else {
      const endMin = clamp(snapped, s.startMin + SNAP_MINUTES, MAX_MINUTES - 1);
      next = { id: s.id, dayIndex: s.dayIndex, startMin: s.startMin, endMin };
    }
    previewRef.current = next;
    setPreview(next);
  }, []);

  const handleUp = useCallback(() => {
    const s = sessionRef.current;
    const p = previewRef.current;
    sessionRef.current = null;
    previewRef.current = null;
    setPreview(null);
    document.body.classList.remove("dragging-body");

    if (!s?.moved || !p) return;
    const target = eventsRef.current.get(p.id);
    if (!target) return;

    const base = dayStartsRef.current[p.dayIndex];
    const startISO = combine(base, Math.floor(p.startMin / 60), p.startMin % 60);
    const endISO = combine(base, Math.floor(p.endMin / 60), p.endMin % 60);
    if (target.startTime === startISO && target.endTime === endISO) return;
    void updateEventRef.current(p.id, { startTime: startISO, endTime: endISO });
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => handleMove(e);
    const onUp = () => handleUp();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.classList.remove("dragging-body");
    };
  }, [handleMove, handleUp]);

  // Re-render "now" line every minute.
  const [, forceTick] = useReducer((c: number) => c + 1, 0);
  useEffect(() => {
    const t = setInterval(forceTick, 60_000);
    return () => clearInterval(t);
  }, []);

  const now = new Date();
  const nowDayIndex = dayStarts.findIndex((d) => isToday(d));
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const openAt = (date: string, hour: number) => openModal({ type: "create", date, hour });

  const gridTemplate = `64px repeat(${days}, minmax(0,1fr))`;
  const colStyle = (idx: number): React.CSSProperties => ({
    left: `${(idx / days) * 100}%`,
    width: `${100 / days}%`,
  });
  const dayKey = (d: Date) => toISODate(d);

  return (
    <div className="flex h-full flex-col">
      {error && (
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
          <span>{error}</span>
          <button
            onClick={() => void loadRange()}
            className="rounded-md bg-rose-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-rose-700"
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-auto">
        <div className="min-w-[760px]">
          {/* Day / All-day header (sticky) */}
          <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
            <div
              className="grid border-b border-slate-100"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <div />
              {dayStarts.map((d) => (
                <div
                  key={dayKey(d)}
                  className="group relative border-l border-slate-200 px-1 py-1.5 text-center"
                >
                  <div className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                    {formatDayShort(d)}
                  </div>
                  <div className="flex items-center justify-center">
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-sm font-semibold",
                        isToday(d) ? "bg-sky-600 text-white" : "text-slate-700"
                      )}
                    >
                      {formatDayNumber(d)}
                    </span>
                  </div>
                  <button
                    onClick={() => openAt(dayKey(d), new Date().getHours())}
                    title="Nuevo evento"
                    className="absolute right-1 top-1.5 hidden size-5 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 group-hover:flex"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* All-day strip */}
            <div
              className="grid"
              style={{ gridTemplateColumns: gridTemplate }}
            >
              <div className="flex items-center justify-end px-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                Todo el día
              </div>
              {dayStarts.map((d, idx) => (
                <div
                  key={dayKey(d)}
                  className="min-h-[38px] space-y-0.5 border-l border-slate-200 p-1"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("application/x-calendar-event");
                    if (!id) return;
                    const ev = eventsRef.current.get(id);
                    if (!ev) return;
                    const originKey = ev.startTime.slice(0, 10);
                    const targetKey = dayKey(d);
                    if (originKey === targetKey) return;
                    const dayIdx = dayStartsRef.current.findIndex((dv) => toISODate(dv) === targetKey);
                    void updateEventRef.current(id, {
                      allDay: true,
                      startTime: combine(dayStartsRef.current[dayIdx], 0, 0),
                      endTime: combine(dayStartsRef.current[dayIdx], 23, 59),
                    });
                  }}
                >
                  {byColumn[idx].allDay.map((ev) => (
                    <div
                      key={ev.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/x-calendar-event", ev.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal({ type: "detail", eventId: ev.id });
                      }}
                      className={cn(
                        "relative cursor-pointer truncate rounded-md border px-1.5 py-0.5 text-[11px] font-medium",
                        getColorStyle(ev.color).chip
                      )}
                    >
                      {ev.title}
                    </div>
                  ))}
                  {byColumn[idx].allDay.length === 0 && (
                    <div className="h-[24px] w-full rounded border border-dashed border-slate-200" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Time grid body */}
          <div
            className="relative"
            style={{ height: px(MAX_MINUTES) }}
          >
            {/* Hour lines + labels */}
            {HOURS.map((h) => (
              <div key={h} className="absolute inset-x-0" style={{ top: px(h * 60) }}>
                <div className="absolute -translate-y-1/2 pr-2 text-right text-[10px] tabular-nums text-slate-400 w-[64px]">
                  {h === 0 ? "" : `${String(h).padStart(2, "0")}:00`}
                </div>
                <div className="absolute left-16 right-0 border-t border-slate-100" />
              </div>
            ))}

            {/* Columns area */}
            <div id="timegrid-columns" className="absolute inset-y-0 left-16 right-0">
              {dayStarts.map((d, idx) => (
                <div
                  key={dayKey(d)}
                  className="absolute inset-y-0 border-l border-slate-100 first:border-l-0"
                  style={colStyle(idx)}
                  onDoubleClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const rawMin = clamp(
                      Math.floor(((e.clientY - rect.top) / HOUR_HEIGHT_PX) * 60),
                      0,
                      MAX_MINUTES - 1
                    );
                    openAt(dayKey(d), Math.floor(rawMin / 60));
                  }}
                >
                  {laidOut[idx].placed.map((p) => (
                    <DayBlock
                      key={p.event.id}
                      event={p.event}
                      topMin={p.topMin}
                      heightMin={p.heightMin}
                      leftPct={p.leftPct}
                      widthPct={p.widthPct}
                      dimmed={preview?.id === p.event.id}
                      onPointerDown={(e) => beginDrag(e, p.event, "move")}
                      onResizePointerDown={(e) => beginDrag(e, p.event, "resize")}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (movedRef.current) {
                          movedRef.current = false;
                          return;
                        }
                        openModal({ type: "detail", eventId: p.event.id });
                      }}
                    />
                  ))}

                  {laidOut[idx].overflow && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openModal({ type: "overflow", date: dayKey(d) });
                      }}
                      title={`Ver ${laidOut[idx].overflow!.count} eventos más`}
                      className="absolute right-1 z-20 flex h-[22px] items-center rounded-md border border-slate-200 bg-white px-1.5 text-[10px] font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
                      style={{
                        top: Math.max(px(laidOut[idx].overflow!.fromMin), 2),
                      }}
                    >
                      +{laidOut[idx].overflow!.count}
                    </button>
                  )}
                </div>
              ))}

              {/* Drag preview */}
              {preview && (
                <DayBlockPreview
                  preview={preview}
                  days={days}
                  event={eventsRef.current.get(preview.id)}
                />
              )}

              {/* Now line */}
              {nowDayIndex >= 0 && (
                <div
                  className="pointer-events-none absolute z-20"
                  style={{ top: px(nowMin), ...colStyle(nowDayIndex) }}
                >
                  <div className="relative h-px bg-rose-500">
                    <span className="absolute -left-1 -top-[3px] size-[7px] rounded-full bg-rose-500" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex shrink-0 items-center gap-2 border-t border-slate-200 bg-white px-4 py-1.5 text-xs text-slate-500">
          <Loader2 className="size-3.5 animate-spin" />
          Cargando eventos…
        </div>
      )}
    </div>
  );
}

function DayBlockPreview({
  preview,
  days,
  event,
}: {
  preview: Preview;
  days: 1 | 7;
  event?: Event;
}) {
  if (!event) return null;
  const style = getColorStyle(event.color);
  const heightMin = Math.max(preview.endMin - preview.startMin, 10);
  return (
    <div
      className={cn(
        "pointer-events-none absolute z-30 overflow-hidden rounded-md border opacity-70 ring-2 ring-sky-400/60",
        style.block
      )}
      style={{
        top: px(preview.startMin),
        height: px(heightMin),
        left: `${(preview.dayIndex / days) * 100}%`,
        width: `calc(${100 / days}% - 3px)`,
      }}
    >
      <span className={cn("absolute inset-y-0 left-0 w-0.5", style.accent)} />
      <div className="truncate px-1.5 py-0.5 text-[10px] font-semibold text-slate-800 sm:text-[11px]">
        {formatTime(combine(new Date(), Math.floor(preview.startMin / 60), preview.startMin % 60))}{" "}
        {event.title}
      </div>
    </div>
  );
}