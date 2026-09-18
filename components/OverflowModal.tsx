"use client";

import { useMemo } from "react";
import { FixedSizeList } from "react-window";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { getColorStyle } from "@/lib/colors";
import { formatEventRange, formatLongDate, parseISO } from "@/lib/dates";
import { useCalendarStore } from "@/store/useCalendarStore";

const ITEM_HEIGHT = 56;

/**
 * Lists every event of a single day.
 * Virtualized with react-window so days with thousands of events stay smooth.
 */
export function OverflowModal({ date }: { date: string }) {
  const events = useCalendarStore((s) => s.events);
  const closeModal = useCalendarStore((s) => s.closeModal);
  const openModal = useCalendarStore((s) => s.openModal);

  const list = useMemo(
    () =>
      [...events.values()]
        .filter((ev) => ev.startTime.slice(0, 10) === date)
        .sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [events, date]
  );

  const listHeight = Math.min(440, Math.max(ITEM_HEIGHT, list.length * ITEM_HEIGHT));

  return (
    <Modal
      open
      onClose={closeModal}
      title={`${formatLongDate(parseISO(date))} · ${list.length} eventos`}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={closeModal}>
            Cerrar
          </Button>
          <Button onClick={() => openModal({ type: "create", date })}>Nuevo evento</Button>
        </>
      }
    >
      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No hay eventos este día.</p>
      ) : (
        <FixedSizeList
          height={listHeight}
          width="100%"
          itemCount={list.length}
          itemSize={ITEM_HEIGHT}
          itemKey={(index) => list[index].id}
          className="-mx-1"
        >
          {({ index, style }) => {
            const ev = list[index];
            return (
              <div style={style} className="px-1 py-0.5">
                <button
                  onClick={() => openModal({ type: "detail", eventId: ev.id })}
                  className="flex h-[52px] w-full items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 text-left transition-colors hover:bg-slate-50"
                >
                  <span
                    className={cn("size-2.5 shrink-0 rounded-full", getColorStyle(ev.color).dot)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-800">
                      {ev.title}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {formatEventRange(ev)}
                      {ev.description ? ` · ${ev.description}` : ""}
                    </span>
                  </span>
                </button>
              </div>
            );
          }}
        </FixedSizeList>
      )}
    </Modal>
  );
}