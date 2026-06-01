import { authService } from "@/shared/api/services/auth";
import { getErrorMessage, parseApiError } from "@/shared/lib/errors";
import { ROUTES } from "@/shared/model/routes";
import type { AuthTarget } from "@/shared/model/session";
import { useSession } from "@/shared/model/session";
import { useNavigate } from "react-router-dom";
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
  const { setOtpChallenge } = useSession();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const login = async (data: LoginForm) => {
    setIsPending(true);
    setErrorMessage(undefined);

    try {
      for (const target of loginOrder(data.login)) {
        const response = await authService.startLogin(target, data);
        if (!response.error && response.data) {
          setOtpChallenge(
            response.data.challenge_id,
            response.data.channel,
            target,
          );
          navigate(ROUTES.VERIFY_2FA);
          return;
        }
        if (response.response?.status === 422) {
          const body = await parseApiError(response.response);
          setErrorMessage(
            getErrorMessage(body, "Не удалось отправить код подтверждения"),
          );
          return;
        }
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
