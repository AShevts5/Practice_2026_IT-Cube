import { publicRqClient } from "@/shared/api/instance";
import type { ApiSchemas } from "@/shared/api/schema/index.ts";
import { pathTo, ROUTES } from "@/shared/model/routes";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import { Stepper } from "@/shared/ui/kit/stepper";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { useSession } from "@/shared/model/session";
import { useEffect } from "react";

const STEPS = [
  { id: "case", title: "Кейс" },
  { id: "team", title: "Команда" },
  { id: "invite", title: "Инвайт-код" },
  { id: "done", title: "Готово" },
];

const inviteSchema = z.object({
  code: z.string().min(1, "Введите код"),
});

const teamSchema = z.object({
  name: z.string().min(2, "Название команды"),
  captainName: z.string().min(2, "ФИО капитана"),
  email: z.string().email("Email"),
  phone: z.string().min(10, "Телефон"),
});

function EventRegisterPage() {
  const { slug } = useParams();
  const { isAuthenticated, session } = useSession();
  const [step, setStep] = useState(0);
  const [caseId, setCaseId] = useState("");
  const [success, setSuccess] = useState<{
    login: string;
    password: string;
    emailSent: boolean;
  } | null>(null);

  const inviteForm = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { code: "" },
  });
  const teamForm = useForm({
    resolver: zodResolver(teamSchema),
  });

  const { data: casesData } = publicRqClient.useQuery(
    "get",
    "/events/{slug}/cases",
    {
      params: { path: { slug: slug! }, query: { available: true } },
    },
    { enabled: Boolean(slug) },
  );

  const verifyMutation = publicRqClient.useMutation(
    "post",
    "/events/{slug}/verify-invite-code",
  );
  const registerMutation = publicRqClient.useMutation(
    "post",
    "/events/{slug}/register",
  );

  const { data: event } = publicRqClient.useQuery(
    "get",
    "/events/{slug}",
    { params: { path: { slug: slug! } } },
    { enabled: Boolean(slug) },
  );

  useEffect(() => {
    if (!isAuthenticated) {
      toast.info("Войдите в аккаунт, чтобы зарегистрировать команду");
    }
  }, [isAuthenticated]);

  if (!slug) return null;

  if (session?.role === "admin") {
    if (event) {
      return (
        <Navigate
          to={pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId: event.id })}
          replace
        />
      );
    }
    return <Navigate to={ROUTES.ADMIN} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  const onInvite = inviteForm.handleSubmit(async ({ code }) => {
    const team = teamForm.getValues();
    if (!caseId) {
      toast.error("Выберите кейс");
      return;
    }

    const teamValidation = teamSchema.safeParse(team);
    if (!teamValidation.success) {
      toast.error("Заполните данные команды");
      return;
    }

    const res = await verifyMutation.mutateAsync({
      params: { path: { slug } },
      body: { code },
    });
    if (!res.valid) {
      toast.error("Неверный инвайт-код (демо: INVITE2026)");
      return;
    }
    try {
      const registerRes = await registerMutation.mutateAsync({
        params: { path: { slug } },
        body: { ...teamValidation.data, caseId, inviteCode: code },
      });
      setSuccess({
        login: registerRes.credentials.login,
        password: registerRes.credentials.password,
        emailSent: registerRes.emailSent,
      });
      setStep(3);
    } catch {
      return;
    }
  });

  const onTeamNext = teamForm.handleSubmit(() => {
    setStep(2);
  });

  const cases = casesData?.cases ?? [];

  return (
    <div className="max-w-lg">
      <PageHeader
        title="Регистрация команды"
        description="Пошаговая регистрация по инвайт-коду"
      />
      <Stepper steps={STEPS} currentStep={step} className="mb-8" />

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium">Кейс</label>
          <Select value={caseId} onValueChange={setCaseId}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите кейс" />
            </SelectTrigger>
            <SelectContent>
              {cases.map((c: ApiSchemas["Case"]) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} (свободно: {c.free})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {cases.length === 0 && (
            <p className="text-muted-foreground text-sm">Нет свободных кейсов</p>
          )}
          <div className="flex gap-2">
            <Button onClick={() => setStep(1)} disabled={!caseId}>
              Далее
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <Form {...teamForm}>
          <form onSubmit={onTeamNext} className="flex flex-col gap-4">
            {(
              [
                ["name", "Название команды"],
                ["captainName", "Капитан"],
                ["email", "Email"],
                ["phone", "Телефон"],
              ] as const
            ).map(([name, label]) => (
              <FormField
                key={name}
                control={teamForm.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setStep(0)}>
                Назад
              </Button>
              <Button type="submit">Далее</Button>
            </div>
          </form>
        </Form>
      )}

      {step === 2 && (
        <Form {...inviteForm}>
          <form onSubmit={onInvite} className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">Демо-код: INVITE2026</p>
            <FormField
              control={inviteForm.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Инвайт-код</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={verifyMutation.isPending || registerMutation.isPending}
              >
                Назад
              </Button>
              <Button
                type="submit"
                disabled={verifyMutation.isPending || registerMutation.isPending}
              >
                {verifyMutation.isPending || registerMutation.isPending
                  ? "Проверка..."
                  : "Зарегистрировать"}
              </Button>
            </div>
          </form>
        </Form>
      )}

      {step === 3 && success && (
        <div className="border-border bg-card space-y-4 rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">Регистрация завершена</h2>
          <p className="text-muted-foreground text-sm">
            Сохраните данные для входа в личный кабинет капитана.
          </p>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Логин</dt>
              <dd className="font-mono font-medium">{success.login}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Пароль</dt>
              <dd className="font-mono font-medium">{success.password}</dd>
            </div>
          </dl>
          {success.emailSent ? (
            <p className="text-sm text-green-700 dark:text-green-400">
              Письмо с данными отправлено на указанный email.
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Email не отправлен (демо-режим).
            </p>
          )}
          <Button asChild>
            <Link to={ROUTES.LOGIN}>Войти</Link>
          </Button>
        </div>
      )}

      <Button asChild variant="link" className="mt-6 px-0">
        <Link to={ROUTES.HOME}>На главную</Link>
      </Button>
    </div>
  );
}

export const Component = EventRegisterPage;
