import { ROUTES } from "@/shared/model/routes";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";

export function useResetPassword(_token: string) {
  const navigate = useNavigate();
  const [isPending, setIsPending] = useState(false);

  const reset = async (_password: string) => {
    setIsPending(true);
    toast.info("Сброс пароля пока не реализован в API бэкенда");
    navigate(ROUTES.LOGIN);
    setIsPending(false);
  };

  return { reset, isPending, errorMessage: undefined };
};
