"use client";

import { useMemo, type DragEvent as ReactDragEvent } from "react";
import { Loader2 } from "lucide-react";
import { EventChip } from "./EventChip";
import { cn } from "@/lib/cn";
import { useCalendarStore } from "@/store/useCalendarStore";
import {
  DAY_MS,
  endOfMonth,
  formatDayNumber,
  isSameDay,
  isSameMonth,
  isToday,
  monthGridDays,
  parseISO,
  startOfMonth,
  toISODate,
  toISO,
  addDays,
} from "@/lib/dates";
import type { Event } from "@/types";

const VISIBLE_EVENTS = 3;
const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function MonthView() {
  const currentDate = useCalendarStore((s) => s.currentDate);
  const events = useCalendarStore((s) => s.events);
  const loading = useCalendarStore((s) => s.loading);
  const openModal = useCalendarStore((s) => s.openModal);
  const updateEvent = useCalendarStore((s) => s.updateEvent);

  const days = useMemo(() => monthGridDays(currentDate), [currentDate]);

  const startIso = useMemo(
    () => toISO(startOfMonth(currentDate)),
    [currentDate]
  );
  const endExclusive = useMemo(
    () => toISO(addDays(endOfMonth(currentDate), 1)),
    [currentDate]
  );

  /** Events of the month indexed by day, already sorted by start time. */
  const byDay = useMemo(() => {
    const map = new Map<string, Event[]>();
    for (const ev of events.values()) {
      if (ev.startTime >= startIso && ev.startTime < endExclusive) {
        const key = ev.startTime.slice(0, 10);
        const arr = map.get(key);
        if (arr) arr.push(ev);
        else map.set(key, [ev]);
      }
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => a.startTime.localeCompare(b.startTime));
    }
    return map;
  }, [events, startIso, endExclusive]);

  const handleDrop = (e: ReactDragEvent, date: Date) => {
    const id = e.dataTransfer.getData("application/x-calendar-event");
    if (!id) return;
    const ev = events.get(id);
    if (!ev) return;

    const originKey = ev.startTime.slice(0, 10);
    const targetKey = toISODate(date);
    if (originKey === targetKey) return;

    const delta = Math.round(
      (parseISO(targetKey).getTime() - parseISO(originKey).getTime()) / DAY_MS
    );
    void updateEvent(id, {
      startTime: toISO(addDays(parseISO(ev.startTime), delta)),
      endTime: toISO(addDays(parseISO(ev.endTime), delta)),
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="grid shrink-0 grid-cols-7 border-b border-slate-200 bg-white py-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 sm:text-xs">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid flex-1 auto-rows-fr grid-cols-7 overflow-hidden bg-slate-200/50">
        {days.map((day) => {
          const key = toISODate(day);
          const dayEvents = byDay.get(key) ?? [];
          const visible = dayEvents.slice(0, VISIBLE_EVENTS);
          const extra = dayEvents.length - VISIBLE_EVENTS;
          const outOfMonth = !isSameMonth(day, currentDate);

          return (
            <div
              key={key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleDrop(e, day)}
              onClick={() => openModal({ type: "create", date: key })}
              className={cn(
                "group flex min-h-[88px] cursor-pointer flex-col gap-0.5 border-r border-b border-slate-200 bg-white p-1 transition-colors hover:bg-slate-50 sm:min-h-[110px] sm:p-1.5",
                outOfMonth && "bg-slate-50/80 text-slate-400",
                isToday(day) && "bg-sky-50/60"
              )}
            >
              <div className="flex items-center justify-end">
                {loading && dayEvents.length === 0 ? (
                  <span className="size-5 animate-pulse rounded-full bg-slate-200" />
                ) : (
                  <span
                    className={cn(
                      "inline-flex size-5 items-center justify-center rounded-full text-[11px] font-medium",
                      isSameDay(day, new Date()) &&
                        "bg-sky-600 text-white",
                      !isToday(day) && "text-slate-600"
                    )}
                  >
                    {formatDayNumber(day)}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-0.5 overflow-hidden">
                {visible.map((ev) => (
                  <EventChip
                    key={ev.id}
                    event={ev}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("application/x-calendar-event", ev.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal({ type: "detail", eventId: ev.id });
                    }}
                  />
                ))}
                {extra > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal({ type: "overflow", date: key });
                    }}
                    className="w-full rounded-md bg-slate-100 px-1.5 py-0.5 text-left text-[11px] font-medium text-slate-600 transition-colors hover:bg-slate-200"
                  >
                    +{extra} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
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