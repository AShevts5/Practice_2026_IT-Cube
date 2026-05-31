import { rqClient } from "@/shared/api/instance";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Skeleton } from "@/shared/ui/kit/skeleton";

function AdminDashboardPage() {
  const { data: events, isPending, isError } = rqClient.useQuery(
    "get",
    "/admin/events",
  );

  if (isPending) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  if (isError) {
    return <p className="text-destructive">Не удалось загрузить статистику</p>;
  }

  const totalEvents = events?.length ?? 0;
  const openRegistration =
    events?.filter((e) => e.status === "registration_open").length ?? 0;
  const totalTracks = events?.reduce((sum, e) => sum + e.tracks.length, 0) ?? 0;

  return (
    <div>
      <PageHeader
        title="Админ-панель"
        description="Обзор платформы регистрации команд"
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="border-border rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs uppercase">Мероприятия</p>
          <p className="mt-2 text-3xl font-semibold">{totalEvents}</p>
        </div>
        <div className="border-border rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs uppercase">Открыта регистрация</p>
          <p className="mt-2 text-3xl font-semibold">{openRegistration}</p>
        </div>
        <div className="border-border rounded-2xl border p-4">
          <p className="text-muted-foreground text-xs uppercase">Кейсов всего</p>
          <p className="mt-2 text-3xl font-semibold">{totalTracks}</p>
        </div>
      </div>
    </div>
  );
}

export const Component = AdminDashboardPage;
