import { ROUTES } from "@/shared/model/routes";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

export function useForgotPassword() {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  const submit = async (_email: string) => {
    setIsPending(true);
    toast.info("Восстановление пароля пока не реализовано в API бэкенда");
    navigate(ROUTES.LOGIN);
    setIsPending(false);
  };

  return { submit, isPending, errorMessage: undefined };
};
