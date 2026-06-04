import { rqClient, publicRqClient } from "@/shared/api/instance";
import { useQueryClient } from "@tanstack/react-query";
import { getCaseCatalogItem } from "@/features/cabinet/model/case-catalog.ts";
import { CabinetPageHeader } from "@/features/cabinet/ui/cabinet-page-header.tsx";
import { CaseCard } from "@/features/cabinet/ui/case-card.tsx";
import { CaseConfirmedBanner } from "@/features/cabinet/ui/case-confirmed-banner.tsx";
import { ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

function CabinetChangeCasePage() {
  const queryClient = useQueryClient();
  const { data: team } = rqClient.useQuery("get", "/team/me");
  const { data: event, isPending } = publicRqClient.useQuery(
    "get",
    "/public/events/{slug}",
    { params: { path: { slug: team?.event_slug ?? "" } } },
    { enabled: Boolean(team?.event_slug) },
  );

  const tracks =
    event?.tracks.filter(
      (t) => t.seats_available > 0 || t.id === team?.track_id,
    ) ?? [];

  const [pickedId, setPickedId] = useState<number | null>(null);
  const selectedId = pickedId ?? team?.track_id ?? null;

  const mutation = rqClient.useMutation("patch", "/team/me", {
    onSuccess: async () => {
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/team/me"),
      );
      setPickedId(null);
      toast.success("Кейс сохранён");
    },
  });

  if (isPending || !team) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (!team.can_manage) {
    return (
      <div>
        <CabinetPageHeader title="Смена кейса" description="Действие недоступно" />
        <p className="text-muted-foreground mb-4 text-sm">
          {!team.can_edit
            ? "Регистрация закрыта — сменить кейс нельзя."
            : "Смена кейса доступна только капитану команды."}
        </p>
        <Button asChild variant="outline">
          <Link to={ROUTES.CABINET_DASHBOARD}>← К команде</Link>
        </Button>
      </div>
    );
  }

  const selectedTrack = tracks.find((t) => t.id === selectedId);
  const currentTrack = tracks.find((t) => t.id === team.track_id);
  const confirmedCatalog = currentTrack
    ? getCaseCatalogItem(String(currentTrack.id), currentTrack.title, {
        description: currentTrack.description,
      })
    : getCaseCatalogItem(String(team.track_id), team.track_title);

  return (
    <div className="w-full min-w-0">
      <CabinetPageHeader
        title="Смена кейса"
        description="Выберите направление, если есть свободные места"
      />

      {confirmedCatalog ? (
        <CaseConfirmedBanner
          caseTitle={confirmedCatalog.title}
          eventTitle={team.event_title}
        />
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {tracks.map((track) => {
          const catalog = getCaseCatalogItem(String(track.id), track.title, {
            description: track.description,
          });
          return (
            <CaseCard
              key={track.id}
              title={catalog.title}
              description={catalog.description}
              selected={selectedId === track.id}
              occupied={track.teams_registered}
              limit={track.team_limit}
              onSelect={() => setPickedId(track.id)}
            />
          );
        })}
      </div>

      {tracks.length === 0 && (
        <p className="text-muted-foreground mt-4">Нет доступных кейсов для смены</p>
      )}

      {selectedTrack && selectedId !== team.track_id ? (
        <Button
          className="mt-6"
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate({ body: { track_id: selectedId ?? undefined } })
          }
        >
          Сохранить выбор
        </Button>
      ) : null}
    </div>
  );
}

export const Component = CabinetChangeCasePage;
