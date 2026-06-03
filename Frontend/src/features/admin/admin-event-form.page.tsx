import { rqClient } from "@/shared/api/instance";
import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { EventInvitesPanel } from "@/features/admin/ui/event-invites-panel.tsx";
import {
  createEmptyTrack,
  EventTracksEditor,
  tracksFromApi,
  tracksToCreatePayload,
  tracksToUpsertPayload,
  type TrackDraft,
} from "@/features/admin/ui/event-tracks-editor.tsx";
import { ROUTES, pathTo } from "@/shared/model/routes";
import { slugifyTitle } from "@/shared/lib/keywords.ts";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  EVENT_FORMAT_LABELS,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from "@/shared/lib/event-info.ts";

const STATUS_OPTIONS: ApiSchemas["EventStatus"][] = [
  "draft",
  "published",
  "registration_open",
  "registration_closed",
  "finished",
];

const FORMAT_OPTIONS: ApiSchemas["EventFormat"][] = ["online", "offline", "hybrid"];

const FORMAT_NONE = "__none__";

function AdminEventFormPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = Boolean(eventId);
  const numericId = Number(eventId);

  const { data: events, isPending } = rqClient.useQuery(
    "get",
    "/admin/events",
    undefined,
    { enabled: isEdit },
  );

  const event = events?.find((e) => e.id === numericId);

  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [eventFormat, setEventFormat] = useState<string>(FORMAT_NONE);
  const [minAge, setMinAge] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [endsAtLocal, setEndsAtLocal] = useState("");
  const [status, setStatus] = useState<ApiSchemas["EventStatus"]>("draft");
  const [tracks, setTracks] = useState<TrackDraft[]>([createEmptyTrack()]);

  useEffect(() => {
    if (!event) return;
    setTitle(event.title);
    setKeywords(event.keywords ?? "");
    setDescription(event.description);
    setLocation(event.location ?? "");
    setEventFormat(event.format ?? FORMAT_NONE);
    setMinAge(event.min_age != null ? String(event.min_age) : "");
    setStartsAtLocal(toDatetimeLocalValue(event.starts_at));
    setEndsAtLocal(toDatetimeLocalValue(event.ends_at));
    setStatus(event.status);
    setTracks(tracksFromApi(event.tracks));
  }, [event]);

  const invalidateEvents = () =>
    queryClient.invalidateQueries(rqClient.queryOptions("get", "/admin/events"));

  const createMutation = rqClient.useMutation("post", "/admin/events", {
    onSuccess: async (data) => {
      toast.success("Мероприятие создано");
      await invalidateEvents();
      navigate(pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId: String(data.id) }));
    },
    onError: () => toast.error("Не удалось создать мероприятие"),
  });

  const updateMutation = rqClient.useMutation("patch", "/admin/events/{event_id}", {
    onSuccess: async () => {
      toast.success("Сохранено");
      await invalidateEvents();
    },
    onError: () => toast.error("Не удалось сохранить"),
  });

  const finishMutation = rqClient.useMutation(
    "post",
    "/admin/events/{event_id}/finish",
    {
      onSuccess: async () => {
        toast.success("Мероприятие завершено");
        await invalidateEvents();
      },
    },
  );

  const buildEventMeta = () => {
    const parsedMinAge = minAge.trim() ? Number(minAge) : null;
    if (minAge.trim() && (!Number.isInteger(parsedMinAge) || parsedMinAge! < 0)) {
      toast.error("Укажите корректный минимальный возраст");
      return null;
    }

    return {
      location: location.trim(),
      format:
        eventFormat === FORMAT_NONE
          ? null
          : (eventFormat as ApiSchemas["EventFormat"]),
      min_age: parsedMinAge,
      starts_at: fromDatetimeLocalValue(startsAtLocal),
      ends_at: fromDatetimeLocalValue(endsAtLocal),
    };
  };

  const submit = () => {
    if (!title.trim()) {
      toast.error("Укажите название");
      return;
    }

    const meta = buildEventMeta();
    if (!meta) return;

    const tracksPayload = isEdit
      ? tracksToUpsertPayload(tracks)
      : tracksToCreatePayload(tracks);
    if (tracksPayload.length === 0) {
      toast.error("Добавьте хотя бы один кейс");
      return;
    }

    if (isEdit && Number.isFinite(numericId)) {
      updateMutation.mutate({
        params: { path: { event_id: numericId } },
        body: {
          title,
          description,
          keywords: keywords.trim(),
          status,
          ...meta,
          tracks: tracksPayload,
        },
      });
      return;
    }

    createMutation.mutate({
      body: {
        title,
        slug: slugifyTitle(title),
        description,
        keywords: keywords.trim(),
        ...meta,
        tracks: tracksPayload,
      },
    });
  };

  if (isEdit && isPending) {
    return <p className="text-muted-foreground text-sm">Загрузка…</p>;
  }

  if (isEdit && !isPending && !event) {
    return <p className="text-destructive text-sm">Мероприятие не найдено</p>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <PageHeader
        title={isEdit ? "Редактирование мероприятия" : "Новое мероприятие"}
        description={
          isEdit
            ? "Параметры события, кейсы и инвайт-коды"
            : "Создание мероприятия с кейсами"
        }
      />

      <div className="space-y-3">
        <div>
          <Label>Название</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Ключевые слова</Label>
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="React, TypeScript, Python"
          />
          <p className="text-muted-foreground mt-1 text-xs">Через запятую — отображаются на карточке</p>
        </div>
        <div>
          <Label>Описание</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/30 w-full min-w-0 rounded-xl border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] md:text-sm"
          />
        </div>

        <div className="border-border/60 space-y-3 rounded-2xl border p-4">
          <p className="text-sm font-medium">Когда и где</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="starts_at">Начало</Label>
              <Input
                id="starts_at"
                type="datetime-local"
                value={startsAtLocal}
                onChange={(e) => setStartsAtLocal(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ends_at">Окончание</Label>
              <Input
                id="ends_at"
                type="datetime-local"
                value={endsAtLocal}
                onChange={(e) => setEndsAtLocal(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location">Место</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="г. Москва, адрес площадки"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Формат</Label>
              <Select value={eventFormat} onValueChange={setEventFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Не указан" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={FORMAT_NONE}>Не указан</SelectItem>
                  {FORMAT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {EVENT_FORMAT_LABELS[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="min_age">Минимальный возраст</Label>
              <Input
                id="min_age"
                type="number"
                min={0}
                max={120}
                value={minAge}
                onChange={(e) => setMinAge(e.target.value)}
                placeholder="16"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                С какого возраста можно участвовать; оставьте пустым, если без ограничения
              </p>
            </div>
          </div>
        </div>

        {isEdit ? (
          <div>
            <Label>Статус</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as ApiSchemas["EventStatus"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground mt-1 text-xs">
              Для открытия регистрации выберите registration_open
            </p>
          </div>
        ) : null}
      </div>

      <EventTracksEditor tracks={tracks} onChange={setTracks} />

      <div className="flex flex-wrap gap-2">
        <Button
          onClick={submit}
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          Сохранить
        </Button>
        <Button asChild variant="outline">
          <Link to={ROUTES.ADMIN_EVENTS}>Назад</Link>
        </Button>
        {isEdit && Number.isFinite(numericId) ? (
          <>
            <Button asChild variant="secondary" size="sm">
              <Link to={pathTo(ROUTES.ADMIN_EVENT_TEAMS, { eventId: eventId! })}>
                Команды
              </Link>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() =>
                finishMutation.mutate({
                  params: { path: { event_id: numericId } },
                })
              }
            >
              Завершить
            </Button>
          </>
        ) : null}
      </div>

      {isEdit && Number.isFinite(numericId) ? (
        <EventInvitesPanel eventId={numericId} />
      ) : null}
    </div>
  );
}

export const Component = AdminEventFormPage;
