"use client";

import { useMemo } from "react";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/cn";
import { getColorStyle } from "@/lib/colors";
import { isToday, parseISO, formatEventRange } from "@/lib/dates";
import { useCalendarStore } from "@/store/useCalendarStore";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/** Compact list of the next events, used in the sidebar. */
export function UpcomingList() {
  const events = useCalendarStore((s) => s.events);
  const setCurrentDate = useCalendarStore((s) => s.setCurrentDate);
  const setView = useCalendarStore((s) => s.setView);
  const openModal = useCalendarStore((s) => s.openModal);
  const setSidebarOpen = useCalendarStore((s) => s.setSidebarOpen);

  const upcoming = useMemo(() => {
    const now = Date.now();
    return [...events.values()]
      .filter((ev) => parseISO(ev.endTime).getTime() >= now)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .slice(0, 8);
  }, [events]);

  const goTo = (eventId: string, startTime: string) => {
    setCurrentDate(parseISO(startTime));
    setView("day");
    openModal({ type: "detail", eventId });
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-0 flex-col">
      <h2 className="px-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Próximos eventos
      </h2>
      {upcoming.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-500">
          <CalendarClock className="size-5 text-slate-400" />
          No hay eventos próximos en este rango
        </div>
      ) : (
        <ul className="min-h-0 space-y-1 overflow-y-auto pr-1">
          {upcoming.map((ev) => {
            const start = parseISO(ev.startTime);
            return (
              <li key={ev.id}>
                <button
                  onClick={() => goTo(ev.id, ev.startTime)}
                  className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left transition-colors hover:bg-slate-100"
                >
                  <span
                    className={cn(
                      "mt-1 h-8 w-1 shrink-0 rounded-full",
                      getColorStyle(ev.color).accent
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {ev.title}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {isToday(start)
                        ? "Hoy"
                        : format(start, "EEE d MMM", { locale: es })}{" "}
                      · {formatEventRange(ev)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}