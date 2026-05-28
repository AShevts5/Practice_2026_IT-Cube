import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { cn } from "@/shared/lib/css";

export function CabinetThemeToggle({ className }: { className?: string }) {
  return <ThemeToggle labeled className={cn("rounded-2xl", className)} />;
}
