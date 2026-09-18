import type { ReactNode } from "react";
import { getColorStyle } from "@/lib/colors";
import { cn } from "@/lib/cn";
import type { EventColor } from "@/types";

export interface BadgeProps {
  children: ReactNode;
  color?: EventColor;
  className?: string;
}

export function Badge({ children, color = "sky", className }: BadgeProps) {
  const style = getColorStyle(color);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
        style.chip,
        className
      )}
    >
      <span className={cn("size-1.5 rounded-full", style.dot)} />
      {children}
    </span>
  );
}