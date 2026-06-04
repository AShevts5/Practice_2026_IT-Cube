import { ROUTES, getCabinetHomeRoute } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { useEffect } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { mapOAuthError } from "./model/oauth";

function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useSession();

  const status = searchParams.get("status");
  const accessToken = searchParams.get("access_token");
  const signupToken = searchParams.get("signup_token");
  const message = searchParams.get("message");

  useEffect(() => {
    if (status === "success" && accessToken) {
      login(accessToken);
      toast.success("Вход выполнен");
      navigate(getCabinetHomeRoute("captain"), { replace: true });
      return;
    }
    if (status === "complete" && signupToken) {
      navigate(`${ROUTES.OAUTH_COMPLETE}?signup_token=${encodeURIComponent(signupToken)}`, {
        replace: true,
      });
      return;
    }
    if (status === "error") {
      toast.error(mapOAuthError(message));
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }, [status, accessToken, signupToken, message, login, navigate]);

  if (status === "success" && accessToken) {
    return null;
  }

  if (status === "complete" && signupToken) {
    return (
      <Navigate
        to={`${ROUTES.OAUTH_COMPLETE}?signup_token=${encodeURIComponent(signupToken)}`}
        replace
      />
    );
  }

  if (!status || status === "error") {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  return (
    <p className="text-muted-foreground p-8 text-center text-sm">Завершаем вход…</p>
  );
}

export const Component = OAuthCallbackPage;
