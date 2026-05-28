import { publicRqClient } from "@/shared/api/instance";
import { getCabinetHomeRoute, ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useVerify2fa() {
  const navigate = useNavigate();
  const { tempToken, login } = useSession();

  const mutation = publicRqClient.useMutation("post", "/auth/verify-2fa", {
    onSuccess(data) {
      login(data.accessToken);
      toast.success("Вход выполнен");
      const role = data.user.role;
      if (role === "admin") {
        navigate(ROUTES.ADMIN);
      } else if (role === "team") {
        navigate(getCabinetHomeRoute(role));
      } else {
        navigate(ROUTES.HOME);
      }
    },
  });

  const verify = (code: string) => {
    if (!tempToken) {
      navigate(ROUTES.LOGIN);
      return;
    }
    mutation.mutate({ body: { code, tempToken } });
  };

  return {
    verify,
    isPending: mutation.isPending,
    errorMessage: mutation.isError ? mutation.error.message : undefined,
    hasTempToken: Boolean(tempToken),
  };
}
