import { ROUTES } from "@/shared/model/routes";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useForgotPassword } from "./model/use-forgot-password";
import { AuthLayout } from "./ui/auth-layout";

const schema = z.object({
  email: z.string().min(1).email("Неверный email"),
});

function ForgotPasswordForm() {
  const form = useForm({ resolver: zodResolver(schema) });
  const { submit, isPending, isSuccess, errorMessage } = useForgotPassword();

  if (isSuccess) {
    return (
      <p className="text-muted-foreground text-sm">
        Проверьте почту. Для демо сброса используйте ссылку{" "}
        <Link className="text-primary underline" to="/reset-password/reset-1">
          /reset-password/reset-1
        </Link>
      </p>
    );
  }

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(submit)}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {errorMessage && (
          <p className="text-destructive text-sm">{errorMessage}</p>
        )}
        <Button disabled={isPending} type="submit">
          Отправить ссылку
        </Button>
      </form>
    </Form>
  );
}

function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Восстановление пароля"
      form={<ForgotPasswordForm />}
      footerText={
        <Link to={ROUTES.LOGIN}>Вернуться ко входу</Link>
      }
    />
  );
}

export const Component = ForgotPasswordPage;
