import { create } from "zustand";
import * as api from "@/lib/api";
import { navigateDate, rangeForView, toISO } from "@/lib/dates";
import type {
  CalendarView,
  Event,
  EventInput,
  EventUpdate,
  ModalState,
} from "@/types";

interface CalendarState {
  view: CalendarView;
  currentDate: Date;
  /** Events for the currently loaded range, keyed by id. */
  events: Map<string, Event>;
  loading: boolean;
  error: string | null;
  /** Cache key of the last loaded range so we don't refetch. */
  rangeKey: string | null;

  modal: ModalState;
  searchQuery: string;
  searchResults: Event[] | null;
  searching: boolean;
  sidebarOpen: boolean;

  setView: (view: CalendarView) => void;
  setCurrentDate: (date: Date) => void;
  navigate: (dir: 1 | -1) => void;
  goToday: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modal: ModalState) => void;
  closeModal: () => void;
  setError: (error: string | null) => void;

  loadRange: () => Promise<void>;
  createEvent: (input: EventInput) => Promise<Event>;
  updateEvent: (id: string, patch: EventUpdate) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  runSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

export const useCalendarStore = create<CalendarState>()((set, get) => ({
  view: "month",
  currentDate: new Date(),
  events: new Map(),
  loading: true,
  error: null,
  rangeKey: null,

  modal: null,
  searchQuery: "",
  searchResults: null,
  searching: false,
  sidebarOpen: false,

  setView: (view) => {
    // CalendarShell's effect reloads the visible range when the view changes.
    set({ view });
  },

  setCurrentDate: (date) => {
    set({ currentDate: date });
  },

  navigate: (dir) => {
    const { view, currentDate } = get();
    set({ currentDate: navigateDate(currentDate, view, dir) });
  },

  goToday: () => {
    set({ currentDate: new Date() });
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  openModal: (modal) => set({ modal }),
  closeModal: () => set({ modal: null }),
  setError: (error) => set({ error }),

  loadRange: async () => {
    const { view, currentDate, rangeKey } = get();
    const r = rangeForView(currentDate, view);
    const key = `${view}|${toISO(r.start)}|${toISO(r.end)}`;

    if (key === rangeKey && !get().loading) return;

    set({ loading: true, error: null });
    try {
      const fetched = await api.fetchEvents(toISO(r.start), toISO(r.end));
      set((state) => {
        const next = new Map(state.events);
        const s = toISO(r.start);
        const e = toISO(r.end);
        // Drop stale events inside this range, then reinsert from server.
        for (const [id, ev] of next) {
          if (ev.startTime < e && ev.endTime > s) next.delete(id);
        }
        for (const ev of fetched) next.set(ev.id, ev);
        return { events: next, loading: false, rangeKey: key };
      });
    } catch (err) {
      set({
        loading: false,
        error: err instanceof Error ? err.message : "Error al cargar los eventos.",
      });
    }
  },

  createEvent: async (input) => {
    set({ error: null });
    try {
      const created = await api.createEvent(input);
      set((state) => {
        const next = new Map(state.events);
        next.set(created.id, created);
        return { events: next };
      });
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al crear el evento.";
      set({ error: message });
      throw new Error(message);
    }
  },

  updateEvent: async (id, patch) => {
    const prev = get().events.get(id);
    if (!prev) return;

    // Optimistic update
    set((state) => {
      const next = new Map(state.events);
      next.set(id, { ...prev, ...patch, updatedAt: new Date().toISOString() });
      return { events: next, error: null };
    });

    try {
      const updated = await api.updateEvent(id, patch);
      set((state) => {
        const next = new Map(state.events);
        next.set(id, updated);
        return { events: next };
      });
    } catch (err) {
      // Revert on failure
      set((state) => {
        const next = new Map(state.events);
        next.set(id, prev);
        return { events: next };
      });
      const message = err instanceof Error ? err.message : "Error al actualizar el evento.";
      set({ error: message });
      throw new Error(message);
    }
  },

  deleteEvent: async (id) => {
    const prev = get().events.get(id);
    if (!prev) return;

    set((state) => {
      const next = new Map(state.events);
      next.delete(id);
      return { events: next, error: null };
    });

    try {
      await api.deleteEvent(id);
    } catch (err) {
      set((state) => {
        const next = new Map(state.events);
        next.set(id, prev);
        return { events: next };
      });
      const message = err instanceof Error ? err.message : "Error al eliminar el evento.";
      set({ error: message });
      throw new Error(message);
    }
  },

  runSearch: async (query) => {
    const q = query.trim();
    set({ searchQuery: q });
    if (q.length < 2) {
      set({ searchResults: null, searching: false });
      return;
    }
    set({ searching: true });
    try {
      const results = await api.searchEvents(q);
      set({ searchResults: results, searching: false, error: null });
    } catch {
      set({ searchResults: [], searching: false });
    }
  },

  clearSearch: () => set({ searchQuery: "", searchResults: null, searching: false }),
}));