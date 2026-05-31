import { ROUTES, buildAuthRedirectPath, getCabinetHomeRoute } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import { AuthLayout } from "./ui/auth-layout";
import { RegisterForm } from "./ui/register-form";

function RegisterPage() {
  const { isAuthenticated, session, viewerRole } = useSession();
  const [searchParams] = useSearchParams();

  if (isAuthenticated && session) {
    if (viewerRole === "captain") {
      return <Navigate to={buildAuthRedirectPath(searchParams.get("next"))} replace />;
    }
    return <Navigate to={getCabinetHomeRoute(session.role)} replace />;
  }

  return (
    <AuthLayout
      title="Регистрация капитана"
      form={<RegisterForm />}
      footerText={
        <>
          <p className="text-muted-foreground mb-2 text-xs">
            Сначала создайте аккаунт капитана, затем зарегистрируйте команду на
            мероприятии. После регистрации вы войдёте в кабинет как капитан; логин и
            пароль команды передайте участникам.
          </p>
          Уже есть аккаунт? <Link to={ROUTES.LOGIN}>Войти</Link>
        </>
      }
    />
  );
}

export const Component = RegisterPage;
