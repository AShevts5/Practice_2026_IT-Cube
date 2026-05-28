import type { ApiSchemas } from "../../schema/index.ts";
import { HttpResponse } from "msw";
import { http } from "../http.ts";
import { verifyTokenOrThrow } from "../session.ts";
import {
  addHistory,
  captainTeam,
  isEventEditable,
  mockEvents,
  mockCasesByEvent,
  mockHistory,
  mockTeamsByEvent,
  recalcEventFreeSpots,
} from "../db.ts";
import { userTeamIds } from "./auth.ts";

function toTeamResponse(team: typeof captainTeam): ApiSchemas["Team"] {
  return {
    id: team.id,
    name: team.name,
    captainName: team.captainName,
    email: team.email,
    phone: team.phone,
    eventId: team.eventId,
    caseName: team.caseName,
    eventTitle: team.eventTitle,
    registeredAt: team.registeredAt,
    applicationStatus: team.applicationStatus,
    canEdit: isEventEditable(team.eventId),
  };
}

function getTeamForSession(session: {
  userId: string;
  email: string;
  role: string;
}) {
  if (session.role === "team" && session.email === captainTeam.email) {
    return captainTeam;
  }
  const teamId = userTeamIds[session.userId];
  if (teamId) {
    for (const teams of Object.values(mockTeamsByEvent)) {
      const found = teams.find((t) => t.id === teamId);
      if (found) return found;
    }
  }
  return null;
}

function assertCaptain(session: { role: string }) {
  if (session.role !== "team") {
    return false;
  }
  return true;
}

