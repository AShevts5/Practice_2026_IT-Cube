import { rqClient } from "@/shared/api/instance";
import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { formatKeywords, parseKeywords } from "@/shared/lib/keywords.ts";
import { ROUTES, pathTo } from "@/shared/model/routes";
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
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type EventFormValues = {
  title: string;
  keywords: string;
  description: string;
  status: string;
  registrationOpen: boolean;
  startsAt: string;
  endsAt: string;
};

const emptyForm: EventFormValues = {
  title: "",
  keywords: "",
  description: "",
  status: "draft",
  registrationOpen: false,
  startsAt: "",
  endsAt: "",
};

const strictDateTimeLocal = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function normalizeIsoToDateTimeLocal(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  if (year < 1000 || year > 9999) return "";

  const yyyy = String(year).padStart(4, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function eventToFormValues(event: ApiSchemas["Event"]): EventFormValues {
  return {
    title: event.title,
    keywords: event.keywords ?? "",
    description: event.description,
    status: event.status,
    registrationOpen: event.registrationOpen ?? false,
    startsAt: normalizeIsoToDateTimeLocal(event.startsAt),
    endsAt: normalizeIsoToDateTimeLocal(event.endsAt),
  };
}

function parseDateTimeLocal(value: string): Date | null {
  if (!value) return null;
  if (!strictDateTimeLocal.test(value)) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  if (year < 1000 || year > 9999) return null;
  return date;
}

function EventFormFields({
  eventId,
  isEdit,
  initial,
}: {
  eventId?: string;
  isEdit: boolean;
  initial: EventFormValues;
}) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(initial.title);
  const [keywords, setKeywords] = useState(initial.keywords);
  const [description, setDescription] = useState(initial.description);
  const [status, setStatus] = useState(initial.status);
  const [registrationOpen, setRegistrationOpen] = useState(initial.registrationOpen);
  const [startsAt, setStartsAt] = useState(initial.startsAt);
  const [endsAt, setEndsAt] = useState(initial.endsAt);

  const createMutation = rqClient.useMutation("post", "/admin/events", {
    onSuccess: (data) => {
      toast.success("Мероприятие создано");
      navigate(pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId: data.id }));
    },
  });

  const updateMutation = rqClient.useMutation("put", "/admin/events/{eventId}", {
    onSuccess: () => {
      toast.success("Сохранено");
    },
  });

  const submit = () => {
    const parsedStart = parseDateTimeLocal(startsAt);
    const parsedEnd = parseDateTimeLocal(endsAt);

    if (!parsedStart || !parsedEnd) {
      toast.error("Укажите корректные даты в формате YYYY-MM-DDTHH:mm");
      return;
    }

    if (parsedStart >= parsedEnd) {
      toast.error("Дата окончания должна быть позже даты начала");
      return;
    }

    const body = {
      title,
      keywords: formatKeywords(parseKeywords(keywords)),
      description,
      status: status as "active" | "completed" | "draft",
      registrationOpen,
      startsAt: parsedStart.toISOString(),
      endsAt: parsedEnd.toISOString(),
    };
    if (isEdit && eventId) {
      updateMutation.mutate({ params: { path: { eventId } }, body });
    } else {
      createMutation.mutate({ body });
    }
  };

  return (
    <>
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
            placeholder="React, Node.js, PostgreSQL"
          />
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
        <div>
          <Label>Статус</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Черновик</SelectItem>
              <SelectItem value="active">Активно</SelectItem>
              <SelectItem value="completed">Завершено</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={registrationOpen}
            onChange={(e) => setRegistrationOpen(e.target.checked)}
          />
          Регистрация открыта
        </label>
        <div>
          <Label>Начало</Label>
          <Input
            type="datetime-local"
            value={startsAt}
            step={60}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <Label>Окончание</Label>
          <Input
            type="datetime-local"
            value={endsAt}
            step={60}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button onClick={submit}>Сохранить</Button>
        <Button asChild variant="outline">
          <Link to={ROUTES.ADMIN_EVENTS}>Назад</Link>
        </Button>
      </div>
      {isEdit && eventId ? (
        <div className="flex flex-wrap gap-2 pt-4">
          <Button asChild variant="secondary" size="sm">
            <Link to={pathTo(ROUTES.ADMIN_EVENT_CASES, { eventId })}>Кейсы</Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link to={pathTo(ROUTES.ADMIN_EVENT_INVITES, { eventId })}>
              Инвайт-коды
            </Link>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <Link to={pathTo(ROUTES.ADMIN_EVENT_TEAMS, { eventId })}>Команды</Link>
          </Button>
        </div>
      ) : null}
    </>
  );
}

function AdminEventFormPage() {
  const { eventId } = useParams();
  const isEdit = Boolean(eventId);

  const { data: existing, isPending } = rqClient.useQuery(
    "get",
    "/admin/events",
    undefined,
    { enabled: isEdit },
  );

  const event = existing?.events.find((e) => e.id === eventId);

  return (
    <div className="max-w-lg space-y-4">
      <PageHeader
        title={isEdit ? "Редактирование мероприятия" : "Новое мероприятие"}
        description={
          isEdit ? "Изменение параметров и настроек события" : "Создание нового события"
        }
      />
      {isEdit && isPending ? (
        <p className="text-muted-foreground text-sm">Загрузка…</p>
      ) : isEdit && !event ? (
        <p className="text-destructive text-sm">Мероприятие не найдено</p>
      ) : (
        <EventFormFields
          key={event?.id ?? "new"}
          eventId={eventId}
          isEdit={isEdit}
          initial={event ? eventToFormValues(event) : emptyForm}
        />
      )}
    </div>
  );
}

export const Component = AdminEventFormPage;
