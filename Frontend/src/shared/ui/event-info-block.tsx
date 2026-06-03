import {
  EVENT_FORMAT_LABELS,
  formatEventDateRange,
  formatMinAge,
  hasEventInfo,
  type EventInfoFields,
} from "@/shared/lib/event-info.ts";
import { CalendarIcon, MapPinIcon, MonitorIcon, UsersIcon } from "lucide-react";

export function EventInfoBlock({
  event,
  compact = false,
}: {
  event: EventInfoFields;
  compact?: boolean;
}) {
  if (!hasEventInfo(event)) return null;

  const dates = formatEventDateRange(event.starts_at, event.ends_at);
  const location = event.location?.trim();
  const formatLabel = event.format ? EVENT_FORMAT_LABELS[event.format] : null;
  const age = formatMinAge(event.min_age);

  const rowClass = compact
    ? "text-muted-foreground flex items-start gap-1.5 text-sm"
    : "text-muted-foreground flex items-start gap-2 text-sm";

  return (
    <ul className={compact ? "mt-1.5 flex flex-col gap-1" : "flex flex-col gap-2"}>
      {dates ? (
        <li className={rowClass}>
          <CalendarIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{dates}</span>
        </li>
      ) : null}
      {location ? (
        <li className={rowClass}>
          <MapPinIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{location}</span>
        </li>
      ) : null}
      {formatLabel ? (
        <li className={rowClass}>
          <MonitorIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>{formatLabel}</span>
        </li>
      ) : null}
      {age ? (
        <li className={rowClass}>
          <UsersIcon className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>Участие {age}</span>
        </li>
      ) : null}
    </ul>
  );
}
