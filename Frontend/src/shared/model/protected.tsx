import { Navigate, Outlet } from "react-router-dom";
import { getCabinetHomeRoute, ROUTES } from "@/shared/model/routes";
import type { UserRole } from "@/shared/model/session";
import { useSession } from "@/shared/model/session";

export function ProtectedRoute() {
  const { session } = useSession();

  if (!session?.twoFaVerified) {
    return <Navigate to={ROUTES.VERIFY_2FA} replace />;
  }

  return <Outlet />;
}

export function RoleRoute({ role }: { role: UserRole }) {
  const { session } = useSession();

  if (!session?.twoFaVerified) {
    return <Navigate to={ROUTES.VERIFY_2FA} replace />;
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
  const { session } = useSession();

  if (!session?.twoFaVerified) {
    return <Navigate to={ROUTES.VERIFY_2FA} replace />;
  }

  if (session.role !== "team") {
    return <Navigate to={getCabinetHomeRoute(session.role)} replace />;
  }

  return <Outlet />;
}
