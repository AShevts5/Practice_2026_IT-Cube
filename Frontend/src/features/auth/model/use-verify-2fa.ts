import { authService } from "@/shared/api/services/auth";
import { fetchCaptainProfile } from "@/features/auth/model/fetch-captain-profile";
import { buildAuthRedirectPath, getCabinetHomeRoute, ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

export function useVerify2fa() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { otpChallenge, authTarget, login } = useSession();
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const verify = async (code: string) => {
    if (!otpChallenge || !authTarget) {
      navigate(ROUTES.LOGIN);
      return;
    }

    setIsPending(true);
    setErrorMessage(undefined);

    try {
      const response = await authService.verifyOtp(authTarget, {
        challenge_id: otpChallenge.challengeId,
        code,
      });

      if (response.error || !response.data?.access_token) {
        setErrorMessage("Неверный или просроченный код");
        return;
      }

      login(response.data.access_token);
      toast.success("Вход выполнен");

      if (authTarget === "captain") {
        const profile = await fetchCaptainProfile();
        if (profile?.has_team) {
          navigate(getCabinetHomeRoute("captain"));
          return;
        }
        navigate(buildAuthRedirectPath(searchParams.get("next")));
        return;
      }

      const role = authTarget === "admin" ? "admin" : "team";
      navigate(getCabinetHomeRoute(role));
    } catch {
      setErrorMessage("Не удалось подтвердить код");
    } finally {
      setIsPending(false);
    }
  };

  return {
    verify,
    isPending,
    errorMessage,
    hasChallenge: Boolean(otpChallenge),
    channel: otpChallenge?.channel ?? "email",
  };
}