export const cabinetHandlers = [
  http.get("/cabinet/team", async ({ request, response }) => {
    const session = await verifyTokenOrThrow(request);
    const team = getTeamForSession(session);
    if (!team) {
      return HttpResponse.json(
        { message: "Команда не найдена", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    return response(200).json(toTeamResponse(team));
  }),

  http.put("/cabinet/team", async ({ request, response }) => {
    const session = await verifyTokenOrThrow(request);
    if (!assertCaptain(session)) {
      return response(403).json({
        message: "Только капитан может редактировать",
        code: "FORBIDDEN",
      });
    }
    const team = getTeamForSession(session);
    if (!team || !isEventEditable(team.eventId)) {
      return response(403).json({
        message: "Редактирование недоступно",
        code: "EVENT_COMPLETED",
      });
    }

    const body = await request.json();
    const eventTeams = mockTeamsByEvent[team.eventId] ?? [];

    if (body.email && body.email !== team.email) {
      const taken = eventTeams.some(
        (t) => t.id !== team.id && t.email === body.email,
      );
      if (taken) {
        return response(409).json({
          message: "Email уже используется",
          code: "EMAIL_TAKEN",
        });
      }
    }
    if (body.phone && body.phone !== team.phone) {
      const taken = eventTeams.some(
        (t) => t.id !== team.id && t.phone === body.phone,
      );
      if (taken) {
        return response(409).json({
          message: "Телефон уже используется",
          code: "PHONE_TAKEN",
        });
      }
    }

    Object.assign(team, body);
    if (team.id === captainTeam.id) {
      Object.assign(captainTeam, team);
    }
    addHistory(team.id, "team_updated", "Обновлены данные команды");

    return response(200).json(toTeamResponse(team));
  }),

  http.get("/cabinet/available-cases", async ({ request, response }) => {
    const session = await verifyTokenOrThrow(request);
    if (!assertCaptain(session)) {
      return response(403).json({
        message: "Только капитан",
        code: "FORBIDDEN",
      });
    }
    const team = getTeamForSession(session);
    if (!team) {
      return HttpResponse.json(
        { message: "Не найдено", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    const cases = (mockCasesByEvent[team.eventId] ?? []).filter(
      (c) => c.free > 0 || c.id === team.caseId,
    );
    return response(200).json({ cases });
  }),

  http.get("/cabinet/available-events", async ({ request, response }) => {
    const session = await verifyTokenOrThrow(request);
    if (!assertCaptain(session)) {
      return response(403).json({
        message: "Только капитан",
        code: "FORBIDDEN",
      });
    }
    const events = mockEvents
      .filter((event) => event.status !== "completed")
      .map((event) => ({
        id: event.id,
        title: event.title,
        status: event.status,
        registrationOpen: Boolean(event.registrationOpen),
      }));
    return response(200).json({ events });
  }),

  http.post("/cabinet/change-case", async ({ request, response }) => {
    const session = await verifyTokenOrThrow(request);
    if (!assertCaptain(session)) {
      return response(403).json({
        message: "Только капитан",
        code: "FORBIDDEN",
      });
    }
    const team = getTeamForSession(session);
    if (!team || !isEventEditable(team.eventId)) {
      return response(403).json({
        message: "Смена кейса недоступна",
        code: "FORBIDDEN",
      });
    }

    const body = await request.json();
    const cases = mockCasesByEvent[team.eventId] ?? [];
    const next = cases.find((c) => c.id === body.caseId);
    const prev = cases.find((c) => c.id === team.caseId);

    if (!next || (next.free <= 0 && next.id !== team.caseId)) {
      return response(409).json({
        message: "Кейс недоступен",
        code: "CASE_FULL",
      });
    }

    if (prev && prev.id !== next.id) {
      prev.occupied = Math.max(0, prev.occupied - 1);
      prev.free += 1;
    }
    if (prev?.id !== next.id) {
      next.occupied += 1;
      next.free = Math.max(0, next.free - 1);
    }

    team.caseId = next.id;
    team.caseName = next.name;
    recalcEventFreeSpots(team.eventId);
    addHistory(team.id, "case_changed", `Кейс «${next.name}»`);

    return response(200).json(toTeamResponse(team));
  }),

  http.post("/cabinet/change-event", async ({ request, response }) => {
    const session = await verifyTokenOrThrow(request);
    if (!assertCaptain(session)) {
      return response(403).json({
        message: "Только капитан",
        code: "FORBIDDEN",
      });
    }
    const team = getTeamForSession(session);
    if (!team || !isEventEditable(team.eventId)) {
      return response(403).json({
        message: "Смена мероприятия недоступна",
        code: "FORBIDDEN",
      });
    }

    const body = await request.json();
    const nextEvent = mockEvents.find(
      (event) => event.id === body.eventId && event.status !== "completed",
    );
    if (!nextEvent) {
      return response(404).json({
        message: "Мероприятие недоступно",
        code: "NOT_FOUND",
      });
    }
    if (nextEvent.id === team.eventId) {
      return response(200).json(toTeamResponse(team));
    }

    const prevEventId = team.eventId;
    const prevCases = mockCasesByEvent[prevEventId] ?? [];
    const prevCase = prevCases.find((item) => item.id === team.caseId);
    if (prevCase) {
      prevCase.occupied = Math.max(0, prevCase.occupied - 1);
      prevCase.free += 1;
    }

    const nextCases = mockCasesByEvent[nextEvent.id] ?? [];
    const nextCase =
      nextCases.find((item) => item.free > 0) ??
      nextCases.find((item) => item.id === team.caseId);
    if (!nextCase) {
      return response(409).json({
        message: "В выбранном мероприятии нет доступных кейсов",
        code: "NO_AVAILABLE_CASES",
      });
    }
    nextCase.occupied += 1;
    nextCase.free = Math.max(0, nextCase.free - 1);

    const prevTeams = mockTeamsByEvent[prevEventId] ?? [];
    const prevIndex = prevTeams.findIndex((item) => item.id === team.id);
    if (prevIndex >= 0) {
      prevTeams.splice(prevIndex, 1);
    }
    if (!mockTeamsByEvent[nextEvent.id]) {
      mockTeamsByEvent[nextEvent.id] = [];
    }
    if (!mockTeamsByEvent[nextEvent.id].some((item) => item.id === team.id)) {
      mockTeamsByEvent[nextEvent.id].push(team);
    }

    team.eventId = nextEvent.id;
    team.eventTitle = nextEvent.title;
    team.slug = nextEvent.slug;
    team.caseId = nextCase.id;
    team.caseName = nextCase.name;

    recalcEventFreeSpots(prevEventId);
    recalcEventFreeSpots(nextEvent.id);
    addHistory(team.id, "event_changed", `Мероприятие «${nextEvent.title}»`);

    return response(200).json(toTeamResponse(team));
  }),

  http.get("/cabinet/history", async ({ request, response }) => {
    const session = await verifyTokenOrThrow(request);
    const team = getTeamForSession(session);
    if (!team) {
      return HttpResponse.json(
        { message: "Не найдено", code: "NOT_FOUND" },
        { status: 404 },
      );
    }
    const entries = mockHistory
      .filter((h) => h.teamId === team.id)
      .map((h) => ({
        id: h.id,
        action: h.action,
        createdAt: h.createdAt,
        details: h.details,
      }));
    return response(200).json({ entries });
  }),
];
