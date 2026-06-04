import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex w-full min-w-0 flex-wrap items-start justify-between gap-3 sm:gap-4">
      <div className="min-w-0 flex-1 basis-full sm:basis-auto">
        <h1 className="text-xl font-bold tracking-tight break-words sm:text-2xl [overflow-wrap:anywhere]">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-1 text-sm break-words [overflow-wrap:anywhere]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
