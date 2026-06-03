import { rqClient } from "@/shared/api/instance";
import { CabinetPageHeader } from "@/features/cabinet/ui/cabinet-page-header.tsx";
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
import { PhoneInput } from "@/shared/ui/kit/phone-input";
import { formatRuPhoneInput, isValidRuPhone, normalizeRuPhone, RU_PHONE_ERROR } from "@/shared/lib/phone";
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  team_name: z.string().min(2),
  captain_full_name: z.string().min(2),
  email: z.string().email(),
  phone: z
    .string()
    .min(10, RU_PHONE_ERROR)
    .refine(isValidRuPhone, RU_PHONE_ERROR),
});

function CabinetEditPage() {
  const navigate = useNavigate();
  const { data: team, isPending } = rqClient.useQuery("get", "/team/me");
  const form = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (team) {
      form.reset({
        team_name: team.team_name,
        captain_full_name: team.captain_full_name,
        email: team.email,
        phone: formatRuPhoneInput(team.phone),
      });
    }
  }, [team, form]);

  const mutation = rqClient.useMutation("patch", "/team/me", {
    onSuccess() {
      toast.success("Данные сохранены");
      navigate(ROUTES.CABINET_DASHBOARD);
    },
  });

  if (isPending) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  if (team && !team.can_manage) {
    return (
      <div>
        <CabinetPageHeader
          title="Личная информация"
          description="Редактирование недоступно"
        />
        <p className="text-muted-foreground mb-4 text-sm">
          {!team.can_edit
            ? "Регистрация на мероприятие закрыта — данные команды нельзя изменить."
            : "Редактирование доступно только капитану команды."}
        </p>
        <Button asChild variant="outline">
          <Link to={ROUTES.CABINET_DASHBOARD}>← К команде</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <CabinetPageHeader
        title="Личная информация"
        description="Данные капитана и команды"
      />
      <div className="border-border bg-card rounded-2xl border p-6 shadow-sm dark:bg-card/50 dark:shadow-none">
        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((body) =>
              mutation.mutate({
                body: { ...body, phone: normalizeRuPhone(body.phone) },
              }),
            )}
          >
            {(
              [
                ["team_name", "Название команды"],
                ["captain_full_name", "ФИО капитана"],
                ["email", "Email"],
                ["phone", "Телефон"],
              ] as const
            ).map(([name, label]) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <FormControl>
                      {name === "phone" ? (
                        <PhoneInput
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      ) : (
                        <Input {...field} />
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <Button type="submit" disabled={mutation.isPending} className="mt-2">
              Сохранить
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export const Component = CabinetEditPage;
