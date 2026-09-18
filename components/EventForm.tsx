"use client";

import { useMemo, useState, type FormEvent } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { EVENT_COLOR_LABELS, EVENT_COLOR_LIST, getColorStyle } from "@/lib/colors";
import { combine, parseISO, toISODate } from "@/lib/dates";
import { useCalendarStore } from "@/store/useCalendarStore";
import type { EventColor, EventInput } from "@/types";

export interface EventFormProps {
  mode: "create" | "edit";
  date?: string;
  hour?: number;
  eventId?: string;
}

const pad = (n: number) => String(n).padStart(2, "0");

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200 disabled:bg-slate-100 disabled:text-slate-400";

const labelClass = "mb-1 block text-xs font-medium text-slate-600";

export function EventForm({ mode, date, hour, eventId }: EventFormProps) {
  const events = useCalendarStore((s) => s.events);
  const createEvent = useCalendarStore((s) => s.createEvent);
  const updateEvent = useCalendarStore((s) => s.updateEvent);
  const closeModal = useCalendarStore((s) => s.closeModal);
  const setCurrentDate = useCalendarStore((s) => s.setCurrentDate);

  const existing = mode === "edit" && eventId ? events.get(eventId) : undefined;

  const defaults = useMemo(() => {
    if (existing) {
      return {
        title: existing.title,
        description: existing.description,
        color: existing.color,
        allDay: existing.allDay,
        startDate: existing.startTime.slice(0, 10),
        startTime: existing.startTime.slice(11, 16),
        endDate: existing.endTime.slice(0, 10),
        endTime: existing.endTime.slice(11, 16),
      };
    }
    const d = date ?? toISODate(new Date());
    const h = hour ?? 9;
    return {
      title: "",
      description: "",
      color: "sky" as EventColor,
      allDay: false,
      startDate: d,
      startTime: `${pad(h)}:00`,
      endDate: d,
      endTime: `${pad(Math.min(h + 1, 23))}:00`,
    };
  }, [existing, date, hour]);

  const [title, setTitle] = useState(defaults.title);
  const [description, setDescription] = useState(defaults.description);
  const [color, setColor] = useState<EventColor>(defaults.color);
  const [allDay, setAllDay] = useState(defaults.allDay);
  const [startDate, setStartDate] = useState(defaults.startDate);
  const [startTime, setStartTime] = useState(defaults.startTime);
  const [endDate, setEndDate] = useState(defaults.endDate);
  const [endTime, setEndTime] = useState(defaults.endTime);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const buildInput = (): EventInput | string => {
    const t = title.trim();
    if (!t) return "El título es obligatorio.";
    if (!allDay && startDate !== endDate) {
      return "Los eventos con hora deben ocurrir dentro de un mismo día.";
    }
    const startIso = allDay
      ? combine(startDate, 0, 0)
      : combine(startDate, Number(startTime.slice(0, 2)), Number(startTime.slice(3, 5)));
    const endIso = allDay
      ? combine(endDate, 23, 59)
      : combine(endDate, Number(endTime.slice(0, 2)), Number(endTime.slice(3, 5)));
    if (parseISO(endIso).getTime() <= parseISO(startIso).getTime()) {
      return "El fin debe ser posterior al inicio.";
    }
    return {
      title: t,
      description: description.trim(),
      color,
      allDay,
      startTime: startIso,
      endTime: endIso,
    };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const result = buildInput();
    if (typeof result === "string") {
      setError(result);
      return;
    }
    setSaving(true);
    try {
      if (mode === "edit" && eventId) {
        await updateEvent(eventId, result);
      } else {
        await createEvent(result);
      }
      setCurrentDate(parseISO(result.startTime));
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el evento.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={closeModal}
      title={mode === "create" ? "Nuevo evento" : "Editar evento"}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={closeModal} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" form="event-form" disabled={saving}>
            {saving ? "Guardando…" : mode === "create" ? "Crear evento" : "Guardar cambios"}
          </Button>
        </>
      }
    >
      <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="ev-title">
            Título
          </label>
          <input
            id="ev-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="Ej. Reunión de equipo"
            className={inputClass}
          />
        </div>

        <div>
          <span className={labelClass}>Categoría / color</span>
          <div className="flex flex-wrap gap-2">
            {EVENT_COLOR_LIST.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                title={EVENT_COLOR_LABELS[c]}
                aria-label={EVENT_COLOR_LABELS[c]}
                className={cn(
                  "size-7 rounded-full border border-slate-200 transition-transform hover:scale-110",
                  c === color ? getColorStyle(c).picker : getColorStyle(c).block
                )}
              />
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="size-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
          />
          Todo el día
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass} htmlFor="ev-start-date">
              Fecha inicio
            </label>
            <input
              id="ev-start-date"
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                if (e.target.value && e.target.value > endDate) setEndDate(e.target.value);
              }}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="ev-start-time">
              Hora inicio
            </label>
            <input
              id="ev-start-time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              disabled={allDay}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="ev-end-date">
              Fecha fin
            </label>
            <input
              id="ev-end-date"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass} htmlFor="ev-end-time">
              Hora fin
            </label>
            <input
              id="ev-end-time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              disabled={allDay}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass} htmlFor="ev-desc">
            Descripción
          </label>
          <textarea
            id="ev-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Notas, ubicación, enlaces…"
            className={cn(inputClass, "resize-none")}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
      </form>
    </Modal>
  );
}