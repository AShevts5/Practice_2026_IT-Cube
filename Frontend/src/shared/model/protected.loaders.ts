import { redirect } from "react-router-dom";
import { getCabinetHomeRoute, ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";

async function ensureAuth() {
  const token = await useSession.getState().refreshToken();

  if (!token) {
    useSession.getState().logout();
    return redirect(ROUTES.LOGIN);
  }

  const { session } = useSession.getState();

  if (!session?.twoFaVerified) {
    return redirect(ROUTES.VERIFY_2FA);
  }

  return null;
}

export async function protectedLoader() {
  return ensureAuth();
}

export async function cabinetLoader() {
  const result = await ensureAuth();
  if (result) return result;

  const { session } = useSession.getState();
  if (session?.role === "admin") {
    return redirect(ROUTES.ADMIN);
  }
  if (session?.role !== "team") {
    return redirect(ROUTES.HOME);
  }

  return null;
}

export async function captainOnlyLoader() {
  const result = await cabinetLoader();
  if (result) return result;

  const { session } = useSession.getState();
  if (session?.role !== "team") {
    return redirect(getCabinetHomeRoute(session?.role));
  }

  return null;
}

export async function captainDashboardLoader() {
  const result = await cabinetLoader();
  if (result) return result;

  return null;
}

export async function adminLoader() {
  const result = await ensureAuth();
  if (result) return result;

  const { session } = useSession.getState();
  if (session?.role !== "admin") {
    return redirect(getCabinetHomeRoute(session?.role));
  }

  return null;
}
