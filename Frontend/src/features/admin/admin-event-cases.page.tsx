import { rqClient } from "@/shared/api/instance";
import { formatKeywords, parseKeywords } from "@/shared/lib/keywords.ts";
import { ROUTES, pathTo } from "@/shared/model/routes";
import { PageHeader } from "@/shared/ui/layout/page-header.tsx";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const textareaClassName =
  "border-input bg-background focus-visible:border-ring focus-visible:ring-ring/30 w-full min-w-0 rounded-xl border px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] md:text-sm";

function AdminEventCasesPage() {
  const { eventId } = useParams();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [description, setDescription] = useState("");
  const [limit, setLimit] = useState("10");
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingKeywords, setEditingKeywords] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingLimit, setEditingLimit] = useState("10");

  const { data, isPending } = rqClient.useQuery(
    "get",
    "/admin/events/{eventId}/cases",
    { params: { path: { eventId: eventId! } } },
    { enabled: Boolean(eventId) },
  );

  const createMutation = rqClient.useMutation(
    "post",
    "/admin/events/{eventId}/cases",
    {
      onSuccess: async () => {
        toast.success("Кейс добавлен");
        setName("");
        setKeywords("");
        setDescription("");
        setLimit("10");
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/admin/events/{eventId}/cases", {
            params: { path: { eventId: eventId! } },
          }),
        );
      },
    },
  );

  const deleteMutation = rqClient.useMutation(
    "delete",
    "/admin/events/{eventId}/cases/{caseId}",
    {
      onSuccess: async () => {
        toast.success("Удалено");
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/admin/events/{eventId}/cases", {
            params: { path: { eventId: eventId! } },
          }),
        );
      },
    },
  );

  const updateMutation = rqClient.useMutation(
    "put",
    "/admin/events/{eventId}/cases/{caseId}",
    {
      onSuccess: async () => {
        toast.success("Кейс обновлён");
        setEditingCaseId(null);
        await queryClient.invalidateQueries(
          rqClient.queryOptions("get", "/admin/events/{eventId}/cases", {
            params: { path: { eventId: eventId! } },
          }),
        );
      },
    },
  );

  if (!eventId) return null;

  const cases = data?.cases ?? [];

  const submitCase = () => {
    if (!name.trim() || !description.trim() || !keywords.trim()) {
      toast.error("Заполните название, ключевые слова и описание");
      return;
    }

    createMutation.mutate({
      params: { path: { eventId } },
      body: {
        name: name.trim(),
        keywords: formatKeywords(parseKeywords(keywords)),
        description: description.trim(),
        limit: Number(limit),
      },
    });
  };

  const startEdit = (c: (typeof cases)[number]) => {
    setEditingCaseId(c.id);
    setEditingName(c.name);
    setEditingKeywords(c.keywords ?? "");
    setEditingDescription(c.description ?? "");
    setEditingLimit(String(c.limit));
  };

  const submitEdit = () => {
    if (!editingCaseId) return;
    if (!editingName.trim() || !editingDescription.trim() || !editingKeywords.trim()) {
      toast.error("Заполните название, ключевые слова и описание");
      return;
    }

    updateMutation.mutate({
      params: { path: { eventId, caseId: editingCaseId } },
      body: {
        name: editingName.trim(),
        keywords: formatKeywords(parseKeywords(editingKeywords)),
        description: editingDescription.trim(),
        limit: Number(editingLimit),
      },
    });
  };

  return (
    <div>
      <PageHeader
        title="Кейсы мероприятия"
        description="Направления и лимиты команд"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={pathTo(ROUTES.ADMIN_EVENT_EDIT, { eventId })}>← Мероприятие</Link>
          </Button>
        }
      />

      <div className="border-border bg-card mb-8 max-w-lg space-y-3 rounded-2xl border p-4">
        <h2 className="text-base font-semibold">Новый кейс</h2>
        <div>
          <Label>Название</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Ключевые слова</Label>
          <Input
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Vue, Python, MongoDB"
          />
        </div>
        <div>
          <Label>Описание</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={textareaClassName}
          />
        </div>
        <div>
          <Label>Лимит команд</Label>
          <Input
            type="number"
            min={1}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
          />
        </div>
        <Button onClick={submitCase}>Добавить кейс</Button>
      </div>

      {editingCaseId ? (
        <div className="border-border bg-card mb-8 max-w-lg space-y-3 rounded-2xl border p-4">
          <h2 className="text-base font-semibold">Редактирование кейса</h2>
          <div>
            <Label>Название</Label>
            <Input value={editingName} onChange={(e) => setEditingName(e.target.value)} />
          </div>
          <div>
            <Label>Ключевые слова</Label>
            <Input
              value={editingKeywords}
              onChange={(e) => setEditingKeywords(e.target.value)}
            />
          </div>
          <div>
            <Label>Описание</Label>
            <textarea
              value={editingDescription}
              onChange={(e) => setEditingDescription(e.target.value)}
              rows={4}
              className={textareaClassName}
            />
          </div>
          <div>
            <Label>Лимит команд</Label>
            <Input
              type="number"
              min={1}
              value={editingLimit}
              onChange={(e) => setEditingLimit(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={submitEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Сохранение..." : "Сохранить изменения"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditingCaseId(null)}
              disabled={updateMutation.isPending}
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : null}

      {isPending ? (
        <p>Загрузка…</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Кейс</th>
              <th className="px-3 py-2 text-left">Ключевые слова</th>
              <th className="px-3 py-2 text-left">Лимит</th>
              <th className="px-3 py-2 text-left">Занято</th>
              <th className="px-3 py-2 text-left">%</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cases.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="px-3 py-2">
                  <div className="font-medium">{c.name}</div>
                  {c.description ? (
                    <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                      {c.description}
                    </p>
                  ) : null}
                </td>
                <td className="text-muted-foreground px-3 py-2 text-xs">
                  {c.keywords ?? "—"}
                </td>
                <td className="px-3 py-2">{c.limit}</td>
                <td className="px-3 py-2">{c.occupied}</td>
                <td className="px-3 py-2">{c.fillPercent}%</td>
                <td className="px-3 py-2 text-right">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(c)}>
                    Изменить
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      deleteMutation.mutate({
                        params: { path: { eventId, caseId: c.id } },
                      })
                    }
                  >
                    Удалить
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export const Component = AdminEventCasesPage;
