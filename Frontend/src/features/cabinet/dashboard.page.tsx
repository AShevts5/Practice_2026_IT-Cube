import { rqClient } from "@/shared/api/instance";
import { getCaseCatalogItem } from "@/features/cabinet/model/case-catalog.ts";
import { CabinetPageHeader } from "@/features/cabinet/ui/cabinet-page-header.tsx";
import { ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { Link } from "react-router-dom";
import { UsersIcon, MailIcon, PhoneIcon, LayoutGridIcon } from "lucide-react";

function CabinetDashboardPage() {
  const { data: team, isPending, isError } = rqClient.useQuery(
    "get",
    "/cabinet/team",
  );
  const { data: casesData } = rqClient.useQuery(
    "get",
    "/cabinet/available-cases",
  );

  if (isPending) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (isError || !team) {
    return <p className="text-destructive">Не удалось загрузить данные команды</p>;
  }

  const currentCase = casesData?.cases.find((c) => c.name === team.caseName);
  const caseInfo = getCaseCatalogItem(currentCase?.id ?? "", team.caseName, {
    description: currentCase?.description,
    keywords: currentCase?.keywords,
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
            {team.name}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-muted-foreground text-xs uppercase">Капитан</p>
            <p className="mt-2 font-medium">{team.captainName}</p>
          </div>
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-muted-foreground text-xs uppercase">Мероприятие</p>
            <p className="mt-2 font-medium leading-snug">{team.eventTitle}</p>
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

        {!team.canEdit && (
          <p className="text-muted-foreground text-sm">
            Мероприятие завершено — редактирование недоступно.
          </p>
        )}
        {team.canEdit ? (
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline">
              <Link to={ROUTES.CABINET_EDIT}>Редактировать</Link>
            </Button>
            <Button asChild>
              <Link to={ROUTES.CABINET_CHANGE_CASE}>Выбор кейса</Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export const Component = CabinetDashboardPage;
