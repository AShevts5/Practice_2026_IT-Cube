import { publicRqClient } from "@/shared/api/instance";
import { useCaptainProfile } from "@/features/auth/model/use-captain-profile";
import { captainRegisterPath } from "@/features/auth/model/use-register";
import { getCabinetHomeRoute, pathTo, ROUTES } from "@/shared/model/routes";
import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { Link, useParams } from "react-router-dom";
import { useSession } from "@/shared/model/session";
import { hasTeamCabinetAccess, isGuest, isCaptain } from "@/shared/model/viewer-role";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { EventInfoBlock } from "@/shared/ui/event-info-block.tsx";

const statusLabels: Record<ApiSchemas["EventStatus"], string> = {
  draft: "Черновик",
  published: "Опубликовано",
  registration_open: "Регистрация открыта",
  registration_closed: "Регистрация закрыта",
  finished: "Завершено",
};

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

function EventDetailPage() {
  const { slug } = useParams();
  const { session, viewerRole } = useSession();
  const { data: captain } = useCaptainProfile();
  const showCabinet = hasTeamCabinetAccess(viewerRole, captain?.has_team);

  const { data: event, isPending, isError } = publicRqClient.useQuery(
    "get",
    "/public/events/{slug}",
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

  const tracks = event.tracks ?? [];

  return (
    <article>
      <PageHeader
        title={event.title}
        description={event.description}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{statusLabels[event.status]}</Badge>
            {event.registration_open ? (
              <Badge variant="outline">Регистрация открыта</Badge>
            ) : null}
          </div>
        }
      />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">О мероприятии</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <EventInfoBlock event={event} />
          <p className="text-sm">
            Свободных мест: <strong>{event.total_seats_available}</strong>
          </p>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Кейсы / направления</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {tracks.map((track) => (
            <div
              key={track.id}
              className="relative rounded-2xl border px-4 py-3 pr-24 text-sm"
            >
              <span
                className={[
                  "rounded-full border px-3 py-0.5 text-xs font-semibold tabular-nums",
                  occupancyClasses(track.teams_registered, track.team_limit),
                  "absolute right-4 top-3",
                ].join(" ")}
              >
                {track.teams_registered}/{track.team_limit}
              </span>
              <span className="font-medium leading-snug">{track.title}</span>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-snug">
                {track.description}
              </p>
            </div>
          ))}
          {tracks.length === 0 && (
            <p className="text-muted-foreground text-sm">Кейсы не объявлены</p>
          )}
        </CardContent>
      </Card>

      {viewerRole === "admin" ? (
        <Button asChild variant="secondary">
          <Link to={pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId: String(event.id) })}>
            Редактировать
          </Link>
        </Button>
      ) : showCabinet ? (
        <Button asChild variant="secondary">
          <Link to={getCabinetHomeRoute(session?.role)}>Кабинет команды</Link>
        </Button>
      ) : isCaptain(viewerRole) ? (
        event.registration_open && event.total_seats_available > 0 ? (
          <Button asChild>
            <Link to={pathTo(ROUTES.EVENT_REGISTER, { slug })}>Регистрация команды</Link>
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">Регистрация недоступна</p>
        )
      ) : isGuest(viewerRole) && event.registration_open && event.total_seats_available > 0 ? (
        <Button asChild>
          <Link to={captainRegisterPath(pathTo(ROUTES.EVENT_REGISTER, { slug }))}>
            Стать капитаном и зарегистрировать команду
          </Link>
        </Button>
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
