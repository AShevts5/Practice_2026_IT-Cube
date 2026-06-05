import { rqClient } from "@/shared/api/instance";
import { ROUTES, pathTo } from "@/shared/model/routes";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function AdminEventsPage() {
  const queryClient = useQueryClient();
  const { data: events, isPending, isError } = rqClient.useQuery(
    "get",
    "/admin/events",
  );

  const invalidateEvents = () =>
    queryClient.invalidateQueries(rqClient.queryOptions("get", "/admin/events"));

  const deleteMutation = rqClient.useMutation("delete", "/admin/events/{event_id}", {
    onSuccess: async () => {
      toast.success("Мероприятие удалено");
      await invalidateEvents();
    },
    onError: () => toast.error("Не удалось удалить мероприятие"),
  });

  const handleDelete = (event: { id: number; title: string; tracks: { teams_registered: number }[] }) => {
    const teamsCount = event.tracks.reduce(
      (sum, track) => sum + track.teams_registered,
      0,
    );
    if (teamsCount > 0) {
      toast.error("Нельзя удалить мероприятие с зарегистрированными командами");
      return;
    }

    const confirmed = window.confirm(
      `Удалить мероприятие «${event.title}»? Это действие нельзя отменить.`,
    );
    if (!confirmed) return;

    deleteMutation.mutate({ params: { path: { event_id: event.id } } });
  };

  if (isPending) {
    return <p>Загрузка…</p>;
  }

  if (isError) {
    return <p className="text-destructive">Ошибка загрузки</p>;
  }

  return (
    <div>
      <PageHeader
        title="Мероприятия"
        description="Управление событиями платформы"
        actions={
          <Button asChild>
            <Link to={ROUTES.ADMIN_EVENT_NEW}>Создать</Link>
          </Button>
        }
      />
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Название</th>
              <th className="px-4 py-3 text-left font-medium">Статус</th>
              <th className="px-4 py-3 text-left font-medium">Кейсов</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {(events ?? []).map((event) => (
              <tr key={event.id} className="border-t">
                <td className="px-4 py-3">{event.title}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{event.status}</Badge>
                </td>
                <td className="px-4 py-3">{event.tracks.length}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId: String(event.id) })}>
                        Изменить
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        to={pathTo(ROUTES.ADMIN_EVENT_TEAMS, { eventId: String(event.id) })}
                      >
                        Команды
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        to={pathTo(ROUTES.ADMIN_EVENT_INVITES, { eventId: String(event.id) })}
                      >
                        Инвайты
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      disabled={deleteMutation.isPending}
                      onClick={() => handleDelete(event)}
                    >
                      Удалить
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export const Component = AdminEventsPage;
