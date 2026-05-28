import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/kit/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";

export function AppHeader() {
  const { session, logout } = useSession();

  return (
    <header className="border-border/30 bg-background/70 mb-6 border-b px-4 py-3 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <Link to={ROUTES.HOME} className="text-xl font-semibold">
          Events Platform
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        {session ? (
          <>
            <span className="text-muted-foreground text-sm">{session.email}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logout()}
              className="hover:bg-destructive/10"
            >
              Выйти
            </Button>
          </>
        ) : (
          <Button asChild variant="default" size="sm">
            <Link to={ROUTES.LOGIN}>Войти</Link>
          </Button>
        )}
        </div>
      </div>
    </header>
  );
}
