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
import { Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useVerify2fa } from "../model/use-verify-2fa";

const schema = z.object({
  code: z.string().min(4, "Введите код").max(8),
});

export function Verify2faForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });
  const { verify, isPending, errorMessage, channel } = useVerify2fa();

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(({ code }) => verify(code))}
      >
        <div className="border-border bg-muted/40 flex gap-3 rounded-xl border p-3">
          <Mail className="text-primary mt-0.5 size-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium">
              {channel === "sms" ? "Код отправлен по SMS" : "Код отправлен на почту"}
            </p>
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              Проверьте {channel === "sms" ? "SMS" : "входящие и папку «Спам»"} и
              введите код из сообщения. Код действует ограниченное время.
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Код подтверждения</FormLabel>
              <FormControl>
                <Input
                  placeholder="123456"
                  maxLength={8}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {errorMessage && (
          <p className="text-destructive text-sm">{errorMessage}</p>
        )}

        <Button disabled={isPending} type="submit">
          Подтвердить
        </Button>
      </form>
    </Form>
  );
};
