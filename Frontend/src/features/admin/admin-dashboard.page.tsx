import { rqClient } from "@/shared/api/instance";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { Skeleton } from "@/shared/ui/kit/skeleton";

function AdminDashboardPage() {
  const { data, isPending, isError } = rqClient.useQuery("get", "/admin/stats");

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (isError || !data) {
    return <p className="text-destructive">Ошибка загрузки статистики</p>;
  }

  const items = [
    { label: "Мероприятий", value: data.eventsCount },
    { label: "Команд", value: data.teamsCount },
    { label: "Свободных мест", value: data.freeSpotsTotal },
  ];

  return (
    <div>
      <PageHeader title="Дашборд" description="Сводка по платформе" />
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <Card key={item.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-normal">
                {item.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export const Component = AdminDashboardPage;
