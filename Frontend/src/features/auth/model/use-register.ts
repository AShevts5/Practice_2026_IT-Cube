import { publicRqClient } from "@/shared/api/instance";
import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useRegister() {
  const navigate = useNavigate();
  const session = useSession();

  const registerMutation = publicRqClient.useMutation("post", "/auth/register", {
    onSuccess(data) {
      session.setTempToken(data.tempToken);
      toast.success("Подтвердите вход кодом из SMS");
      navigate(ROUTES.VERIFY_2FA);
    },
  });

  const register = (data: ApiSchemas["RegisterRequest"]) => {
    registerMutation.mutate({ body: data });
  };

  const errorMessage = registerMutation.isError
    ? registerMutation.error.message
    : undefined;

  return {
    register,
    isPending: registerMutation.isPending,
    errorMessage,
  };
}
