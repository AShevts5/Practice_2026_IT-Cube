import { Button } from "@/shared/ui/kit/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  Form,
} from "@/shared/ui/kit/form";
import { Input } from "@/shared/ui/kit/input";
import { PasswordInput } from "@/shared/ui/kit/password-input";
import { PhoneInput } from "@/shared/ui/kit/phone-input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { isValidRuPhone, normalizeRuPhone, RU_PHONE_ERROR } from "@/shared/lib/phone";
import { useRegister } from "../model/use-register";
import { SocialLoginButtons } from "./social-login-buttons";

const registerSchema = z
  .object({
    full_name: z.string().min(3, "Укажите ФИО"),
    email: z.string().min(1, "Email обязателен").email("Неверный email"),
    phone: z
      .string()
      .min(10, RU_PHONE_ERROR)
      .refine(isValidRuPhone, RU_PHONE_ERROR),
    password: z
      .string()
      .min(1, "Пароль обязателен")
      .min(6, "Пароль должен быть не менее 6 символов"),
    confirmPassword: z.string().optional(),
    personal_data_consent: z.boolean().refine((value) => value, {
      message: "Необходимо согласие на обработку персональных данных",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Пароли не совпадают",
  });

export function RegisterForm() {
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      personal_data_consent: false,
    },
  });

  const { errorMessage, isPending, register } = useRegister();

  const onSubmit = form.handleSubmit(({ confirmPassword: _, ...data }) =>
    register({ ...data, phone: normalizeRuPhone(data.phone) }),
  );

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <SocialLoginButtons flow="register" />
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="captain@example.com" type="email" {...field} />
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
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Пароль</FormLabel>
              <FormControl>
                <PasswordInput placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Подтвердите пароль</FormLabel>
              <FormControl>
                <PasswordInput {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="personal_data_consent"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-3">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value === true}
                    onChange={(e) => field.onChange(e.target.checked)}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                    className="border-input text-primary focus-visible:ring-ring/30 mt-0.5 size-4 shrink-0 rounded border shadow-xs focus-visible:ring-[3px] focus-visible:outline-none"
                  />
                </FormControl>
                <div className="space-y-1">
                  <FormLabel className="text-foreground text-sm font-normal normal-case tracking-normal">
                    Я согласен на обработку персональных данных
                  </FormLabel>
                  <FormMessage />
                </div>
              </div>
            </FormItem>
          )}
        />

        {errorMessage ? (
          <p className="text-destructive text-sm">{errorMessage}</p>
        ) : null}

        <Button disabled={isPending} type="submit">
          {isPending ? "Регистрация…" : "Зарегистрироваться как капитан"}
        </Button>
      </form>
    </Form>
  );
}
