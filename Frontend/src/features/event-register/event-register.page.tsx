import { rqClient, publicRqClient } from "@/shared/api/instance";
import { useQueryClient } from "@tanstack/react-query";
import { captainRegisterPath } from "@/features/auth/model/use-register";
import { pathTo, ROUTES } from "@/shared/model/routes";
import { useSession } from "@/shared/model/session";
import { isGuest, isTeamMember } from "@/shared/model/viewer-role";
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
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const STEPS = [
  { id: "track", title: "Кейс" },
  { id: "team", title: "Команда" },
  { id: "invite", title: "Инвайт-код" },
  { id: "done", title: "Готово" },
];

const inviteSchema = z.object({
  code: z.string().min(4, "Введите код"),
});

const teamSchema = z.object({
  team_name: z.string().min(2, "Название команды"),
});

function EventRegisterPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { viewerRole } = useSession();
  const [step, setStep] = useState(0);
  const [trackId, setTrackId] = useState<number | null>(null);
  const [success, setSuccess] = useState<{
    login: string;
    password: string;
  } | null>(null);

  const inviteForm = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { code: "" },
  });
  const teamForm = useForm({
    resolver: zodResolver(teamSchema),
  });

  const { data: captain } = rqClient.useQuery(
    "get",
    "/captain/me",
    undefined,
    { enabled: viewerRole === "captain" },
  );

  const { data: event } = publicRqClient.useQuery(
    "get",
    "/public/events/{slug}",
    { params: { path: { slug: slug! } } },
    { enabled: Boolean(slug) },
  );

  const registerMutation = rqClient.useMutation(
    "post",
    "/registration/events/{event_slug}/teams",
  );

  if (!slug) return null;

  const registerPath = pathTo(ROUTES.EVENT_REGISTER, { slug });

  if (success) {
    return (
      <div className="max-w-lg">
        <PageHeader title="Регистрация команды" description="Команда успешно создана" />
        <Stepper steps={STEPS} currentStep={3} className="mb-8" />
        <div className="border-border bg-card space-y-4 rounded-2xl border p-6">
          <h2 className="text-lg font-semibold">Команда зарегистрирована</h2>
          <p className="text-muted-foreground text-sm">
            Передайте логин и пароль участникам команды — они войдут в кабинет как
            участники. Вы продолжаете работать в кабинете со своим аккаунтом капитана.
          </p>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Логин команды</dt>
              <dd className="font-mono font-medium">{success.login}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Пароль команды</dt>
              <dd className="font-mono font-medium">{success.password}</dd>
            </div>
          </dl>
          <Button onClick={() => navigate(ROUTES.CABINET_DASHBOARD)}>
            В личный кабинет
          </Button>
        </div>
        <Button asChild variant="link" className="mt-6 px-0">
          <Link to={pathTo(ROUTES.EVENT, { slug })}>← К мероприятию</Link>
        </Button>
      </div>
    );
  }

  if (isGuest(viewerRole)) {
    return <Navigate to={captainRegisterPath(registerPath)} replace />;
  }

  if (isTeamMember(viewerRole)) {
    return <Navigate to={ROUTES.CABINET_DASHBOARD} replace />;
  }

  if (captain?.has_team) {
    return <Navigate to={ROUTES.CABINET_DASHBOARD} replace />;
  }

  if (event && !event.registration_open) {
    return <Navigate to={pathTo(ROUTES.EVENT, { slug })} replace />;
  }

  const onSubmit = inviteForm.handleSubmit(async ({ code }) => {
    const team = teamForm.getValues();
    if (!trackId) {
      toast.error("Выберите кейс");
      return;
    }

    const teamValidation = teamSchema.safeParse(team);
    if (!teamValidation.success) {
      toast.error("Укажите название команды");
      return;
    }

    try {
      const registerRes = await registerMutation.mutateAsync({
        params: { path: { event_slug: slug } },
        body: {
          team_name: teamValidation.data.team_name,
          track_id: trackId,
          invite_code: code,
        },
      });

      setSuccess({
        login: registerRes.login,
        password: registerRes.password,
      });
      setStep(3);
      await queryClient.invalidateQueries(
        rqClient.queryOptions("get", "/captain/me"),
      );
    } catch {
      toast.error("Не удалось зарегистрировать команду. Проверьте инвайт-код (демо: DEMO2026).");
    }
  });

  const onTeamNext = teamForm.handleSubmit(() => {
    setStep(2);
  });

  const tracks = event?.tracks.filter((t) => t.seats_available > 0) ?? [];

  return (
    <div className="max-w-lg">
      <PageHeader
        title="Регистрация команды"
        description={
          captain
            ? `Капитан: ${captain.full_name} (${captain.email})`
            : "Загрузка профиля…"
        }
      />
      <Stepper steps={STEPS} currentStep={step} className="mb-8" />

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium">Кейс / направление</label>
          <Select
            value={trackId ? String(trackId) : ""}
            onValueChange={(v) => setTrackId(Number(v))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Выберите кейс" />
            </SelectTrigger>
            <SelectContent>
              {tracks.map((track) => (
                <SelectItem key={track.id} value={String(track.id)}>
                  {track.title} (свободно: {track.seats_available})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {tracks.length === 0 && (
            <p className="text-muted-foreground text-sm">Нет свободных кейсов</p>
          )}
          <div className="flex gap-2">
            <Button onClick={() => setStep(1)} disabled={!trackId}>
              Далее
            </Button>
          </div>
        </div>
      )}

      {step === 1 && (
        <Form {...teamForm}>
          <form onSubmit={onTeamNext} className="flex flex-col gap-4">
            <FormField
              control={teamForm.control}
              name="team_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название команды</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">Демо-код: DEMO2026</p>
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
                disabled={registerMutation.isPending}
              >
                Назад
              </Button>
              <Button type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Регистрация..." : "Зарегистрировать"}
              </Button>
            </div>
          </form>
        </Form>
      )}

      <Button asChild variant="link" className="mt-6 px-0">
        <Link to={pathTo(ROUTES.EVENT, { slug })}>← К мероприятию</Link>
      </Button>
    </div>
  );
}

export const Component = EventRegisterPage;
