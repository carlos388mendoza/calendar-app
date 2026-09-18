import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}