import { http } from "../http.ts";
import {
  addHistory,
  getEventBySlug,
  mockCasesByEvent,
  mockEvents,
  mockInviteCodes,
  mockTeamsByEvent,
  recalcEventFreeSpots,
} from "../db.ts";
import { mockUsers, userPasswords } from "./auth.ts";

export { mockCasesByEvent, mockEvents };

function findInvite(eventId: string, code: string) {
  const inv = mockInviteCodes.find(
    (i) =>
      i.eventId === eventId &&
      i.code === code &&
      i.status === "active" &&
      new Date(i.expiresAt) > new Date(),
  );
  return inv;
}

export const eventsHandlers = [
  http.get("/events", ({ request, response }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const publicOnly = url.searchParams.get("publicOnly") === "true";

    let events = [...mockEvents];
    if (publicOnly) {
      events = events.filter(
        (e) =>
          e.status === "active" &&
          e.registrationOpen &&
          e.freeSpotsTotal > 0,
      );
    } else if (status) {
      events = events.filter((e) => e.status === status);
    }

    return response(200).json({ events });
  }),

  http.get("/events/{slug}", ({ params, response }) => {
    const event = getEventBySlug(params.slug);
    if (!event) {
      return response(404).json({
        message: "Мероприятие не найдено",
        code: "NOT_FOUND",
      });
    }
    return response(200).json(event);
  }),

  http.get("/events/{slug}/cases", ({ params, request, response }) => {
    const event = getEventBySlug(params.slug);
    if (!event) {
      return response(404).json({
        message: "Мероприятие не найдено",
        code: "NOT_FOUND",
      });
    }
    const url = new URL(request.url);
    const availableOnly = url.searchParams.get("available") === "true";
    let cases = mockCasesByEvent[event.id] ?? [];
    if (availableOnly) {
      cases = cases.filter((c) => c.free > 0);
    }
    return response(200).json({ cases });
  }),

  http.post("/events/{slug}/verify-invite-code", async ({ params, request, response }) => {
    const event = getEventBySlug(params.slug);
    if (!event) {
      return response(400).json({ message: "Не найдено", code: "NOT_FOUND" });
    }
    const body = await request.json();
    const valid = Boolean(findInvite(event.id, body.code));
    return response(200).json({ valid });
  }),

  http.post("/events/{slug}/register", async ({ params, request, response }) => {
    const event = getEventBySlug(params.slug);
    if (!event) {
      return response(404).json({ message: "Не найдено", code: "NOT_FOUND" });
    }
    if (!event.registrationOpen || event.status !== "active") {
      return response(410).json({
        message: "Регистрация закрыта",
        code: "REGISTRATION_CLOSED",
      });
    }

    const body = await request.json();
    const invite = findInvite(event.id, body.inviteCode);
    if (!invite) {
      return response(400).json({
        message: "Неверный или просроченный инвайт-код",
        code: "INVALID_INVITE",
      });
    }

    const teams = mockTeamsByEvent[event.id] ?? [];
    if (teams.some((t) => t.email === body.email)) {
      return response(409).json({
        message: "Email уже зарегистрирован на этом мероприятии",
        code: "EMAIL_TAKEN",
      });
    }

    const cases = mockCasesByEvent[event.id] ?? [];
    const selected = cases.find((c) => c.id === body.caseId);
    if (!selected || selected.free <= 0) {
      return response(409).json({
        message: "Кейс недоступен",
        code: "CASE_FULL",
      });
    }

    selected.occupied += 1;
    selected.free -= 1;
    recalcEventFreeSpots(event.id);

    const password = "TempPass123!";
    const teamId = `t${Date.now()}`;
    const newTeam = {
      id: teamId,
      name: body.name,
      captainName: body.captainName,
      email: body.email,
      phone: body.phone,
      caseName: selected.name,
      eventTitle: event.title,
      eventId: event.id,
      caseId: selected.id,
      slug: event.slug,
      registeredAt: new Date().toISOString(),
      applicationStatus: "confirmed" as const,
    };

    if (!mockTeamsByEvent[event.id]) {
      mockTeamsByEvent[event.id] = [];
    }
    mockTeamsByEvent[event.id].push(newTeam);

    invite.status = "used";
    invite.usedAt = new Date().toISOString();
    invite.usedByTeamId = teamId;

    if (!mockUsers.some((u) => u.email === body.email)) {
      mockUsers.push({
        id: String(mockUsers.length + 1),
        email: body.email,
        role: "team",
      });
      userPasswords.set(body.email, password);
    }

    addHistory(teamId, "registration", `Регистрация на «${event.title}»`);

    return response(201).json({
      success: true,
      credentials: { login: body.email, password },
      emailSent: true,
    });
  }),
];
