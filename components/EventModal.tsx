"use client";

import { EventDetail } from "./EventDetail";
import { EventForm } from "./EventForm";
import { OverflowModal } from "./OverflowModal";
import { useCalendarStore } from "@/store/useCalendarStore";

/** Single entry point that renders whichever modal the store asks for. */
export function EventModal() {
  const modal = useCalendarStore((s) => s.modal);

  if (!modal) return null;

  if (modal.type === "create") {
    return (
      <EventForm key="create" mode="create" date={modal.date} hour={modal.hour} />
    );
  }
  if (modal.type === "edit") {
    return <EventForm key={`edit-${modal.eventId}`} mode="edit" eventId={modal.eventId} />;
  }
  if (modal.type === "detail") {
    return <EventDetail key={`detail-${modal.eventId}`} eventId={modal.eventId} />;
  }
  if (modal.type === "overflow") {
    return <OverflowModal key={`overflow-${modal.date}`} date={modal.date} />;
  }
  return null;
}