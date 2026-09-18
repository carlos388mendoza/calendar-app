"use client";

import { cn } from "@/lib/cn";
import { useCalendarStore } from "@/store/useCalendarStore";
import { SearchBox, SidebarBrand } from "./SearchBox";
import { UpcomingList } from "./UpcomingList";

/** Left navigation panel. Slides over the content on mobile. */
export function Sidebar() {
  const open = useCalendarStore((s) => s.sidebarOpen);
  const setOpen = useCalendarStore((s) => s.setSidebarOpen);

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden",
          open ? "block" : "hidden"
        )}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col gap-5 border-r border-slate-200 bg-white p-4 transition-transform duration-200",
          "md:static md:z-auto md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarBrand />
        <SearchBox />
        <UpcomingList />
        <div className="mt-auto rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
          Arrastra eventos en el calendario para moverlos y redimensiona los
          bordes en las vistas de Día/Semana.
        </div>
      </aside>
    </>
  );
}