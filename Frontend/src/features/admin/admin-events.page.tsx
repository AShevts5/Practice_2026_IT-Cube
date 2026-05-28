import { rqClient } from "@/shared/api/instance";
import { ROUTES, pathTo } from "@/shared/model/routes";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Badge } from "@/shared/ui/kit/badge";
import { Button } from "@/shared/ui/kit/button";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

function AdminEventsPage() {
  const queryClient = useQueryClient();
  const { data, isPending, isError } = rqClient.useQuery("get", "/admin/events");

  const deleteMutation = rqClient.useMutation("delete", "/admin/events/{eventId}", {
    onSuccess: async () => {
      toast.success("Удалено");
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/admin/events"),
      );
    },
  });

  if (isPending) {
    return <p>Загрузка…</p>;
  }

  if (isError) {
    return <p className="text-destructive">Ошибка загрузки</p>;
  }

  const events = data?.events ?? [];

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
              <th className="px-4 py-3 text-left font-medium">Команд</th>
              <th className="px-4 py-3 text-left font-medium">Мест</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-t">
                <td className="px-4 py-3">{event.title}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{event.status}</Badge>
                </td>
                <td className="px-4 py-3">{event.teamsCount ?? 0}</td>
                <td className="px-4 py-3">{event.freeSpotsTotal}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild variant="ghost" size="sm">
                      <Link to={pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId: event.id })}>
                        Изменить
                      </Link>
                    </Button>
                    <Button asChild variant="ghost" size="sm">
                      <Link
                        to={pathTo(ROUTES.ADMIN_EVENT_TEAMS, { eventId: event.id })}
                      >
                        Команды
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() =>
                        deleteMutation.mutate({
                          params: { path: { eventId: event.id } },
                        })
                      }
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
