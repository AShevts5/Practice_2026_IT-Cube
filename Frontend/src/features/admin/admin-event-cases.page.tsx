import { rqClient } from "@/shared/api/instance";
import { ROUTES, pathTo } from "@/shared/model/routes";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Button } from "@/shared/ui/kit/button";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function AdminEventCasesPage() {
  const { eventId } = useParams();
  const numericId = Number(eventId);
  const queryClient = useQueryClient();

  const { data: events, isPending } = rqClient.useQuery(
    "get",
    "/admin/events",
    undefined,
    { enabled: Number.isFinite(numericId) },
  );

  const event = events?.find((e) => e.id === numericId);

  const invalidateEvents = () =>
    queryClient.invalidateQueries(rqClient.queryOptions("get", "/admin/events"));

  const deleteTrackMutation = rqClient.useMutation(
    "delete",
    "/admin/events/{event_id}/tracks/{track_id}",
    {
      onSuccess: async () => {
        toast.success("Кейс удалён");
        await invalidateEvents();
      },
      onError: () => toast.error("Не удалось удалить кейс"),
    },
  );

  const handleDeleteTrack = (track: {
    id: number;
    title: string;
    teams_registered: number;
  }) => {
    if (!Number.isFinite(numericId)) return;

    if (track.teams_registered > 0) {
      toast.error("Нельзя удалить кейс с зарегистрированными командами");
      return;
    }

    if ((event?.tracks.length ?? 0) <= 1) {
      toast.error("У мероприятия должен остаться хотя бы один кейс");
      return;
    }

    const confirmed = window.confirm(
      `Удалить кейс «${track.title}»? Это действие нельзя отменить.`,
    );
    if (!confirmed) return;

    deleteTrackMutation.mutate({
      params: { path: { event_id: numericId, track_id: track.id } },
    });
  };

  if (!eventId) return null;

  return (
    <div className="min-w-0 w-full">
      <PageHeader
        title="Кейсы мероприятия"
        description="Направления (tracks) задаются при создании события на бэкенде"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId })}>← Мероприятие</Link>
          </Button>
        }
      />
      {isPending ? (
        <p>Загрузка…</p>
      ) : (
        <ul className="space-y-2">
          {(event?.tracks ?? []).map((track) => {
            const canDelete =
              (event?.tracks.length ?? 0) > 1 && track.teams_registered === 0;

            return (
              <li
                key={track.id}
                className="border-border w-full min-w-0 rounded-2xl border px-4 py-3 text-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium break-words [overflow-wrap:anywhere]">
                      {track.title}
                    </p>
                    <p className="text-muted-foreground mt-1 break-words [overflow-wrap:anywhere]">
                      {track.description}
                    </p>
                    <p className="mt-2 tabular-nums">
                      {track.teams_registered}/{track.team_limit} команд
                    </p>
                  </div>
                  {canDelete ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive shrink-0"
                      disabled={deleteTrackMutation.isPending}
                      onClick={() => handleDeleteTrack(track)}
                    >
                      Удалить
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export const Component = AdminEventCasesPage;
