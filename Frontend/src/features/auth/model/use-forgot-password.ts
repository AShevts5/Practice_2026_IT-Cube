import { authService } from "@/shared/api/services/auth";
import { asFetchResult, getErrorMessage, parseApiError } from "@/shared/lib/errors";
import { ROUTES } from "@/shared/model/routes";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

export function useForgotPassword() {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const submit = async (email: string) => {
    setIsPending(true);
    setErrorMessage(undefined);

    try {
      const response = asFetchResult<{ message?: string }>(
        await authService.forgotPassword({ email: email.trim().toLowerCase() }),
      );

      if (response.error || !response.response?.ok) {
        if (response.response?.status === 422) {
          const body = await parseApiError(response.response);
          setErrorMessage(
            getErrorMessage(body, "Не удалось отправить письмо"),
          );
          return;
        }
        setErrorMessage("Не удалось отправить письмо");
        return;
      }

      toast.success(
        response.data?.message ??
          "Если email зарегистрирован, на него отправлена ссылка для сброса пароля",
      );
      navigate(ROUTES.LOGIN);
    } catch {
      setErrorMessage("Не удалось отправить письмо");
    } finally {
      setIsPending(false);
    }
  };

  return { submit, isPending, errorMessage };
}
