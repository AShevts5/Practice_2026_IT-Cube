import { cn } from "@/shared/lib/css";

export function sidebarNavLinkClass(isActive: boolean) {
  return cn(
    "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-primary/10 text-primary font-medium"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}
