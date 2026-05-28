import { publicRqClient } from "@/shared/api/instance";
import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { ROUTES } from "@/shared/model/routes";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function useResetPassword(token: string) {
  const navigate = useNavigate();

  const mutation = publicRqClient.useMutation(
    "post",
    "/auth/reset-password/{token}",
    {
      onSuccess() {
        toast.success("Пароль обновлён");
        navigate(ROUTES.LOGIN);
      },
    },
  );

  const submit = (data: ApiSchemas["ResetPasswordRequest"]) => {
    mutation.mutate({ params: { path: { token } }, body: data });
  };

  return {
    submit,
    isPending: mutation.isPending,
    errorMessage: mutation.isError
      ? String(mutation.error)
      : undefined,
  };
}
