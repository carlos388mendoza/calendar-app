"use client";

import { useState } from "react";
import { CalendarX2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EVENT_COLOR_LABELS } from "@/lib/colors";
import { formatLongDate, formatTime, parseISO } from "@/lib/dates";
import { useCalendarStore } from "@/store/useCalendarStore";

export function EventDetail({ eventId }: { eventId: string }) {
  const event = useCalendarStore((s) => s.events.get(eventId));
  const openModal = useCalendarStore((s) => s.openModal);
  const closeModal = useCalendarStore((s) => s.closeModal);
  const deleteEvent = useCalendarStore((s) => s.deleteEvent);

  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!event) {
    return (
      <Modal open onClose={closeModal} title="Evento" size="sm">
        <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-slate-500">
          <CalendarX2 className="size-6 text-slate-400" />
          El evento ya no existe.
        </div>
      </Modal>
    );
  }

  const handleDelete = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await deleteEvent(event.id);
      closeModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar el evento.");
    } finally {
      setBusy(false);
    }
  };

  const start = parseISO(event.startTime);
  const end = parseISO(event.endTime);

  return (
    <Modal
      open
      onClose={closeModal}
      title={event.title}
      size="md"
      footer={
        <>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            disabled={busy}
            className="mr-auto"
          >
            {confirming ? "Confirmar eliminación" : "Eliminar"}
          </Button>
          <Button variant="secondary" size="sm" onClick={closeModal} disabled={busy}>
            Cerrar
          </Button>
          <Button
            size="sm"
            onClick={() => openModal({ type: "edit", eventId: event.id })}
            disabled={busy}
          >
            Editar
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Badge color={event.color}>{EVENT_COLOR_LABELS[event.color]}</Badge>

        <div className="space-y-1 text-sm text-slate-700">
          <p className="font-medium">{formatLongDate(start)}</p>
          <p className="text-slate-500">
            {event.allDay
              ? "Todo el día"
              : `${formatTime(event.startTime)} – ${formatTime(event.endTime)}`}
          </p>
          <p className="text-xs text-slate-400">
            Duración: {Math.max(1, Math.round((end.getTime() - start.getTime()) / 60000))} min
          </p>
        </div>

        {event.description ? (
          <p className="whitespace-pre-wrap rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {event.description}
          </p>
        ) : (
          <p className="text-sm italic text-slate-400">Sin descripción</p>
        )}

        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        )}
      </div>
    </Modal>
  );
}