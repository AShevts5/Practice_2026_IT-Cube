import { cn } from "@/shared/lib/css";
import { getCaseCatalogItem } from "../model/case-catalog.ts";

export function CaseCard({
  title,
  description,
  selected,
  occupied,
  limit,
  onSelect,
}: {
  title: string;
  description: string;
  selected: boolean;
  occupied: number;
  limit: number;
  onSelect: () => void;
}) {
  const catalog = getCaseCatalogItem(title, title, { description });
  const full = limit > 0 && occupied >= limit;

  return (
    <button
      type="button"
      disabled={full && !selected}
      onClick={onSelect}
      className={cn(
        "group relative w-full max-w-none rounded-2xl border bg-card p-4 pr-16 pt-4 text-left transition-all",
        "shadow-sm hover:shadow-md dark:shadow-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-violet-500 shadow-md ring-1 ring-violet-500/40"
          : "border-border hover:border-border/90",
      )}
    >
      <span className="absolute right-4 top-4 rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums">
        {occupied}/{limit}
      </span>
      <h3 className="text-base font-semibold leading-snug">{catalog.title}</h3>
      <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-snug">
        {catalog.description}
      </p>
    </button>
  );
}
