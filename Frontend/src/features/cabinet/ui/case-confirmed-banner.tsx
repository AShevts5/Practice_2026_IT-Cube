import { CheckCircle2Icon } from "lucide-react";

export function CaseConfirmedBanner({
  caseTitle,
  eventTitle,
}: {
  caseTitle: string;
  eventTitle: string;
}) {
  return (
    <div className="border-success/30 bg-success-muted text-success-foreground mb-8 flex gap-4 rounded-2xl border px-5 py-4 dark:border-emerald-500/30 dark:bg-emerald-500/10">
      <CheckCircle2Icon className="text-success mt-0.5 size-6 shrink-0 dark:text-emerald-500" />
      <div>
        <p className="text-success font-semibold dark:text-emerald-700">
          Кейс подтверждён
        </p>
        <p className="text-success-foreground/90 mt-1 text-base leading-relaxed dark:text-emerald-50/95">
          Ваша команда участвует в кейсе «{caseTitle}» в рамках мероприятия «
          {eventTitle}». Изменить выбор можно до дедлайна на этой странице.
        </p>
      </div>
    </div>
  );
}
