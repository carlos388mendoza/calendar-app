"use client";

import { memo, type DragEvent as ReactDragEvent, type MouseEvent as ReactMouseEvent } from "react";
import { getColorStyle } from "@/lib/colors";
import { cn } from "@/lib/cn";
import { formatTime } from "@/lib/dates";
import type { Event } from "@/types";

export interface EventChipProps {
  event: Event;
  onClick?: (e: ReactMouseEvent) => void;
  onDragStart?: (e: ReactDragEvent) => void;
  showTime?: boolean;
  className?: string;
}

/** Small pastel chip used inside month cells. */
export const EventChip = memo(function EventChip({
  event,
  onClick,
  onDragStart,
  showTime = true,
  className,
}: EventChipProps) {
  const style = getColorStyle(event.color);
  const label = event.allDay || !showTime
    ? event.title
    : `${formatTime(event.startTime)} ${event.title}`;

  return (
    <div
      draggable={Boolean(onDragStart)}
      onDragStart={onDragStart}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={label}
      className={cn(
        "relative w-full cursor-pointer overflow-hidden rounded-md border border-l-0 py-0.5 pl-2 pr-1 text-left text-[11px] leading-4 sm:text-xs",
        style.chip,
        className
      )}
    >
      <span className={cn("pointer-events-none absolute inset-y-0 left-0 w-1", style.accent)} />
      <span className="block truncate">{label}</span>
    </div>
  );
});