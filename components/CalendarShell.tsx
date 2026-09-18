"use client";

import { useEffect } from "react";
import { CalendarHeader } from "./CalendarHeader";
import { EventModal } from "./EventModal";
import { Sidebar } from "./Sidebar";
import { MonthView } from "./calendar/MonthView";
import { TimeGridView } from "./calendar/TimeGridView";
import { useCalendarStore } from "@/store/useCalendarStore";

/**
 * Top-level client shell: sidebar + header + the active calendar view.
 * Loads the events for the visible range whenever the view or date changes.
 */
export function CalendarShell() {
  const view = useCalendarStore((s) => s.view);
  const currentDate = useCalendarStore((s) => s.currentDate);
  const loadRange = useCalendarStore((s) => s.loadRange);

  useEffect(() => {
    void loadRange();
  }, [view, currentDate, loadRange]);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <CalendarHeader />
        <main className="min-h-0 flex-1 overflow-hidden bg-white">
          {view === "month" && <MonthView />}
          {view === "week" && <TimeGridView days={7} />}
          {view === "day" && <TimeGridView days={1} />}
        </main>
      </div>
      <EventModal />
    </div>
  );
}