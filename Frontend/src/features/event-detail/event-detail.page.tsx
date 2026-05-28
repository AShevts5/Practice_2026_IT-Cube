import { publicRqClient } from "@/shared/api/instance";
import { pathTo, ROUTES } from "@/shared/model/routes";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { Link, useParams } from "react-router-dom";
import { useSession } from "@/shared/model/session";
import { toast } from "sonner";
import { getCaseCatalogItem } from "@/features/cabinet";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";

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

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    hourCycle: "h23",
  }).format(new Date(iso));
}

function EventDetailPage() {
  const { slug } = useParams();
  const { isAuthenticated, session } = useSession();

  const { data: event, isPending, isError } = publicRqClient.useQuery(
    "get",
    "/events/{slug}",
    { params: { path: { slug: slug! } } },
    { enabled: Boolean(slug) },
  );

  const { data: casesData } = publicRqClient.useQuery(
    "get",
    "/events/{slug}/cases",
    { params: { path: { slug: slug! } } },
    { enabled: Boolean(slug) },
  );

  if (!slug) return null;

  if (isPending) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (isError || !event) {
    return <p className="text-destructive">Мероприятие не найдено</p>;
  }

  const cases = casesData?.cases ?? [];

  return (
    <article>
      <PageHeader
        title={event.title}
        description={event.description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={event.status === "active" ? "success" : "muted"}>
              {event.status}
            </Badge>
            {event.registrationOpen ? (
              <Badge variant="outline">Регистрация открыта</Badge>
            ) : null}
          </div>
        }
      />
      {"startsAt" in event && event.startsAt ? (
        <p className="text-muted-foreground mb-2 text-sm">
          Начало: {formatDate(event.startsAt as string)}
        </p>
      ) : null}
      {"endsAt" in event && event.endsAt ? (
        <p className="text-muted-foreground mb-6 text-sm">
          Окончание: {formatDate(event.endsAt as string)}
        </p>
      ) : null}
      <p className="mb-6 text-sm">
        Свободных мест: <strong>{event.freeSpotsTotal}</strong>
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Кейсы / направления</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {cases.map((c) => (
            <div
              key={c.id}
              className="relative rounded-2xl border px-4 py-3 pr-24 text-sm"
            >
              <span
                className={[
                  "rounded-full border px-3 py-0.5 text-xs font-semibold tabular-nums",
                  occupancyClasses(c.occupied, c.limit),
                  "absolute right-4 top-3",
                ].join(" ")}
              >
                {c.occupied}/{c.limit}
              </span>

              <span className="font-medium leading-snug">{c.name}</span>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-snug">
                {
                  getCaseCatalogItem(c.id, c.name, {
                    description: c.description,
                    keywords: c.keywords,
                  }).description
                }
              </p>

              <div className="mt-2">
                <Button asChild variant="outline" size="xs">
                  <Link to={pathTo(ROUTES.EVENT_CASE, { slug: slug!, caseId: c.id })}>
                    Подробнее
                  </Link>
                </Button>
              </div>
            </div>
          ))}
          {cases.length === 0 && (
            <p className="text-muted-foreground text-sm">Кейсы не объявлены</p>
          )}
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
      <div className="mt-8">
        <Button asChild variant="ghost">
          <Link to={ROUTES.HOME}>← Все мероприятия</Link>
        </Button>
      </div>
    </article>
  );
}

export const Component = EventDetailPage;
