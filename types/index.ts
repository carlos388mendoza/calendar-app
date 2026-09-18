/** A user-selectable calendar granularity. */
export type CalendarView = "day" | "week" | "month";

/** Available pastel category colors for events. */
export type EventColor =
  | "sky"
  | "rose"
  | "amber"
  | "emerald"
  | "violet"
  | "cyan"
  | "orange"
  | "lime";

/** A calendar event. Times are ISO 8601 strings (local timezone). */
export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  color: EventColor;
  allDay: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Payload used to create an event. */
export type EventInput = Omit<Event, "id" | "createdAt" | "updatedAt">;

/** Partial payload used to update an event. */
export type EventUpdate = Partial<EventInput>;

/** Modal dialog state managed by the calendar store. */
export type ModalState =
  | { type: "create"; date: string; hour?: number }
  | { type: "edit"; eventId: string }
  | { type: "detail"; eventId: string }
  | { type: "overflow"; date: string }
  | null;

/** Shape of an error returned by the API. */
export interface ApiError {
  error: string;
}

/** A day keyed by its ISO date (yyyy-MM-dd). */
export type DayEvents = Map<string, Event[]>;