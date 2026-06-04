import { SITE } from "@/shared/model/site";
import { getCabinetHomeRoute, ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { VIEWER_ROLE_LABELS, hasTeamCabinetAccess, isCaptain } from "@/shared/model/viewer-role";
import { useCaptainProfile } from "@/features/auth/model/use-captain-profile";
import { Button } from "@/shared/ui/kit/button";
import { ThemeToggle } from "@/shared/ui/theme-toggle";
import { Link } from "react-router-dom";

export function AppHeader() {
  const { session, logout, isAuthenticated, viewerRole } = useSession();
  const { data: captain } = useCaptainProfile();
  const showCabinet = hasTeamCabinetAccess(viewerRole, captain?.has_team);

  return (
    <header className="border-border/30 bg-background/70 shrink-0 border-b px-3 py-3 backdrop-blur-md sm:px-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <Link
          to={ROUTES.HOME}
          className="max-w-full truncate text-base font-semibold transition-opacity hover:opacity-80 sm:text-lg"
          title="На главную"
        >
          {SITE.host}
        </Link>
        <nav className="flex flex-wrap items-center justify-start gap-2 sm:justify-end sm:gap-3">
          <ThemeToggle />
          {isAuthenticated && session ? (
            <>
              {viewerRole === "admin" ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to={ROUTES.ADMIN}>Панель администратора</Link>
                </Button>
              ) : showCabinet ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to={getCabinetHomeRoute(session.role)}>Кабинет команды</Link>
                </Button>
              ) : isCaptain(viewerRole) ? (
                <Button asChild variant="ghost" size="sm">
                  <Link to={ROUTES.HOME}>Регистрация команды</Link>
                </Button>
              ) : null}
              <span className="text-muted-foreground hidden text-sm sm:inline">
                {VIEWER_ROLE_LABELS[viewerRole]}
              </span>
              <Button variant="outline" size="sm" onClick={() => logout()}>
                Выйти
              </Button>
            </>
          ) : (
            <>
              <span className="text-muted-foreground hidden text-sm sm:inline">
                {VIEWER_ROLE_LABELS.guest}
              </span>
              <Button asChild variant="outline" size="sm">
                <Link to={ROUTES.REGISTER}>Стать капитаном</Link>
              </Button>
              <Button asChild size="sm">
                <Link to={ROUTES.LOGIN}>Войти</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
