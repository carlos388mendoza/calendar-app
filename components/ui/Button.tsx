"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: "bg-sky-600 text-white hover:bg-sky-700 shadow-sm",
  secondary: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-200/70",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm",
  outline: "border border-slate-300 text-slate-700 hover:border-sky-400 hover:text-sky-700",
};

const SIZES: Record<Size, string> = {
  sm: "text-xs px-2.5 py-1.5",
  md: "text-sm px-3.5 py-2",
  icon: "p-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center gap-1.5 rounded-lg font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}