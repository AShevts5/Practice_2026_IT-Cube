import { getCabinetHomeRoute, ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { Button } from "@/shared/ui/kit/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { Link } from "react-router-dom";

export function AppHeader() {
  const { session, logout, isAuthenticated } = useSession();

  return (
    <header className="border-border/30 bg-background/70 shrink-0 border-b px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <Link to={ROUTES.HOME} className="text-lg font-semibold">
          Events Platform
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <ThemeToggle />
          {isAuthenticated && session ? (
            <>
              {session.role === "admin" ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to={ROUTES.ADMIN}>Панель администратора</Link>
                </Button>
              ) : session.role === "team" ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to={getCabinetHomeRoute(session.role)}>Кабинет</Link>
                </Button>
              ) : null}
              <span className="text-muted-foreground hidden text-sm sm:inline">
                {session.email}
              </span>
              <Button asChild variant="ghost" size="sm">
                <Link to={ROUTES.HOME}>На главную</Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Выйти
              </Button>
            </>
          ) : (
            <Button asChild size="sm">
              <Link to={ROUTES.LOGIN}>Войти</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
