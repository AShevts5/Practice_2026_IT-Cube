import { createGStore } from "create-gstore";
import { jwtDecode } from "jwt-decode";
import { useMemo, useState } from "react";
import { getViewerRole, type ViewerRole } from "./viewer-role.ts";

export type UserRole = "team" | "admin" | "captain";
export type AuthTarget = "team" | "admin" | "captain";

export type Session = {
  sub: string;
  role: UserRole;
  exp: number;
};

const TOKEN_KEY = "token";
const CHALLENGE_KEY = "otpChallenge";
const AUTH_TARGET_KEY = "authTarget";

type OtpChallenge = {
  challengeId: number;
  channel: string;
};

export const useSession = createGStore(() => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [otpChallenge, setOtpChallengeState] = useState<OtpChallenge | null>(() => {
    const raw = sessionStorage.getItem(CHALLENGE_KEY);
    return raw ? (JSON.parse(raw) as OtpChallenge) : null;
  });
  const [authTarget, setAuthTargetState] = useState<AuthTarget | null>(() =>
    (sessionStorage.getItem(AUTH_TARGET_KEY) as AuthTarget | null) ?? null,
  );

  const login = (accessToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    clearOtpChallenge();
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    clearOtpChallenge();
  };

  const setOtpChallenge = (challengeId: number, channel: string, target: AuthTarget) => {
    const value = { challengeId, channel };
    sessionStorage.setItem(CHALLENGE_KEY, JSON.stringify(value));
    sessionStorage.setItem(AUTH_TARGET_KEY, target);
    setOtpChallengeState(value);
    setAuthTargetState(target);
  };

  const clearOtpChallenge = () => {
    sessionStorage.removeItem(CHALLENGE_KEY);
    sessionStorage.removeItem(AUTH_TARGET_KEY);
    setOtpChallengeState(null);
    setAuthTargetState(null);
  };

  const session = useMemo(
    () => (token ? jwtDecode<Session>(token) : null),
    [token],
  );

  const isAuthenticated = Boolean(
    session && session.exp * 1000 > Date.now(),
  );

  const viewerRole = useMemo<ViewerRole>(
    () => getViewerRole(isAuthenticated, session),
    [isAuthenticated, session],
  );

  const getAccessToken = (): string | null => {
    if (!token || !session) {
      return null;
    }
    if (session.exp * 1000 <= Date.now()) {
      logout();
      return null;
    }
    return token;
  };

  return {
    getAccessToken,
    login,
    logout,
    session,
    token,
    otpChallenge,
    authTarget,
    setOtpChallenge,
    clearOtpChallenge,
    isAuthenticated,
    viewerRole,
  };
});
