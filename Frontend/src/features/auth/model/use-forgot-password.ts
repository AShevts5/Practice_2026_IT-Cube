import { publicRqClient } from "@/shared/api/instance";
import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { toast } from "sonner";

export function useForgotPassword() {
  const mutation = publicRqClient.useMutation("post", "/auth/forgot-password", {
    onSuccess() {
      toast.success("Если email найден, мы отправили ссылку для сброса");
    },
  });

  const submit = (data: ApiSchemas["ForgotPasswordRequest"]) => {
    mutation.mutate({ body: data });
  };

  return {
    submit,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    errorMessage: mutation.isError
      ? String(mutation.error)
      : undefined,
  };
}
