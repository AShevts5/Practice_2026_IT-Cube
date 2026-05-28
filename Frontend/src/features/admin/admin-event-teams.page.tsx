import { CONFIG } from "@/shared/model/config";
import { rqClient } from "@/shared/api/instance";
import { useSession } from "@/shared/model/session";
import { ROUTES } from "@/shared/model/routes";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

function AdminEventTeamsPage() {
  const { eventId } = useParams();
  const { token } = useSession();
  const [search, setSearch] = useState("");

  const { data, isPending, isError } = rqClient.useQuery(
    "get",
    "/admin/events/{eventId}/teams",
    {
      params: {
        path: { eventId: eventId! },
        query: search ? { search } : undefined,
      },
    },
    { enabled: Boolean(eventId) },
  );

  const exportCsv = async () => {
    const res = await fetch(
      `${CONFIG.API_BASE_URL}/admin/events/${eventId}/teams/export`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teams-${eventId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!eventId) return null;

  if (isPending) {
    return <p>Загрузка…</p>;
  }

  if (isError) {
    return <p className="text-destructive">Ошибка загрузки</p>;
  }

  const teams = data?.teams ?? [];

  return (
    <div>
      <PageHeader
        title="Команды"
        description="Зарегистрированные команды мероприятия"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={exportCsv}>
              Экспорт CSV
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to={ROUTES.ADMIN_EVENTS}>← Назад</Link>
            </Button>
          </>
        }
      />
      <Input
        className="mb-4 max-w-sm"
        placeholder="Поиск по названию или email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="overflow-x-auto rounded-2xl border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left">Команда</th>
              <th className="px-4 py-3 text-left">Капитан</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Телефон</th>
              <th className="px-4 py-3 text-left">Кейс</th>
              <th className="px-4 py-3 text-left">Дата</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr key={team.id} className="border-t">
                <td className="px-4 py-3">{team.name}</td>
                <td className="px-4 py-3">{team.captainName}</td>
                <td className="px-4 py-3">{team.email}</td>
                <td className="px-4 py-3">{team.phone}</td>
                <td className="px-4 py-3">{team.caseName}</td>
                <td className="px-4 py-3">
                  {new Date(team.registeredAt).toLocaleDateString("ru-RU")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {teams.length === 0 && (
        <p className="text-muted-foreground mt-4 text-center">Команд нет</p>
      )}
    </div>
  );
}

export const Component = AdminEventTeamsPage;
