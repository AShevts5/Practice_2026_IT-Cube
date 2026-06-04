import { authService } from "@/shared/api/services/auth";
import { asFetchResult, getErrorMessage, parseApiError } from "@/shared/lib/errors";
import { ROUTES } from "@/shared/model/routes";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

export function useResetPassword(token: string) {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const reset = async (password: string) => {
    setIsPending(true);
    setErrorMessage(undefined);

    try {
      const response = asFetchResult<{ message?: string }>(
        await authService.resetPassword(token, { password }),
      );

      if (response.error || !response.response?.ok) {
        if (response.response?.status === 422) {
          const body = await parseApiError(response.response);
          setErrorMessage(
            getErrorMessage(body, "Не удалось сменить пароль"),
          );
          return;
        }
        setErrorMessage("Не удалось сменить пароль");
        return;
      }

      toast.success(response.data?.message ?? "Пароль обновлён");
      navigate(ROUTES.LOGIN);
    } catch {
      setErrorMessage("Не удалось сменить пароль");
    } finally {
      setIsPending(false);
    }
  };

  return { reset, isPending, errorMessage };
}
