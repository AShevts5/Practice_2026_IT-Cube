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
import { z } from "zod";
import { useVerify2fa } from "../model/use-verify-2fa";

const schema = z.object({
  code: z.string().length(6, "Код — 6 цифр"),
});

export function Verify2faForm() {
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { code: "" },
  });
  const { verify, isPending, errorMessage } = useVerify2fa();

  return (
    <Form {...form}>
      <form
        className="flex flex-col gap-4"
        onSubmit={form.handleSubmit(({ code }) => verify(code))}
      >
        <p className="text-muted-foreground text-sm">
          Демо-код: <strong>123456</strong>
        </p>
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Код из SMS</FormLabel>
              <FormControl>
                <Input placeholder="123456" maxLength={6} {...field} />
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
}
