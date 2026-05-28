import { publicRqClient } from "@/shared/api/instance";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { EventCard } from "./ui/event-card";

function HomePage() {
  const { data, isPending, isError } = publicRqClient.useQuery("get", "/events", {
    params: { query: { publicOnly: true } },
  });

  if (isPending) {
    return (
      <>
        <PageHeader title="Мероприятия" description="Загрузка…" />
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-2xl" />
          ))}
        </div>
      </>
    );
  }

  if (isError) {
    return <p className="text-destructive">Не удалось загрузить мероприятия</p>;
  }

  const events = data?.events ?? [];

  if (events.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center">Мероприятий пока нет</p>
    );
  }

  return (
    <>
      <PageHeader
        title="Мероприятия"
        description="Выберите событие и зарегистрируйте команду"
      />
      <ul className="flex flex-col gap-4">
        {events.map((event) => (
          <li key={event.id}>
            <EventCard event={event} />
          </li>
        ))}
      </ul>
    </>
  );
}

export const Component = HomePage;
