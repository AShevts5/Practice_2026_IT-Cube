import { getCabinetHomeRoute, ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { Navigate } from "react-router-dom";
import { AuthLayout } from "./ui/auth-layout";
import { Verify2faForm } from "./ui/verify-2fa-form";

function Verify2faPage() {
  const { otpChallenge, otpFlow, isAuthenticated, session } = useSession();

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

  if (!otpChallenge) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const flow = otpFlow ?? otpChallenge?.flow ?? "login";

  return (
    <AuthLayout
      title={flow === "register" ? "Подтверждение регистрации" : "Подтверждение входа"}
      form={<Verify2faForm />}
    />
  );
}

export const Component = Verify2faPage;
