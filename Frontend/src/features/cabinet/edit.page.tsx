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
import { Skeleton } from "@/shared/ui/kit/skeleton";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  captainName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
});

function CabinetEditPage() {
  const navigate = useNavigate();
  const { data: team, isPending } = rqClient.useQuery("get", "/cabinet/team");
  const form = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (team) {
      form.reset({
        name: team.name,
        captainName: team.captainName,
        email: team.email,
        phone: team.phone,
      });
    }
  }, [team, form]);

  const mutation = rqClient.useMutation("put", "/cabinet/team", {
    onSuccess() {
      toast.success("Данные сохранены");
      navigate(ROUTES.CABINET_DASHBOARD);
    },
  });

  if (isPending) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
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
            onSubmit={form.handleSubmit((body) => mutation.mutate({ body }))}
          >
            {(
              [
                ["name", "Название команды"],
                ["captainName", "ФИО капитана"],
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
                      <Input {...field} />
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
