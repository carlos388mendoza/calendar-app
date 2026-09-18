"use client";

import { CalendarDays, Loader2, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { getColorStyle } from "@/lib/colors";
import { formatEventRange, parseISO, toISODate } from "@/lib/dates";
import { useCalendarStore } from "@/store/useCalendarStore";

/** Debounced search input with a results dropdown. */
export function SearchBox() {
  const searchQuery = useCalendarStore((s) => s.searchQuery);
  const searchResults = useCalendarStore((s) => s.searchResults);
  const searching = useCalendarStore((s) => s.searching);
  const runSearch = useCalendarStore((s) => s.runSearch);
  const clearSearch = useCalendarStore((s) => s.clearSearch);
  const setCurrentDate = useCalendarStore((s) => s.setCurrentDate);
  const setView = useCalendarStore((s) => s.setView);
  const openModal = useCalendarStore((s) => s.openModal);
  const setSidebarOpen = useCalendarStore((s) => s.setSidebarOpen);

  const [value, setValue] = useState(searchQuery);

  useEffect(() => {
    const t = setTimeout(() => {
      void runSearch(value);
    }, 300);
    return () => clearTimeout(t);
  }, [value, runSearch]);

  const showResults = value.trim().length >= 2;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Buscar eventos…"
          className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-9 text-sm text-slate-700 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        {searching ? (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-slate-400" />
        ) : value ? (
          <button
            onClick={() => {
              setValue("");
              clearSearch();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {showResults && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-72 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
          {searchResults === null || searchResults.length === 0 ? (
            <p className="px-3 py-4 text-sm text-slate-500">
              {searching ? "Buscando…" : "Sin resultados"}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {searchResults.map((ev) => (
                <li key={ev.id}>
                  <button
                    onClick={() => {
                      setCurrentDate(parseISO(ev.startTime));
                      setView("day");
                      openModal({ type: "detail", eventId: ev.id });
                      setSidebarOpen(false);
                    }}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-slate-50"
                  >
                    <span
                      className={cn("mt-1.5 size-2 shrink-0 rounded-full", getColorStyle(ev.color).dot)}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {ev.title}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {toISODate(parseISO(ev.startTime))} · {formatEventRange(ev)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function SidebarBrand() {
  return (
    <div className="flex items-center gap-2 px-1">
      <span className="flex size-9 items-center justify-center rounded-lg bg-sky-600 text-white">
        <CalendarDays className="size-5" />
      </span>
      <div className="leading-tight">
        <p className="text-sm font-semibold text-slate-800">Calendario</p>
        <p className="text-xs text-slate-500">Gestión de eventos</p>
      </div>
    </div>
  );
}