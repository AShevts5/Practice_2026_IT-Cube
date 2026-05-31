import { rqClient } from "@/shared/api/instance";
import { ROUTES, pathTo } from "@/shared/model/routes";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Button } from "@/shared/ui/kit/button";
import { Link, useParams } from "react-router-dom";

function AdminEventCasesPage() {
  const { eventId } = useParams();
  const numericId = Number(eventId);

  const { data: events, isPending } = rqClient.useQuery(
    "get",
    "/admin/events",
    undefined,
    { enabled: Number.isFinite(numericId) },
  );

  const event = events?.find((e) => e.id === numericId);

  if (!eventId) return null;

  return (
    <div>
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
          {(event?.tracks ?? []).map((track) => (
            <li
              key={track.id}
              className="border-border rounded-2xl border px-4 py-3 text-sm"
            >
              <p className="font-medium">{track.title}</p>
              <p className="text-muted-foreground mt-1">{track.description}</p>
              <p className="mt-2 tabular-nums">
                {track.teams_registered}/{track.team_limit} команд
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const Component = AdminEventCasesPage;
