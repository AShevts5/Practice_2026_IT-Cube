import { rqClient } from "@/shared/api/instance";
import { getCaseCatalogItem } from "@/features/cabinet/model/case-catalog.ts";
import { CabinetPageHeader } from "@/features/cabinet/ui/cabinet-page-header.tsx";
import { ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { Link } from "react-router-dom";
import { UsersIcon, MailIcon, PhoneIcon, LayoutGridIcon } from "lucide-react";

function CabinetDashboardPage() {
  const { data: team, isPending, isError } = rqClient.useQuery("get", "/team/me");

  if (isPending) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (isError || !team) {
    return <p className="text-destructive">Не удалось загрузить данные команды</p>;
  }

  const caseInfo = getCaseCatalogItem(String(team.track_id), team.track_title, {
    description: team.track_title,
  });

  return (
    <div>
      <CabinetPageHeader
        title="Команда"
        description="Информация о вашей команде и текущем кейсе"
      />

      <div className="border-border bg-card space-y-6 rounded-2xl border p-6 shadow-sm dark:bg-card/50 dark:shadow-none">
        <div>
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            Название команды
          </p>
          <p className="mt-1 flex items-center gap-2 text-xl font-semibold">
            <UsersIcon className="size-5 text-primary" />
            {team.team_name}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-muted-foreground text-xs uppercase">Капитан</p>
            <p className="mt-2 font-medium">{team.captain_full_name}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-muted-foreground text-xs uppercase">Мероприятие</p>
            <p className="mt-2 font-medium leading-snug">{team.event_title}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <p className="text-muted-foreground flex items-center gap-2">
            <MailIcon className="size-4" />
            {team.email}
          </p>
          <p className="text-muted-foreground flex items-center gap-2">
            <PhoneIcon className="size-4" />
            {team.phone}
          </p>
        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 dark:border-violet-500/30 dark:bg-violet-500/10">
          <p className="text-muted-foreground flex items-center gap-2 text-xs uppercase">
            <LayoutGridIcon className="size-4 text-violet-600 dark:text-violet-400" />
            Текущий кейс
          </p>
          <p className="mt-2 font-medium leading-snug">{caseInfo.title}</p>
        </div>

        {!team.can_edit ? (
          <p className="text-muted-foreground text-sm">
            Регистрация закрыта — редактирование и смена кейса недоступны.
          </p>
        ) : team.can_manage ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline">
              <Link to={ROUTES.CABINET_EDIT}>Редактировать</Link>
            </Button>
            <Button asChild>
              <Link to={ROUTES.CABINET_CHANGE_CASE}>Сменить кейс</Link>
            </Button>
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            Редактирование и смена кейса доступны только капитану.
          </p>
        )}
      </div>
    </div>
  );
}

export const Component = CabinetDashboardPage;
