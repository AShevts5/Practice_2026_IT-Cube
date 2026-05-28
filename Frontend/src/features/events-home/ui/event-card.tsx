import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { publicRqClient } from "@/shared/api/instance";
import {
  getEventBrand,
  getEventTags,
} from "@/features/events-home/model/event-meta.ts";
import { getCaseCatalogItem } from "@/features/cabinet";
import { pathTo, ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { cn } from "@/shared/lib/css";
import { Button } from "@/shared/ui/kit/button";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { Link } from "react-router-dom";
import { CalendarIcon, ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusLabels: Record<ApiSchemas["Event"]["status"], string> = {
  active: "Активно",
  completed: "Завершено",
  draft: "Черновик",
};

const statusClass: Record<ApiSchemas["Event"]["status"], string> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-transparent dark:text-emerald-300",
  completed:
    "border-border bg-muted text-muted-foreground",
  draft:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-300",
};

const tagClass =
  "rounded-lg border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 dark:border-violet-500/50 dark:bg-transparent dark:text-violet-300";

function formatEventDates(startsAt?: string, endsAt?: string) {
  if (!startsAt) return null;
  const start = new Date(startsAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
  if (!endsAt) return start;
  const end = new Date(endsAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return `${start} — ${end}`;
}

function caseOccupancyClasses(occupied: number, limit: number) {
  const ratio = limit > 0 ? occupied / limit : 0;

  if (ratio >= 0.8) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-transparent dark:text-rose-300";
  }
  if (ratio >= 0.5) {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-300";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-transparent dark:text-emerald-300";
}

function EventCardCases({
  slug,
  cases,
  expanded,
  isPending,
  isError,
}: {
  slug: string;
  cases: ApiSchemas["Case"][];
  expanded: boolean;
  isPending: boolean;
  isError: boolean;
}) {
  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows] duration-300 ease-in-out",
        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
      )}
    >
      <div className="overflow-hidden">
        <div className="border-border/60 mt-4 border-t pt-4">
          <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-wide uppercase">
            Кейсы и места
          </p>
          {isPending ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : isError ? (
            <p className="text-destructive text-sm">Не удалось загрузить кейсы</p>
          ) : (
            <>
              <ul className="flex flex-col gap-2">
                {cases.map((caseItem) => (
                  <li key={caseItem.id}>
                    <Link
                      to={pathTo(ROUTES.EVENT_CASE, {
                        slug,
                        caseId: caseItem.id,
                      })}
                      className="group relative block rounded-xl border bg-muted/30 px-4 py-3 pr-16 text-sm transition-colors hover:bg-muted/45"
                    >
                      <span
                        className={cn(
                          "rounded-full border px-2.5 py-0.5 absolute right-4 top-3 text-xs font-semibold tabular-nums",
                          caseOccupancyClasses(caseItem.occupied, caseItem.limit),
                        )}
                      >
                        {caseItem.occupied}/{caseItem.limit}
                      </span>
                      <span className="font-medium leading-snug">
                        {caseItem.name}
                      </span>
                      <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-snug">
                        {
                          getCaseCatalogItem(caseItem.id, caseItem.name, {
                            description: caseItem.description,
                            keywords: caseItem.keywords,
                          }).description
                        }
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventCard({ event }: { event: ApiSchemas["Event"] }) {
  const [expanded, setExpanded] = useState(false);
  const { isAuthenticated, session } = useSession();
  const {
    data: casesData,
    isPending: isCasesPending,
    isError: isCasesError,
  } = publicRqClient.useQuery("get", "/events/{slug}/cases", {
    params: { path: { slug: event.slug } },
  });
  const cases = casesData?.cases ?? [];
  const totalLimit = cases.reduce((sum, c) => sum + c.limit, 0);
  const occupiedTotal = cases.reduce((sum, c) => sum + c.occupied, 0);
  const tags = getEventTags(event.slug, event.keywords);
  const brand = getEventBrand(event.slug);
  const dates = formatEventDates(event.startsAt, event.endsAt);
  const fewSpots = event.freeSpotsTotal <= 5 && event.freeSpotsTotal > 0;

  const handleRegisterClick = () => {
    toast.info("Войдите в аккаунт, чтобы зарегистрировать команду");
  };

  return (
    <article
      className={cn(
        "relative w-full max-w-none rounded-2xl border bg-card p-4 pr-24 pt-4 shadow-sm transition-shadow",
        "hover:shadow-md dark:shadow-none",
        event.status === "active"
          ? "border-border hover:border-violet-300/60 dark:hover:border-violet-500/40"
          : "border-border",
      )}
    >
      <div className="absolute right-4 top-4 flex flex-col items-end gap-1.5">
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums",
            fewSpots
              ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/40 dark:bg-transparent dark:text-rose-300"
              : "border-border bg-muted text-muted-foreground",
          )}
        >
          {cases.length > 0 && !isCasesError
            ? `${occupiedTotal}/${totalLimit} мест`
            : `${event.freeSpotsTotal} мест`}
        </span>
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-medium",
            statusClass[event.status],
          )}
        >
          {statusLabels[event.status]}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className="ring-violet-200 dark:ring-violet-500/40 size-2.5 shrink-0 rounded-full bg-violet-600 ring-4"
          aria-hidden
        />
        <span className="text-violet-700 dark:text-violet-300 text-xs font-bold tracking-wide uppercase">
          {brand}
        </span>
      </div>

      <h2 className="mt-3 text-base font-semibold leading-snug">{event.title}</h2>

      {dates ? (
        <p className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-sm">
          <CalendarIcon className="size-4 shrink-0" />
          {dates}
        </p>
      ) : null}

      <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-snug">
        {event.description}
      </p>

      {tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span key={tag} className={tagClass}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <EventCardCases
        slug={event.slug}
        cases={cases}
        expanded={expanded}
        isPending={isCasesPending}
        isError={isCasesError}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {expanded && (
          <Button asChild variant="outline" size="sm">
            <Link to={pathTo(ROUTES.EVENT, { slug: event.slug })}>Подробнее</Link>
          </Button>
        )}
        {session?.role === "admin" ? (
          <Button asChild size="sm" variant="secondary">
            <Link to={pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId: event.id })}>
              Редактировать
            </Link>
          </Button>
        ) : event.registrationOpen ? (
          isAuthenticated ? (
            <Button asChild size="sm">
              <Link to={pathTo(ROUTES.EVENT_REGISTER, { slug: event.slug })}>
                Регистрация
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="cursor-not-allowed opacity-60"
              onClick={handleRegisterClick}
            >
              Регистрация
            </Button>
          )
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="ml-auto"
          aria-expanded={expanded}
          aria-label={expanded ? "Скрыть кейсы" : "Показать кейсы"}
          onClick={() => setExpanded((open) => !open)}
        >
          <ChevronDownIcon
            className={cn(
              "size-4 transition-transform duration-300",
              expanded && "rotate-180",
            )}
          />
        </Button>
      </div>
    </article>
  );
}
