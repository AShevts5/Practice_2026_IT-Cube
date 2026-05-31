import { authService } from "@/shared/api/services/auth";
import { ROUTES, buildAuthRedirectPath } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { getErrorMessage, parseApiError } from "@/shared/lib/errors.ts";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

export function useRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useSession();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
  }) => {
    setIsPending(true);
    setErrorMessage(undefined);

    try {
      const response = await authService.registerCaptain(data);
      if (response.error || !response.data?.access_token) {
        const parsed = response.response ? await parseApiError(response.response) : null;
        setErrorMessage(getErrorMessage(parsed, "Не удалось зарегистрироваться"));
        return;
      }

      login(response.data.access_token);
      toast.success("Аккаунт капитана создан");
      const next = searchParams.get("next");
      navigate(buildAuthRedirectPath(next));
    } catch {
      setErrorMessage("Не удалось зарегистрироваться");
    } finally {
      setIsPending(false);
    }
  };

  return { register, isPending, errorMessage };
}

export function captainRegisterPath(next?: string) {
  if (!next) return ROUTES.REGISTER;
  return `${ROUTES.REGISTER}?next=${encodeURIComponent(next)}`;
}
