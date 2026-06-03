import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { publicRqClient } from "@/shared/api/instance";
import { useCaptainProfile } from "@/features/auth/model/use-captain-profile";
import { captainRegisterPath } from "@/features/auth/model/use-register";
import {
  getEventBrand,
  getEventTags,
} from "@/features/events-home/model/event-meta.ts";
import { pathTo, ROUTES, getCabinetHomeRoute } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { hasTeamCabinetAccess, isGuest, isCaptain } from "@/shared/model/viewer-role";
import { cn } from "@/shared/lib/css";
import { KeywordTags } from "@/shared/ui/keyword-tags.tsx";
import { Button } from "@/shared/ui/kit/button";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { Link } from "react-router-dom";
import { EventInfoBlock } from "@/shared/ui/event-info-block.tsx";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";

type CardStatus = "active" | "completed" | "draft";

const statusLabels: Record<CardStatus, string> = {
  active: "Активно",
  completed: "Завершено",
  draft: "Черновик",
};

const statusClass: Record<CardStatus, string> = {
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-transparent dark:text-emerald-300",
  completed: "border-border bg-muted text-muted-foreground",
  draft:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-300",
};

function toCardStatus(status: ApiSchemas["EventStatus"]): CardStatus {
  if (status === "registration_open" || status === "published") return "active";
  if (status === "finished" || status === "registration_closed") return "completed";
  return "draft";
}

function trackOccupancyClasses(occupied: number, limit: number) {
  const ratio = limit > 0 ? occupied / limit : 0;
  if (ratio >= 0.8) {
    return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/40 dark:bg-transparent dark:text-rose-300";
  }
  if (ratio >= 0.5) {
    return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-transparent dark:text-amber-300";
  }
  return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-transparent dark:text-emerald-300";
}

function EventCardTracks({
  slug,
  tracks,
  expanded,
  isPending,
  isError,
}: {
  slug: string;
  tracks: ApiSchemas["TrackPublic"][];
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
            <ul className="flex flex-col gap-2">
              {tracks.map((track) => (
                <li key={track.id}>
                  <Link
                    to={pathTo(ROUTES.EVENT_CASE, {
                      slug,
                      caseId: String(track.id),
                    })}
                    className="group relative block rounded-xl border bg-muted/30 px-4 py-3 pr-16 text-sm transition-colors hover:bg-muted/45"
                  >
                    <span
                      className={cn(
                        "absolute right-4 top-3 rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums",
                        trackOccupancyClasses(track.teams_registered, track.team_limit),
                      )}
                    >
                      {track.teams_registered}/{track.team_limit}
                    </span>
                    <span className="font-medium leading-snug">{track.title}</span>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      Свободно: {track.seats_available}
                    </p>
                    <KeywordTags keywords={track.keywords} className="mt-2" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventCard({ event }: { event: ApiSchemas["EventCard"] }) {
  const [expanded, setExpanded] = useState(false);
  const { viewerRole, session } = useSession();
  const { data: captain } = useCaptainProfile();
  const registerPath = pathTo(ROUTES.EVENT_REGISTER, { slug: event.slug });
  const showCabinet = hasTeamCabinetAccess(viewerRole, captain?.has_team);

  const {
    data: eventDetail,
    isPending: isTracksPending,
    isError: isTracksError,
  } = publicRqClient.useQuery(
    "get",
    "/public/events/{slug}",
    { params: { path: { slug: event.slug } } },
  );

  const tracks = eventDetail?.tracks ?? [];
  const cardStatus = toCardStatus(event.status);
  const tags = getEventTags(event.slug, event.keywords);
  const brand = event.brand?.trim() || getEventBrand(event.slug);
  const fewSpots = event.total_seats_available <= 5 && event.total_seats_available > 0;
  const seatsLabel =
    event.total_seats_limit > 0
      ? `${event.total_teams_registered}/${event.total_seats_limit} мест`
      : `${event.total_seats_available} мест`;

  return (
    <article
      className={cn(
        "relative w-full max-w-none rounded-2xl border bg-card p-4 pr-24 pt-4 shadow-sm transition-shadow",
        "hover:shadow-md dark:shadow-none",
        cardStatus === "active"
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
          {seatsLabel}
        </span>
        <span
          className={cn(
            "rounded-full border px-2.5 py-0.5 text-xs font-medium",
            statusClass[cardStatus],
          )}
        >
          {statusLabels[cardStatus]}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <span
          className="ring-violet-200 dark:ring-violet-500/40 size-2.5 shrink-0 rounded-full bg-violet-600 ring-4"
          aria-hidden
        />
        <span className="text-xs font-bold tracking-wide text-violet-700 uppercase dark:text-violet-300">
          {brand}
        </span>
      </div>

      <h2 className="mt-3 text-base leading-snug font-semibold">{event.title}</h2>

      <EventInfoBlock event={event} compact />

      <p className="text-muted-foreground mt-1.5 line-clamp-2 text-sm leading-snug">
        {event.description}
      </p>

      {tags.length > 0 ? (
        <KeywordTags keywords={event.keywords || tags.join(", ")} className="mt-3" />
      ) : null}

      <EventCardTracks
        slug={event.slug}
        tracks={tracks}
        expanded={expanded}
        isPending={isTracksPending}
        isError={isTracksError}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {expanded ? (
          <Button asChild variant="outline" size="sm">
            <Link to={pathTo(ROUTES.EVENT, { slug: event.slug })}>Подробнее</Link>
          </Button>
        ) : null}
        {viewerRole === "admin" ? (
          <Button asChild size="sm" variant="secondary">
            <Link to={pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId: String(event.id) })}>
              Редактировать
            </Link>
          </Button>
        ) : showCabinet ? (
          <Button asChild size="sm" variant="secondary">
            <Link to={getCabinetHomeRoute(session?.role)}>Кабинет</Link>
          </Button>
        ) : isCaptain(viewerRole) ? (
          event.registration_open && event.total_seats_available > 0 ? (
            <Button asChild size="sm">
              <Link to={registerPath}>Регистрация</Link>
            </Button>
          ) : null
        ) : isGuest(viewerRole) && event.registration_open && event.total_seats_available > 0 ? (
          <Button asChild size="sm">
            <Link to={captainRegisterPath(registerPath)}>Регистрация</Link>
          </Button>
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
