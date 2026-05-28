import type { ApiSchemas } from "../../schema/index.ts";
import { HttpResponse } from "msw";
import { http } from "../http.ts";
import { verifyAdminOrThrow } from "../session.ts";
import { slugifyTitle } from "@/shared/lib/keywords.ts";
import {
  getEventById,
  mockCasesByEvent,
  mockEvents,
  mockInviteCodes,
  mockTeamsByEvent,
  recalcEventFreeSpots,
} from "../db.ts";

function adminTeamDto(team: (typeof mockTeamsByEvent)[string][0]): ApiSchemas["AdminTeam"] {
  return {
    id: team.id,
    name: team.name,
    captainName: team.captainName,
    email: team.email,
    phone: team.phone,
    caseName: team.caseName,
    registeredAt: team.registeredAt,
    applicationStatus: team.applicationStatus,
  };
}

function caseWithStats(_eventId: string, c: ApiSchemas["Case"]) {
  return {
    ...c,
    fillPercent: c.limit > 0 ? Math.round((c.occupied / c.limit) * 100) : 0,
  };
}

function isValidIsoDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const year = date.getUTCFullYear();
  return year >= 1000 && year <= 9999;
}

export const adminHandlers = [
  http.get("/admin/stats", async ({ request, response }) => {
    await verifyAdminOrThrow(request);
    const teamsCount = Object.values(mockTeamsByEvent).flat().length;
    const freeSpotsTotal = mockEvents.reduce((s, e) => s + e.freeSpotsTotal, 0);
    return response(200).json({
      eventsCount: mockEvents.length,
      teamsCount,
      freeSpotsTotal,
    });
  }),

  http.get("/admin/events", async ({ request, response }) => {
    await verifyAdminOrThrow(request);
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    let events = mockEvents.map((e) => ({
      ...e,
      teamsCount: (mockTeamsByEvent[e.id] ?? []).length,
    }));
    if (status) {
      events = events.filter((e) => e.status === status);
    }
    return response(200).json({
      events,
      total: events.length,
      totalPages: 1,
    });
  }),

  http.post("/admin/events", async ({ request, response }) => {
    await verifyAdminOrThrow(request);
    const body = await request.json();
    if (!isValidIsoDate(body.startsAt) || !isValidIsoDate(body.endsAt)) {
      return HttpResponse.json(
        { message: "Некорректный формат даты", code: "INVALID_DATE" },
        { status: 400 },
      );
    }

    const created = {
      id: String(Date.now()),
      title: body.title,
      slug: body.slug ?? slugifyTitle(body.title),
      keywords: body.keywords,
      description: body.description,
      status: body.status as ApiSchemas["Event"]["status"],
      registrationOpen: body.registrationOpen ?? false,
      freeSpotsTotal: 0,
      startsAt: body.startsAt,
      endsAt: body.endsAt,
      teamsCount: 0,
    };
    mockEvents.push(created);
    mockCasesByEvent[created.id] = [];
    mockTeamsByEvent[created.id] = [];
    return response(201).json(created);
  }),

  http.put("/admin/events/{eventId}", async ({ params, request, response }) => {
    await verifyAdminOrThrow(request);
    const event = getEventById(params.eventId);
    if (!event) {
      return HttpResponse.json(
        { message: "Не найдено", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    const body = await request.json();
    if (
      (body.startsAt !== undefined && !isValidIsoDate(body.startsAt)) ||
      (body.endsAt !== undefined && !isValidIsoDate(body.endsAt))
    ) {
      return HttpResponse.json(
        { message: "Некорректный формат даты", code: "INVALID_DATE" },
        { status: 400 },
      );
    }

    Object.assign(event, body);
    if (event.status === "completed") {
      event.registrationOpen = false;
    }
    return response(200).json({
      ...event,
      teamsCount: (mockTeamsByEvent[event.id] ?? []).length,
    });
  }),

  http.delete("/admin/events/{eventId}", async ({ params, request, response }) => {
    await verifyAdminOrThrow(request);
    const teams = mockTeamsByEvent[params.eventId] ?? [];
    if (teams.length > 0) {
      return response(400).json({
        message: "Нельзя удалить: есть зарегистрированные команды",
        code: "HAS_TEAMS",
      });
    }
    const idx = mockEvents.findIndex((e) => e.id === params.eventId);
    if (idx >= 0) {
      mockEvents.splice(idx, 1);
      delete mockCasesByEvent[params.eventId];
      delete mockTeamsByEvent[params.eventId];
    }
    return response(204).empty();
  }),

  http.get("/admin/events/{eventId}/cases", async ({ params, request, response }) => {
    await verifyAdminOrThrow(request);
    const cases = (mockCasesByEvent[params.eventId] ?? []).map((c) =>
      caseWithStats(params.eventId, c),
    );
    return response(200).json({ cases });
  }),

  http.post("/admin/events/{eventId}/cases", async ({ params, request, response }) => {
    await verifyAdminOrThrow(request);
    const body = await request.json();
    const cases = mockCasesByEvent[params.eventId] ?? [];
    const created: ApiSchemas["Case"] = {
      id: `c${Date.now()}`,
      name: body.name,
      keywords: body.keywords,
      description: body.description,
      limit: body.limit,
      occupied: 0,
      free: body.limit,
    };
    cases.push(created);
    mockCasesByEvent[params.eventId] = cases;
    recalcEventFreeSpots(params.eventId);
    return response(201).json(caseWithStats(params.eventId, created));
  }),

  http.put(
    "/admin/events/{eventId}/cases/{caseId}",
    async ({ params, request, response }) => {
      await verifyAdminOrThrow(request);
      const cases = mockCasesByEvent[params.eventId] ?? [];
      const c = cases.find((x) => x.id === params.caseId);
      if (!c) {
        return HttpResponse.json(
          { message: "Не найдено", code: "NOT_FOUND" },
          { status: 404 },
        );
      }
      const body = await request.json();
      if (body.limit !== undefined && body.limit < c.occupied) {
        return response(400).json({
          message: "Лимит меньше занятых мест",
          code: "LIMIT_TOO_LOW",
        });
      }
      if (body.name) c.name = body.name;
      if (body.keywords !== undefined) c.keywords = body.keywords;
      if (body.description !== undefined) c.description = body.description;
      if (body.limit !== undefined) {
        c.limit = body.limit;
        c.free = body.limit - c.occupied;
      }
      recalcEventFreeSpots(params.eventId);
      return response(200).json(caseWithStats(params.eventId, c));
    },
  ),

  http.delete(
    "/admin/events/{eventId}/cases/{caseId}",
    async ({ params, request, response }) => {
      await verifyAdminOrThrow(request);
      const cases = mockCasesByEvent[params.eventId] ?? [];
      const c = cases.find((x) => x.id === params.caseId);
      if (!c) {
        return HttpResponse.json(
          { message: "Не найдено", code: "NOT_FOUND" },
          { status: 404 },
        );
      }
      if (c.occupied > 0) {
        return response(400).json({
          message: "Есть заявки на кейс",
          code: "CASE_HAS_TEAMS",
        });
      }
      mockCasesByEvent[params.eventId] = cases.filter((x) => x.id !== params.caseId);
      recalcEventFreeSpots(params.eventId);
      return response(204).empty();
    },
  ),

  http.get(
    "/admin/events/{eventId}/invite-codes",
    async ({ params, request, response }) => {
      await verifyAdminOrThrow(request);
      const url = new URL(request.url);
      const status = url.searchParams.get("status");
      let codes = mockInviteCodes
        .filter((c) => c.eventId === params.eventId)
        .map((c) => ({
          id: c.id,
          code: c.code,
          status: c.status,
          expiresAt: c.expiresAt,
          usedAt: c.usedAt,
        }));
      if (status) {
        codes = codes.filter((c) => c.status === status);
      }
      return response(200).json({ codes });
    },
  ),

  http.post(
    "/admin/events/{eventId}/invite-codes/generate",
    async ({ params, request, response }) => {
      await verifyAdminOrThrow(request);
      const body = await request.json();
      const generated = [];
      for (let i = 0; i < body.count; i++) {
        const code = `GEN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
        const item = {
          id: `inv${Date.now()}${i}`,
          eventId: params.eventId,
          code,
          status: "active" as const,
          expiresAt: body.expiresAt,
        };
        mockInviteCodes.push(item);
        generated.push({
          id: item.id,
          code: item.code,
          status: item.status,
          expiresAt: item.expiresAt,
        });
      }
      return response(201).json({ codes: generated });
    },
  ),

  http.post(
    "/admin/events/{eventId}/invite-codes",
    async ({ params, request, response }) => {
      await verifyAdminOrThrow(request);
      const body = await request.json();
      const item = {
        id: `inv${Date.now()}`,
        eventId: params.eventId,
        code: body.code,
        status: "active" as const,
        expiresAt: body.expiresAt,
      };
      mockInviteCodes.push(item);
      return response(201).json({
        id: item.id,
        code: item.code,
        status: item.status,
        expiresAt: item.expiresAt,
      });
    },
  ),

  http.delete(
    "/admin/events/{eventId}/invite-codes/{codeId}",
    async ({ params, request, response }) => {
      await verifyAdminOrThrow(request);
      const idx = mockInviteCodes.findIndex(
        (c) => c.id === params.codeId && c.eventId === params.eventId,
      );
      if (idx < 0) {
        return HttpResponse.json(
          { message: "Не найдено", code: "NOT_FOUND" },
          { status: 404 },
        );
      }
      if (mockInviteCodes[idx].status === "used") {
        return response(400).json({
          message: "Код уже использован",
          code: "CODE_USED",
        });
      }
      mockInviteCodes.splice(idx, 1);
      return response(204).empty();
    },
  ),

  http.get("/admin/events/{eventId}/teams", async ({ params, request, response }) => {
    await verifyAdminOrThrow(request);
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();
    const caseName = url.searchParams.get("caseName");
    let teams = (mockTeamsByEvent[params.eventId] ?? []).map(adminTeamDto);
    if (search) {
      teams = teams.filter(
        (t) =>
          t.name.toLowerCase().includes(search) ||
          t.email.toLowerCase().includes(search) ||
          t.captainName.toLowerCase().includes(search),
      );
    }
    if (caseName) {
      teams = teams.filter((t) => t.caseName === caseName);
    }
    return response(200).json({ teams });
  }),

  http.get(
    "/admin/events/{eventId}/teams/export",
    async ({ params, request }) => {
      await verifyAdminOrThrow(request);
      const teams = mockTeamsByEvent[params.eventId] ?? [];
      const header =
        "id,name,captain,email,phone,case,registeredAt,status\n";
      const rows = teams
        .map(
          (t) =>
            `${t.id},"${t.name}","${t.captainName}",${t.email},${t.phone},${t.caseName},${t.registeredAt},${t.applicationStatus}`,
        )
        .join("\n");
      return HttpResponse.text(header + rows, {
        headers: { "Content-Type": "text/csv; charset=utf-8" },
      });
    },
  ),
];
