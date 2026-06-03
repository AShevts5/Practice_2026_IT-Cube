import { AppShell } from "@/shared/ui/layout/app-shell.tsx";

function NotFoundPage() {
  return (
    <AppShell>
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-4xl font-semibold">404</h1>
        <p className="text-muted-foreground max-w-md">
          Страница не найдена. Проверьте адрес или перейдите к списку мероприятий по
          логотипу в шапке.
        </p>
      </div>
    </AppShell>
  );
}

export const Component = NotFoundPage;
