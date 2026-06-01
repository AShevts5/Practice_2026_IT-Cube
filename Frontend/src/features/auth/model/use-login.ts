import { authService } from "@/shared/api/services/auth";
import { asFetchResult, getErrorMessage, parseApiError } from "@/shared/lib/errors";
import { getCabinetHomeRoute, ROUTES } from "@/shared/model/routes";
import type { AuthTarget } from "@/shared/model/session";
import { useSession } from "@/shared/model/session";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

type LoginForm = {
  login: string;
  password: string;
};

function loginOrder(login: string): AuthTarget[] {
  if (login.includes("@")) {
    return ["admin", "captain", "team"];
  }
  return ["team", "captain", "admin"];
}

export function useLogin() {
  const navigate = useNavigate();
  const { setOtpChallenge, login: storeSession } = useSession();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const login = async (data: LoginForm) => {
    setIsPending(true);
    setErrorMessage(undefined);

    try {
      for (const target of loginOrder(data.login)) {
        const response = asFetchResult<{
          access_token?: string;
          challenge_id?: number;
          channel?: string;
        }>(await authService.startLogin(target, data));
        if (response.error || !response.data) {
          if (response.response?.status === 422) {
            const body = await parseApiError(response.response);
            setErrorMessage(
              getErrorMessage(body, "Не удалось отправить код подтверждения"),
            );
            return;
          }
          continue;
        }
        if (target === "team" && response.data.access_token) {
          storeSession(response.data.access_token);
          toast.success("Вход выполнен");
          navigate(getCabinetHomeRoute("team"));
          return;
        }
        if (response.data.challenge_id) {
          setOtpChallenge(
            response.data.challenge_id,
            response.data.channel ?? "email",
            target,
          );
          navigate(ROUTES.VERIFY_2FA);
          return;
        }
        continue;
      }

      setErrorMessage("Неверный логин или пароль");
    } catch {
      setErrorMessage("Не удалось выполнить вход");
    } finally {
      setIsPending(false);
    }
  };

  return {
    login,
    isPending,
    errorMessage,
  };
}
