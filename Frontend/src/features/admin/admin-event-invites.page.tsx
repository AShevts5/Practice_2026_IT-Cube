import { rqClient } from "@/shared/api/instance";
import { ROUTES, pathTo } from "@/shared/model/routes";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/kit/select";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

function AdminEventInvitesPage() {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [manualCode, setManualCode] = useState("");
  const [expiresAt, setExpiresAt] = useState("2026-12-31T23:59");
  const [genCount, setGenCount] = useState("5");

  const queryStatus =
    statusFilter === "all" ? undefined : (statusFilter as "active" | "used" | "expired");

  const { data, isPending } = rqClient.useQuery(
    "get",
    "/admin/events/{eventId}/invite-codes",
    {
      params: {
        path: { eventId: eventId! },
        query: queryStatus ? { status: queryStatus } : undefined,
      },
    },
    { enabled: Boolean(eventId) },
  );

  const invalidate = () =>
    queryClient.invalidateQueries(
      rqClient.queryOptions("get", "/admin/events/{eventId}/invite-codes", {
        params: { path: { eventId: eventId! } },
      }),
    );

  const generateMutation = rqClient.useMutation(
    "post",
    "/admin/events/{eventId}/invite-codes/generate",
    {
      onSuccess: async () => {
        toast.success("Коды сгенерированы");
        await invalidate();
      },
    },
  );

  const createMutation = rqClient.useMutation(
    "post",
    "/admin/events/{eventId}/invite-codes",
    {
      onSuccess: async () => {
        toast.success("Код добавлен");
        setManualCode("");
        await invalidate();
      },
    },
  );

  const deleteMutation = rqClient.useMutation(
    "delete",
    "/admin/events/{eventId}/invite-codes/{codeId}",
    {
      onSuccess: async () => {
        toast.success("Код отозван");
        await invalidate();
      },
    },
  );

  if (!eventId) return null;

  const codes = data?.codes ?? [];

  return (
    <div>
      <PageHeader
        title="Инвайт-коды"
        description="Генерация и управление кодами регистрации"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId })}>← Мероприятие</Link>
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <div className="border-border rounded-2xl border p-4 space-y-3">
          <p className="font-medium">Сгенерировать</p>
          <div>
            <Label>Количество</Label>
            <Input
              type="number"
              value={genCount}
              onChange={(e) => setGenCount(e.target.value)}
            />
          </div>
          <div>
            <Label>Действует до</Label>
            <Input
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>
          <Button
            onClick={() =>
              generateMutation.mutate({
                params: { path: { eventId } },
                body: {
                  count: Number(genCount),
                  expiresAt: new Date(expiresAt).toISOString(),
                },
              })
            }
          >
            Сгенерировать
          </Button>
        </div>
        <div className="border-border rounded-2xl border p-4 space-y-3">
          <p className="font-medium">Добавить вручную</p>
          <div>
            <Label>Код</Label>
            <Input value={manualCode} onChange={(e) => setManualCode(e.target.value)} />
          </div>
          <Button
            onClick={() =>
              createMutation.mutate({
                params: { path: { eventId } },
                body: {
                  code: manualCode,
                  expiresAt: new Date(expiresAt).toISOString(),
                },
              })
            }
          >
            Добавить
          </Button>
        </div>
      </div>

      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="mb-4 w-48">
          <SelectValue placeholder="Статус" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все</SelectItem>
          <SelectItem value="active">Активные</SelectItem>
          <SelectItem value="used">Использованные</SelectItem>
          <SelectItem value="expired">Просроченные</SelectItem>
        </SelectContent>
      </Select>

      {isPending ? (
        <p>Загрузка…</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Код</th>
              <th className="px-3 py-2 text-left">Статус</th>
              <th className="px-3 py-2 text-left">До</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {codes.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2 font-mono">{c.code}</td>
                <td className="px-3 py-2">{c.status}</td>
                <td className="px-3 py-2">
                  {new Date(c.expiresAt).toLocaleDateString("ru-RU")}
                </td>
                <td className="px-3 py-2 text-right">
                  {c.status === "active" ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        deleteMutation.mutate({
                          params: { path: { eventId, codeId: c.id } },
                        })
                      }
                    >
                      Отозвать
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export const Component = AdminEventInvitesPage;
