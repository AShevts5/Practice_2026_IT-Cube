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
import { useSession } from "@/shared/model/session";
import { zodResolver } from "@hookform/resolvers/zod";
import { jwtDecode } from "jwt-decode";
import { Mail, Smartphone } from "lucide-react";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useVerify2fa } from "../model/use-verify-2fa";

const schema = z.object({
  code: z.string().length(6, "Код — 6 цифр"),
});

export function Verify2faForm() {
  const { tempToken } = useSession();
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });
  const { verify, isPending, errorMessage } = useVerify2fa();

  const email = useMemo(() => {
    if (!tempToken) return null;
    try {
      return jwtDecode<{ email?: string }>(tempToken).email ?? null;
    } catch {
      return null;
    }
  }, [tempToken]);

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(({ code }) => verify(code))}
      >
        <div className="border-border bg-muted/40 flex gap-3 rounded-xl border p-3">
          <Mail className="text-primary mt-0.5 size-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium">Код отправлен на почту</p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {email ? (
                <>
                  Проверьте входящие и введите 6-значный код, отправленный на{" "}
                  <span className="text-foreground font-medium">{email}</span>
                </>
              ) : (
                "Проверьте входящие и введите 6-значный код из письма"
              )}
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Код из письма</FormLabel>
              <FormControl>
                <Input
                  placeholder="123456"
                  maxLength={6}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <p className="text-muted-foreground text-xs">
          Демо-код: <strong className="text-foreground">123456</strong>
        </p>

        {errorMessage && (
          <p className="text-destructive text-sm">{errorMessage}</p>
        )}

        <Button disabled={isPending} type="submit">
          Подтвердить
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled
          className="w-full normal-case tracking-normal"
        >
          <Smartphone className="size-4" />
          Подтверждение по SMS
        </Button>
      </form>
    </Form>
  );
}
