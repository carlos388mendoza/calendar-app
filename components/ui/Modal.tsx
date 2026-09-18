"use client";

import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  footer?: ReactNode;
}

const SIZES: Record<NonNullable<ModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({ open, onClose, title, children, size = "md", footer }: ModalProps) {
  // Guard for SSR: portals only exist on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-xl",
          SIZES[size]
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 px-4 py-3.5 sm:px-6">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
            <X className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
        {footer ? (
          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-4 py-3 sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}