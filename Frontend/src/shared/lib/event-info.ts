import type { ApiSchemas } from "@/shared/api/schema/index.ts";

export const EVENT_FORMAT_LABELS: Record<ApiSchemas["EventFormat"], string> = {
  online: "Онлайн",
  offline: "Оффлайн",
  hybrid: "Гибрид (онлайн + оффлайн)",
};

export function formatEventDateRange(
  startsAt?: string | null,
  endsAt?: string | null,
): string | null {
  if (!startsAt) return null;
  const start = new Date(startsAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  if (!endsAt) return start;
  const end = new Date(endsAt).toLocaleString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${start} — ${end}`;
}

export function formatMinAge(minAge?: number | null): string | null {
  if (minAge == null || minAge <= 0) return null;
  return `от ${minAge} лет`;
}

export function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fromDatetimeLocalValue(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  return new Date(trimmed).toISOString();
}

export type EventInfoFields = Pick<
  ApiSchemas["EventCard"],
  "starts_at" | "ends_at" | "location" | "format" | "min_age"
>;

export function hasEventInfo(event: EventInfoFields): boolean {
  return Boolean(
    event.starts_at ||
      event.location?.trim() ||
      event.format ||
      (event.min_age != null && event.min_age > 0),
  );
}
