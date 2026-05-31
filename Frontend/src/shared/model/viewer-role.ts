import type { Session, UserRole } from "./session.ts";

export type ViewerRole = "guest" | UserRole;

export const VIEWER_ROLE_LABELS: Record<ViewerRole, string> = {
  guest: "Гость",
  captain: "Капитан",
  team: "Команда",
  admin: "Администратор",
};

export function getViewerRole(
  isAuthenticated: boolean,
  session: Session | null,
): ViewerRole {
  if (!isAuthenticated || !session) {
    return "guest";
  }
  return session.role;
}

export function isCaptain(viewerRole: ViewerRole): boolean {
  return viewerRole === "captain";
}

export function isTeamMember(viewerRole: ViewerRole): boolean {
  return viewerRole === "team";
}

export function hasTeamCabinetAccess(
  viewerRole: ViewerRole,
  captainHasTeam?: boolean,
): boolean {
  return isTeamMember(viewerRole) || (isCaptain(viewerRole) && Boolean(captainHasTeam));
}

export function isGuest(viewerRole: ViewerRole): boolean {
  return viewerRole === "guest";
}
