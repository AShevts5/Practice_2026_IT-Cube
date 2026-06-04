import { rqClient } from "@/shared/api/instance";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

export function EventInvitesPanel({ eventId }: { eventId: number }) {
  const queryClient = useQueryClient();
  const [manualCode, setManualCode] = useState("");
  const [genCount, setGenCount] = useState("5");
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);

  const { data: invites, isPending } = rqClient.useQuery(
    "get",
    "/admin/invites/events/{event_id}",
    { params: { path: { event_id: eventId } } },
  );

  const invalidate = () =>
    queryClient.invalidateQueries(
      rqClient.queryOptions("get", "/admin/invites/events/{event_id}", {
        params: { path: { event_id: eventId } },
      }),
    );

  const generateMutation = rqClient.useMutation(
    "post",
    "/admin/invites/events/{event_id}/generate",
    {
      onSuccess: async (data) => {
        setGeneratedCodes(data.map((item) => item.code));
        toast.success("Коды сгенерированы — сохраните их");
        await invalidate();
      },
      onError: () => toast.error("Не удалось сгенерировать коды"),
    },
  );

  const createMutation = rqClient.useMutation(
    "post",
    "/admin/invites/events/{event_id}",
    {
      onSuccess: async (data) => {
        setGeneratedCodes([data.code]);
        toast.success("Инвайт-код добавлен");
        setManualCode("");
        await invalidate();
      },
      onError: () => toast.error("Не удалось добавить код"),
    },
  );

  const handleGenerate = () => {
    const count = Number(genCount);
    if (!Number.isFinite(count) || count < 1) {
      toast.error("Укажите количество от 1");
      return;
    }
    generateMutation.mutate({
      params: { path: { event_id: eventId } },
      body: { count },
    });
  };

  const handleCreate = () => {
    const code = manualCode.trim();
    if (code.length < 4) {
      toast.error("Код должен быть не короче 4 символов");
      return;
    }
    createMutation.mutate({
      params: { path: { event_id: eventId } },
      body: { code: code.toUpperCase() },
    });
  };

  return (
    <div className="border-border min-w-0 space-y-4 rounded-2xl border p-4">
      <p className="font-medium">Инвайт-коды</p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <Label>Количество для генерации</Label>
          <Input
            type="number"
            min={1}
            max={500}
            value={genCount}
            onChange={(e) => setGenCount(e.target.value)}
          />
          <Button
            type="button"
            disabled={generateMutation.isPending}
            onClick={handleGenerate}
          >
            {generateMutation.isPending ? "Генерация…" : "Сгенерировать"}
          </Button>
        </div>
        <div className="space-y-3">
          <Label>Добавить вручную</Label>
          <Input
            value={manualCode}
            placeholder="Например, HACK2026"
            onChange={(e) => setManualCode(e.target.value.toUpperCase())}
          />
          <Button
            type="button"
            disabled={createMutation.isPending || manualCode.trim().length < 4}
            onClick={handleCreate}
          >
            {createMutation.isPending ? "Добавление…" : "Добавить код"}
          </Button>
        </div>
      </div>

      {generatedCodes.length > 0 ? (
        <div className="bg-muted/40 overflow-x-auto rounded-xl p-3">
          <p className="mb-2 text-sm font-medium">Новые коды (сохраните):</p>
          <ul className="font-mono text-sm whitespace-nowrap">
            {generatedCodes.map((code) => (
              <li key={code}>{code}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {isPending ? (
        <p className="text-muted-foreground text-sm">Загрузка списка…</p>
      ) : (
        <div className="-mx-1 overflow-x-auto rounded-xl border sm:mx-0">
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left whitespace-nowrap">ID</th>
                <th className="px-3 py-2 text-left whitespace-nowrap">Инвайт-код</th>
                <th className="px-3 py-2 text-left whitespace-nowrap">Использован</th>
                <th className="px-3 py-2 text-left whitespace-nowrap">Создан</th>
              </tr>
            </thead>
            <tbody>
              {(invites ?? []).map((invite) => (
                <tr key={invite.id} className="border-t">
                  <td className="px-3 py-2 whitespace-nowrap">{invite.id}</td>
                  <td className="px-3 py-2 font-mono whitespace-nowrap">
                    {invite.code ?? "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {invite.is_used ? "Да" : "Нет"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(invite.created_at).toLocaleDateString("ru-RU")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
