import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/model/routes";
import { Button } from "@/shared/ui/kit/button";

function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-muted-foreground max-w-md">
        Страница не найдена. Проверьте адрес или вернитесь к списку мероприятий.
      </p>
      <Button asChild>
        <Link to={ROUTES.HOME}>На главную</Link>
      </Button>
    </main>
  );
}

export const Component = NotFoundPage;
