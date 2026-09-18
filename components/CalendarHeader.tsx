"use client";

import { ChevronLeft, ChevronRight, Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatHeaderTitle, toISODate } from "@/lib/dates";
import { useCalendarStore } from "@/store/useCalendarStore";
import type { CalendarView } from "@/types";

const VIEWS: { value: CalendarView; label: string }[] = [
  { value: "day", label: "Día" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
];

export function CalendarHeader() {
  const currentDate = useCalendarStore((s) => s.currentDate);
  const view = useCalendarStore((s) => s.view);
  const setView = useCalendarStore((s) => s.setView);
  const navigate = useCalendarStore((s) => s.navigate);
  const goToday = useCalendarStore((s) => s.goToday);
  const openModal = useCalendarStore((s) => s.openModal);
  const sidebarOpen = useCalendarStore((s) => s.sidebarOpen);
  const setSidebarOpen = useCalendarStore((s) => s.setSidebarOpen);

  return (
    <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 sm:gap-3 sm:px-5">
      <button
        className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Abrir menú"
      >
        <Menu className="size-5" />
      </button>

      <div className="flex items-center gap-1.5">
        <Button variant="secondary" size="icon" onClick={() => navigate(-1)} aria-label="Anterior">
          <ChevronLeft className="size-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={() => navigate(1)} aria-label="Siguiente">
          <ChevronRight className="size-4" />
        </Button>
        <Button variant="secondary" size="sm" onClick={goToday}>
          Hoy
        </Button>
      </div>

      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 sm:text-lg">
        {formatHeaderTitle(currentDate, view)}
      </h1>

      <div className="flex items-center gap-2">
        <div className="flex rounded-lg border border-slate-300 bg-white p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.value}
              onClick={() => setView(v.value)}
              className={cn(
                "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                view === v.value
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              )}
            >
              {v.label}
            </button>
          ))}
        </div>

        <Button onClick={() => openModal({ type: "create", date: toISODate(currentDate) })}>
          <Plus className="size-4" />
          <span className="hidden sm:inline">Nuevo evento</span>
        </Button>
      </div>
    </header>
  );
}