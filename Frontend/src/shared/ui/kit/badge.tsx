import type { ReactNode } from "react";
import { cn } from "@/shared/lib/css";

const variants = {
  default: "bg-primary text-primary-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  outline: "border border-border text-foreground",
  success: "bg-emerald-600/15 text-emerald-700 dark:text-emerald-400",
  warning: "bg-amber-600/15 text-amber-800 dark:text-amber-400",
  muted: "bg-muted text-muted-foreground",
} as const;

export function Badge({
  className,
  variant = "default",
  children,
}: {
  className?: string;
  variant?: keyof typeof variants;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
