import { Link, useParams } from "react-router-dom";
import { publicRqClient } from "@/shared/api/instance";
import { pathTo, ROUTES } from "@/shared/model/routes";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent } from "@/shared/ui/kit/card";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { useSession } from "@/shared/model/session";
import { toast } from "sonner";
import { getCaseCatalogItem } from "@/features/cabinet";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";

function formatShortDate(iso: string | undefined) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function occupancyClasses(occupied: number, limit: number) {
  const ratio = limit > 0 ? occupied / limit : 0;

  if (ratio >= 0.8) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-transparent dark:text-rose-300";
  }
  if (ratio >= 0.5) {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-300";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-transparent dark:text-emerald-300";
}

export default function CaseDetailPage() {
  const { slug, caseId } = useParams();
  const { isAuthenticated, session } = useSession();

  const { data: event, isPending: isEventPending, isError: isEventError } =
    publicRqClient.useQuery(
      "get",
      "/events/{slug}",
      { params: { path: { slug: slug! } } },
      { enabled: Boolean(slug) },
    );

  const { data: casesData, isPending: isCasesPending, isError: isCasesError } =
    publicRqClient.useQuery(
      "get",
      "/events/{slug}/cases",
      { params: { path: { slug: slug! } } },
      { enabled: Boolean(slug) && Boolean(caseId) },
    );

  const cases = casesData?.cases ?? [];
  const selectedCase = cases.find((c) => c.id === caseId) ?? null;

  const catalog = selectedCase
    ? getCaseCatalogItem(selectedCase.id, selectedCase.name, {
        description: selectedCase.description,
        keywords: selectedCase.keywords,
      })
    : null;

  if (!slug || !caseId) return null;

  if (isEventPending || isCasesPending) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (isEventError || isCasesError || !event) {
    return <p className="text-destructive">Мероприятие не найдено</p>;
  }

  if (!selectedCase) {
    return <p className="text-destructive">Кейс не найден</p>;
  }

  const occupiedText = `${selectedCase.occupied}/${selectedCase.limit} мест`;
  const occupancyClass = occupancyClasses(selectedCase.occupied, selectedCase.limit);
  const startsAt = formatShortDate(event.startsAt as string | undefined);

  return (
    <article>
      <PageHeader
        title={selectedCase.name}
        description={catalog?.description ?? selectedCase.description}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to={pathTo(ROUTES.EVENT, { slug })}>← К мероприятию</Link>
            </Button>
            <Badge variant={event.status === "active" ? "success" : "muted"}>
              {event.status}
            </Badge>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span
          className={[
            "rounded-full border px-3 py-0.5 text-xs font-semibold tabular-nums",
            occupancyClass,
          ].join(" ")}
        >
          {occupiedText}
        </span>
        <span className="text-muted-foreground text-sm">
          Свободно: <strong className="text-foreground">{selectedCase.free}</strong>
        </span>
      </div>

      {startsAt && (
        <p className="text-muted-foreground mb-6 text-sm">
          Начало: {startsAt}
        </p>
      )}

      <Card size="sm" className="mb-6 gap-4 py-4">
        <CardContent className="flex flex-col gap-3 pt-0">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Описание кейса</p>
            {catalog?.partner ? (
              <span className="text-xs font-bold text-muted-foreground">
                {catalog.partner}
              </span>
            ) : null}
          </div>

          {catalog ? (
            <>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {catalog.description}
              </p>
              {catalog.tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {catalog.tags.map((t) => (
                    <span
                      key={t.label}
                      className={`rounded-md border px-2 py-0.5 text-xs font-medium ${t.className}`}
                    >
                      {t.label}
                    </span>
                  ))}
                </div>
              ) : null}
            </>
          ) : null}
        </CardContent>
      </Card>

      {session?.role === "admin" ? (
        <Button asChild variant="secondary">
          <Link to={pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId: event.id })}>
            Редактировать
          </Link>
        </Button>
      ) : event.registrationOpen && event.freeSpotsTotal > 0 ? (
        isAuthenticated ? (
          <Button asChild>
            <Link to={pathTo(ROUTES.EVENT_REGISTER, { slug })}>
              Зарегистрировать команду
            </Link>
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            className="cursor-not-allowed opacity-60"
            onClick={() =>
              toast.info("Войдите в аккаунт, чтобы зарегистрировать команду")
            }
          >
            Зарегистрировать команду
          </Button>
        )
      ) : (
        <p className="text-muted-foreground text-sm">Регистрация недоступна</p>
      )}
    </article>
  );
}

export const Component = CaseDetailPage;

