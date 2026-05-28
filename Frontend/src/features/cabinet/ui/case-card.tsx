import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { cn } from "@/shared/lib/css";
import { getCaseCatalogItem } from "../model/case-catalog.ts";

export function CaseCard({
  caseItem,
  selected,
  disabled,
  onSelect,
}: {
  caseItem: ApiSchemas["Case"];
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const catalog = getCaseCatalogItem(caseItem.id, caseItem.name, {
    description: caseItem.description,
    keywords: caseItem.keywords,
  });
  const full = caseItem.free <= 0;

  return (
    <button
      type="button"
      disabled={disabled || (full && !selected)}
      onClick={onSelect}
      className={cn(
        "group relative w-full max-w-none rounded-2xl border bg-card p-4 pr-16 pt-4 text-left transition-all",
        "shadow-sm hover:shadow-md dark:shadow-none",
        "disabled:cursor-not-allowed disabled:opacity-50",
        selected
          ? "border-violet-500 shadow-md ring-1 ring-violet-500/40 dark:shadow-[0_0_32px_rgba(139,92,246,0.28)] dark:ring-violet-500/80"
          : "border-border hover:border-border/90",
      )}
    >
      <span
        className={cn(
          "absolute right-4 top-4 rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums",
          full && !selected
            ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-transparent dark:text-rose-300"
            : "border-border bg-muted text-muted-foreground",
        )}
      >
        {caseItem.occupied}/{caseItem.limit}
      </span>

      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border-2",
            selected
              ? "border-violet-500 bg-violet-500"
              : "border-muted-foreground/30 bg-transparent",
          )}
        >
          {selected ? (
            <span className="size-2 rounded-full bg-white" />
          ) : null}
        </span>
        <span
          className={cn(
            "text-xs font-bold tracking-wide uppercase",
            catalog.partnerColor,
          )}
        >
          {catalog.partner}
        </span>
      </div>

      <h3 className="mt-3 text-base font-semibold leading-snug">{catalog.title}</h3>
      <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-snug">
        {catalog.description}
      </p>

      {catalog.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {catalog.tags.map((tagItem) => (
            <span
              key={tagItem.label}
              className={cn(
                "rounded-lg border px-2 py-0.5 text-xs font-medium",
                tagItem.className,
              )}
            >
              {tagItem.label}
            </span>
          ))}
        </div>
      ) : null}
    </button>
  );
}
