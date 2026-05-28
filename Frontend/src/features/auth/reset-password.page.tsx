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
import { Link, useParams } from "react-router-dom";
import { z } from "zod";
import { useResetPassword } from "./model/use-reset-password";
import { AuthLayout } from "./ui/auth-layout";

const schema = z.object({
  password: z.string().min(6, "Минимум 6 символов"),
});

function ResetPasswordForm({ token }: { token: string }) {
  const form = useForm({ resolver: zodResolver(schema) });
  const { submit, isPending, errorMessage } = useResetPassword(token);

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(submit)}
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Новый пароль</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {errorMessage && (
          <p className="text-destructive text-sm">{errorMessage}</p>
        )}
        <Button disabled={isPending} type="submit">
          Сохранить
        </Button>
      </form>
    </Form>
  );
}

function ResetPasswordPage() {
  const { token } = useParams();

  if (!token) {
    return null;
  }

  return (
    <AuthLayout
      title="Новый пароль"
      form={<ResetPasswordForm token={token} />}
      footerText={<Link to={ROUTES.LOGIN}>Ко входу</Link>}
    />
  );
}

export const Component = ResetPasswordPage;
