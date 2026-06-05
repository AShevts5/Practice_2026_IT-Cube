import { authService } from "@/shared/api/services/auth";
import { asFetchResult, getErrorMessage, parseApiError } from "@/shared/lib/errors.ts";
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

export function useRegister() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setOtpChallenge } = useSession();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const register = async (data: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
    personal_data_consent: boolean;
  }) => {
    setIsPending(true);
    setErrorMessage(undefined);

    try {
      const response = asFetchResult<{
        challenge_id?: number;
        channel?: string;
      }>(await authService.registerCaptain(data));

      if (response.error || !response.data?.challenge_id) {
        const parsed = response.response ? await parseApiError(response.response) : null;
        setErrorMessage(getErrorMessage(parsed, "Не удалось зарегистрироваться"));
        return;
      }

      setOtpChallenge(
        response.data.challenge_id,
        response.data.channel ?? "email",
        "captain",
        "register",
      );
      toast.success("Код подтверждения отправлен на email");
      const next = searchParams.get("next");
      navigate(next ? `${ROUTES.VERIFY_2FA}?next=${encodeURIComponent(next)}` : ROUTES.VERIFY_2FA);
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
