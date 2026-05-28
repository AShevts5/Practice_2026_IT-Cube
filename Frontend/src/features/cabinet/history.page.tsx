import { rqClient } from "@/shared/api/instance";
import { CabinetPageHeader } from "@/features/cabinet/ui/cabinet-page-header.tsx";
import { Skeleton } from "@/shared/ui/kit/skeleton";

const actionLabels: Record<string, string> = {
  registration: "Регистрация",
  team_updated: "Обновление данных",
  case_changed: "Смена кейса",
  case_selected: "Выбор кейса",
};

function CabinetHistoryPage() {
  const { data, isPending } = rqClient.useQuery("get", "/cabinet/history");

  if (isPending) {
    return <Skeleton className="h-48 w-full rounded-2xl" />;
  }

  const entries = data?.entries ?? [];

  return (
    <div>
      <CabinetPageHeader
        title="История"
        description="Действия вашей команды на платформе"
      />
      <ul className="space-y-3">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="border-border bg-card rounded-2xl border px-4 py-3 shadow-sm"
          >
            <p className="font-medium">
              {actionLabels[entry.action] ?? entry.action}
            </p>
            {entry.details ? (
              <p className="text-muted-foreground mt-1 text-sm">{entry.details}</p>
            ) : null}
            <p className="text-muted-foreground mt-2 text-xs">
              {new Date(entry.createdAt).toLocaleString("ru-RU")}
            </p>
          </li>
        ))}
      </ul>
      {entries.length === 0 && (
        <p className="text-muted-foreground text-center py-8">Записей нет</p>
      )}
    </div>
  );
}

export const Component = CabinetHistoryPage;
