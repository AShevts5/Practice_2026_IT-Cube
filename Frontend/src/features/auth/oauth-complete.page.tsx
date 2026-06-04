import { publicFetchClient } from "@/shared/api/instance";
import { ROUTES, getCabinetHomeRoute } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { Button } from "@/shared/ui/kit/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/kit/form";
import { Input } from "@/shared/ui/kit/input";
import { PhoneInput } from "@/shared/ui/kit/phone-input";
import { isValidRuPhone, normalizeRuPhone, RU_PHONE_ERROR } from "@/shared/lib/phone";
import { asFetchResult, getErrorMessage, parseApiError } from "@/shared/lib/errors";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { AuthLayout } from "./ui/auth-layout";

const schema = z.object({
  full_name: z.string().min(3, "Укажите ФИО"),
  phone: z.string().min(10, RU_PHONE_ERROR).refine(isValidRuPhone, RU_PHONE_ERROR),
});

function OAuthCompletePage() {
  const [searchParams] = useSearchParams();
  const signupToken = searchParams.get("signup_token");
  const navigate = useNavigate();
  const { login, isAuthenticated, session } = useSession();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isPending, setIsPending] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { full_name: "", phone: "" },
  });

  if (!signupToken) {
    return <Navigate to={ROUTES.REGISTER} replace />;
  }

  if (isAuthenticated && session?.role === "captain") {
    return <Navigate to={getCabinetHomeRoute("captain")} replace />;
  }

  const onSubmit = form.handleSubmit(async (data) => {
    setIsPending(true);
    setErrorMessage(undefined);
    try {
      const response = asFetchResult<{ access_token: string }>(
        await publicFetchClient.POST("/auth/oauth/complete", {
          body: {
            signup_token: signupToken,
            full_name: data.full_name,
            phone: normalizeRuPhone(data.phone),
          },
        }),
      );
      if (response.error || !response.data?.access_token) {
        if (response.response) {
          const body = await parseApiError(response.response);
          setErrorMessage(getErrorMessage(body, "Не удалось завершить регистрацию"));
        } else {
          setErrorMessage("Не удалось завершить регистрацию");
        }
        return;
      }
      login(response.data.access_token);
      toast.success("Регистрация завершена");
      navigate(getCabinetHomeRoute("captain"), { replace: true });
    } catch {
      setErrorMessage("Не удалось завершить регистрацию");
    } finally {
      setIsPending(false);
    }
  });

  return (
    <AuthLayout
      title="Завершение регистрации"
      form={
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={onSubmit}>
            <p className="text-muted-foreground text-xs">
              Вход через соцсеть подтверждён. Укажите ФИО и телефон капитана.
            </p>
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ФИО капитана</FormLabel>
                  <FormControl>
                    <Input placeholder="Иванов Иван" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Телефон</FormLabel>
                  <FormControl>
                    <PhoneInput
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {errorMessage ? (
              <p className="text-destructive text-sm">{errorMessage}</p>
            ) : null}
            <Button disabled={isPending} type="submit">
              {isPending ? "Сохранение…" : "Завершить регистрацию"}
            </Button>
          </form>
        </Form>
      }
      footerText={
        <>
          <Link to={ROUTES.LOGIN}>Войти</Link>
          {" · "}
          <Link to={ROUTES.REGISTER}>Регистрация по email</Link>
        </>
      }
    />
  );
}

export const Component = OAuthCompletePage;
