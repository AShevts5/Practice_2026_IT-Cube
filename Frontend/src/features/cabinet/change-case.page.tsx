import { rqClient } from "@/shared/api/instance";
import { useQueryClient } from "@tanstack/react-query";
import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { getCaseCatalogItem } from "@/features/cabinet/model/case-catalog.ts";
import { CabinetPageHeader } from "@/features/cabinet/ui/cabinet-page-header.tsx";
import { CaseCard } from "@/features/cabinet/ui/case-card.tsx";
import { CaseConfirmedBanner } from "@/features/cabinet/ui/case-confirmed-banner.tsx";
import { Button } from "@/shared/ui/kit/button";
import { Label } from "@/shared/ui/kit/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { useState } from "react";
import { toast } from "sonner";

function CabinetChangeCasePage() {
  const queryClient = useQueryClient();
  const { data: team } = rqClient.useQuery("get", "/cabinet/team");
  const { data, isPending } = rqClient.useQuery(
    "get",
    "/cabinet/available-cases",
  );
  const { data: eventsData, isPending: isEventsPending } = rqClient.useQuery(
    "get",
    "/cabinet/available-events",
  );

  const cases = data?.cases ?? [];
  const availableEvents = eventsData?.events ?? [];
  const currentCaseId =
    cases.find((c) => c.name === team?.caseName)?.id ?? "";
  const currentEventId = team?.eventId ?? "";

  const [pickedId, setPickedId] = useState<string | null>(null);
  const [pickedEventId, setPickedEventId] = useState<string>("");
  const selectedId = pickedId ?? currentCaseId;
  const selectedEventId = pickedEventId || currentEventId;

  const mutation = rqClient.useMutation("post", "/cabinet/change-case", {
    onSuccess: async () => {
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/cabinet/team"),
      );
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/cabinet/available-cases"),
      );
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/cabinet/available-events"),
      );
      setPickedId(null);
      toast.success("Кейс сохранён");
    },
  });

  const changeEventMutation = rqClient.useMutation("post", "/cabinet/change-event", {
    onSuccess: async () => {
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/cabinet/team"),
      );
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/cabinet/available-cases"),
      );
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/cabinet/available-events"),
      );
      setPickedId(null);
      setPickedEventId("");
      toast.success("Мероприятие изменено");
    },
  });

  const selectedCase = cases.find((c) => c.id === selectedId);
  const currentCase = cases.find((c) => c.id === currentCaseId);
  const confirmedCatalog = currentCase
    ? getCaseCatalogItem(currentCase.id, currentCase.name, {
        description: currentCase.description,
        keywords: currentCase.keywords,
      })
    : currentCaseId
      ? getCaseCatalogItem(currentCaseId, team?.caseName)
      : null;
  const hasChanges = Boolean(pickedId && pickedId !== currentCaseId);

  const hasEventChanges = Boolean(
    selectedEventId && currentEventId && selectedEventId !== currentEventId,
  );

  if (isPending || isEventsPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-72 rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <CabinetPageHeader title="Выбор кейса" />

      <div className="border-border bg-card mb-6 rounded-2xl border p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="w-full md:max-w-sm">
            <Label className="mb-2 block">Мероприятие</Label>
            <Select value={selectedEventId} onValueChange={setPickedEventId}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите мероприятие" />
              </SelectTrigger>
              <SelectContent>
                {availableEvents.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            disabled={!hasEventChanges || changeEventMutation.isPending}
            onClick={() => {
              if (!selectedEventId || selectedEventId === currentEventId) return;
              changeEventMutation.mutate({ body: { eventId: selectedEventId } });
            }}
          >
            {changeEventMutation.isPending ? "Смена…" : "Сменить мероприятие"}
          </Button>
        </div>
      </div>

      {team && confirmedCatalog ? (
        <CaseConfirmedBanner
          caseTitle={confirmedCatalog.title}
          eventTitle={team.eventTitle}
        />
      ) : null}

      {cases.length === 0 ? (
        <p className="text-muted-foreground py-12 text-center">
          Нет доступных кейсов
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {cases.map((caseItem: ApiSchemas["Case"]) => (
              <CaseCard
                key={caseItem.id}
                caseItem={caseItem}
                selected={selectedId === caseItem.id}
                disabled={mutation.isPending || changeEventMutation.isPending}
                onSelect={() => setPickedId(caseItem.id)}
              />
            ))}
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            {selectedCase ? (
              <p className="text-muted-foreground mr-auto text-sm">
                Выбрано:{" "}
                <span className="text-foreground font-medium">
                  {
                    getCaseCatalogItem(selectedCase.id, selectedCase.name, {
                      description: selectedCase.description,
                      keywords: selectedCase.keywords,
                    }).title
                  }
                </span>
              </p>
            ) : null}
            <Button
              disabled={
                !hasChanges || mutation.isPending || changeEventMutation.isPending
              }
              onClick={() => {
                if (!selectedId) return;
                mutation.mutate({ body: { caseId: selectedId } });
              }}
            >
              {mutation.isPending ? "Сохранение…" : "Подтвердить выбор"}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export const Component = CabinetChangeCasePage;
