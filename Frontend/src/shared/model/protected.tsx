import { Navigate, Outlet } from "react-router-dom";
import { getCabinetHomeRoute, ROUTES } from "@/shared/model/routes";
import type { UserRole } from "@/shared/model/session";
import { useSession } from "@/shared/model/session";

export function ProtectedRoute() {
  const { isAuthenticated, otpChallenge } = useSession();

  if (otpChallenge) {
    return <Navigate to={ROUTES.VERIFY_2FA} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return <Outlet />;
}

export function RoleRoute({ role }: { role: UserRole }) {
  const { session, isAuthenticated, otpChallenge } = useSession();

  if (otpChallenge) {
    return <Navigate to={ROUTES.VERIFY_2FA} replace />;
  }

  if (!isAuthenticated || !session) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (session.role !== role) {
    const to =
      session.role === "admin"
        ? ROUTES.ADMIN
        : getCabinetHomeRoute(session.role);
    return <Navigate to={to} replace />;
  }

  return <Outlet />;
}

export function CaptainOnlyRoute() {
  const { session, isAuthenticated, otpChallenge } = useSession();

  if (otpChallenge) {
    return <Navigate to={ROUTES.VERIFY_2FA} replace />;
  }

  if (!isAuthenticated || !session) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (session.role !== "captain") {
    return <Navigate to={ROUTES.CABINET_DASHBOARD} replace />;
  }

  return <Outlet />;
}
