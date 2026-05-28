import { publicRqClient } from "@/shared/api/instance";
import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { useNavigate } from "react-router-dom";

export function useLogin() {
  const navigate = useNavigate();
  const session = useSession();

  const loginMutation = publicRqClient.useMutation("post", "/auth/login", {
    onSuccess(data) {
      session.setTempToken(data.tempToken);
      navigate(ROUTES.VERIFY_2FA);
    },
  });

  const login = (data: ApiSchemas["LoginRequest"]) => {
    loginMutation.mutate({ body: data });
  };

  const errorMessage = loginMutation.isError
    ? loginMutation.error.message
    : undefined;

  return {
    login,
    isPending: loginMutation.isPending,
    errorMessage,
  };
}
