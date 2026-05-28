import "react-router-dom";
import type { UserRole } from "./session.ts";

export const ROUTES = {
  HOME: "/",
  EVENT: "/events/:slug",
  EVENT_REGISTER: "/events/:slug/register",
  EVENT_CASE: "/events/:slug/cases/:caseId",
  LOGIN: "/login",
  VERIFY_2FA: "/verify-2fa",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:token",
  REGISTER: "/register",
  CABINET_DASHBOARD: "/cabinet/dashboard",
  CABINET_EDIT: "/cabinet/edit",
  CABINET_CHANGE_CASE: "/cabinet/change-case",
  CABINET_HISTORY: "/cabinet/history",
  ADMIN: "/admin",
  ADMIN_EVENTS: "/admin/events",
  ADMIN_EVENT_NEW: "/admin/events/new",
  ADMIN_EVENT_EDIT: "/admin/events/:eventId/edit",
  ADMIN_EVENT_CASES: "/admin/events/:eventId/cases",
  ADMIN_EVENT_INVITES: "/admin/events/:eventId/invites",
  ADMIN_EVENT_TEAMS: "/admin/events/:eventId/teams",
  BOARDS: "/boards",
  FAVORITE_BOARDS: "/boards/favorite",
  RECENT_BOARDS: "/boards/recent",
  BOARD: "/boards/:boardId",
} as const;

export type PathParams = {
  [ROUTES.EVENT]: { slug: string };
  [ROUTES.EVENT_REGISTER]: { slug: string };
  [ROUTES.EVENT_CASE]: { slug: string; caseId: string };
  [ROUTES.RESET_PASSWORD]: { token: string };
  [ROUTES.ADMIN_EVENT_EDIT]: { eventId: string };
  [ROUTES.ADMIN_EVENT_CASES]: { eventId: string };
  [ROUTES.ADMIN_EVENT_INVITES]: { eventId: string };
  [ROUTES.ADMIN_EVENT_TEAMS]: { eventId: string };
  [ROUTES.BOARD]: { boardId: string };
};

declare module "react-router-dom" {
  interface Register {
    params: PathParams;
  }
}

export function pathTo(
  route: typeof ROUTES.EVENT,
  params: PathParams[typeof ROUTES.EVENT],
): string;
export function pathTo(
  route: typeof ROUTES.EVENT_REGISTER,
  params: PathParams[typeof ROUTES.EVENT_REGISTER],
): string;
export function pathTo(
  route: typeof ROUTES.EVENT_CASE,
  params: PathParams[typeof ROUTES.EVENT_CASE],
): string;
export function pathTo(
  route: typeof ROUTES.RESET_PASSWORD,
  params: PathParams[typeof ROUTES.RESET_PASSWORD],
): string;
export function pathTo(
  route: typeof ROUTES.ADMIN_EVENT_EDIT,
  params: PathParams[typeof ROUTES.ADMIN_EVENT_EDIT],
): string;
export function pathTo(
  route: typeof ROUTES.ADMIN_EVENT_CASES,
  params: PathParams[typeof ROUTES.ADMIN_EVENT_CASES],
): string;
export function pathTo(
  route: typeof ROUTES.ADMIN_EVENT_INVITES,
  params: PathParams[typeof ROUTES.ADMIN_EVENT_INVITES],
): string;
export function pathTo(
  route: typeof ROUTES.ADMIN_EVENT_TEAMS,
  params: PathParams[typeof ROUTES.ADMIN_EVENT_TEAMS],
): string;
export function pathTo(
  route: typeof ROUTES.BOARD,
  params: PathParams[typeof ROUTES.BOARD],
): string;
export function pathTo(route: string, params?: Record<string, string>): string;
export function pathTo(route: string, params: Record<string, string> = {}) {
  return Object.entries(params).reduce(
    (acc, [key, value]) => acc.replace(`:${key}`, value),
    route,
  );
}

export function getCabinetHomeRoute(role?: UserRole) {
  if (role === "team") return ROUTES.CABINET_DASHBOARD;
  return ROUTES.HOME;
}
