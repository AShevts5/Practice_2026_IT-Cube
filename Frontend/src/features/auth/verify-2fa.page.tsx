import { getCabinetHomeRoute, ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { Navigate } from "react-router-dom";
import { AuthLayout } from "./ui/auth-layout";
import { Verify2faForm } from "./ui/verify-2fa-form";

function Verify2faPage() {
  const { tempToken, isAuthenticated, session } = useSession();

  if (isAuthenticated) {
    return (
      <Navigate
        to={
          session?.role === "admin"
            ? ROUTES.ADMIN
            : getCabinetHomeRoute(session?.role)
        }
        replace
      />
    );
  }

  if (!tempToken) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <AuthLayout
      title="Двухфакторная аутентификация"
      description="Введите одноразовый код, отправленный на ваш телефон"
      form={<Verify2faForm />}
    />
  );
}

export const Component = Verify2faPage;
