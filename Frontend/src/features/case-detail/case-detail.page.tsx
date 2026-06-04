import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { publicRqClient } from "@/shared/api/instance";
import { useCaptainProfile } from "@/features/auth/model/use-captain-profile";
import { captainRegisterPath } from "@/features/auth/model/use-register";
import { getCabinetHomeRoute, pathTo, ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { hasTeamCabinetAccess, isGuest, isCaptain } from "@/shared/model/viewer-role";
import { cn } from "@/shared/lib/css";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { KeywordTags } from "@/shared/ui/keyword-tags.tsx";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Link, useParams } from "react-router-dom";

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

function findTrack(
  tracks: ApiSchemas["TrackPublic"][],
  caseId: string | undefined,
): ApiSchemas["TrackPublic"] | undefined {
  if (!caseId) return undefined;
  const numericId = Number(caseId);
  if (Number.isFinite(numericId)) {
    const byId = tracks.find((track) => track.id === numericId);
    if (byId) return byId;
  }
  return tracks.find((track) => track.slug === caseId);
}

function CaseDetailPage() {
  const { slug, caseId } = useParams();
  const { session, viewerRole } = useSession();
  const { data: captain } = useCaptainProfile();
  const showCabinet = hasTeamCabinetAccess(viewerRole, captain?.has_team);

  const { data: event, isPending, isError } = publicRqClient.useQuery(
    "get",
    "/public/events/{slug}",
    { params: { path: { slug: slug! } } },
    { enabled: Boolean(slug) },
  );

  if (!slug || !caseId) return null;

  if (isPending) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (isError || !event) {
    return <p className="text-destructive">Мероприятие не найдено</p>;
  }

  const track = findTrack(event.tracks, caseId);

  if (!track) {
    return <p className="text-destructive">Кейс не найден</p>;
  }

  const occupancyClass = occupancyClasses(track.teams_registered, track.team_limit);
  const registerPath = pathTo(ROUTES.EVENT_REGISTER, { slug });

  return (
    <article className="w-full min-w-0">
      <PageHeader
        title={track.title}
        description={event.title}
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link to={pathTo(ROUTES.EVENT, { slug })}>← К мероприятию</Link>
            </Button>
            <Badge variant={event.registration_open ? "success" : "muted"}>
              {event.registration_open ? "Регистрация открыта" : "Регистрация закрыта"}
            </Badge>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span
          className={cn(
            "rounded-full border px-3 py-0.5 text-xs font-semibold tabular-nums",
            occupancyClass,
          )}
        >
          {track.teams_registered}/{track.team_limit} мест
        </span>
        <span className="text-muted-foreground text-sm">
          Свободно: <strong className="text-foreground">{track.seats_available}</strong>
        </span>
      </div>

      <div className="border-border bg-card mb-6 w-full min-w-0 space-y-3 rounded-2xl border p-4 shadow-sm sm:p-6 dark:bg-card/50 dark:shadow-none">
        <p className="text-sm font-semibold">Описание кейса</p>
        {track.description ? (
          <p className="text-muted-foreground w-full text-sm leading-relaxed break-words [overflow-wrap:anywhere]">
            {track.description}
          </p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Описание кейса будет опубликовано организаторами.
          </p>
        )}
        <KeywordTags keywords={track.keywords} />
      </div>

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
        event.registration_open && track.seats_available > 0 ? (
          <Button asChild>
            <Link to={registerPath}>Регистрация команды</Link>
          </Button>
        ) : (
          <p className="text-muted-foreground text-sm">Регистрация недоступна</p>
        )
      ) : isGuest(viewerRole) && event.registration_open && track.seats_available > 0 ? (
        <Button asChild>
          <Link to={captainRegisterPath(registerPath)}>Стать капитаном и зарегистрировать команду</Link>
        </Button>
      ) : (
        <p className="text-muted-foreground text-sm">Регистрация недоступна</p>
      )}
    </article>
  );
}

export const Component = CaseDetailPage;
