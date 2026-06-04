import { queryClient } from "@/shared/api/query-client";
import { navigateReplace } from "@/shared/lib/router-ref";
import { ROUTES } from "@/shared/model/routes";
import { createGStore } from "create-gstore";
import { jwtDecode } from "jwt-decode";
import { useMemo, useState } from "react";
import { getViewerRole, type ViewerRole } from "./viewer-role.ts";

export type LogoutOptions = {
  /** Куда перейти после выхода. `false` — остаться на текущем URL (для loader redirect). */
  redirectTo?: string | false;
};

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
const OTP_FLOW_KEY = "otpFlow";

export type OtpFlow = "login" | "register";

type OtpChallenge = {
  challengeId: number;
  channel: string;
  flow: OtpFlow;
};

export const useSession = createGStore(() => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [otpChallenge, setOtpChallengeState] = useState<OtpChallenge | null>(() => {
    const raw = sessionStorage.getItem(CHALLENGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OtpChallenge>;
    if (typeof parsed.challengeId !== "number") return null;
    return {
      challengeId: parsed.challengeId,
      channel: parsed.channel ?? "email",
      flow: parsed.flow ?? "login",
    };
  });
  const [authTarget, setAuthTargetState] = useState<AuthTarget | null>(() =>
    (sessionStorage.getItem(AUTH_TARGET_KEY) as AuthTarget | null) ?? null,
  );
  const [otpFlow, setOtpFlowState] = useState<OtpFlow | null>(() =>
    (sessionStorage.getItem(OTP_FLOW_KEY) as OtpFlow | null) ?? null,
  );

  const login = (accessToken: string) => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    clearOtpChallenge();
  };

  const logout = (options?: LogoutOptions) => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    clearOtpChallenge();
    void queryClient.clear();

    if (options?.redirectTo === false) {
      return;
    }

    navigateReplace(options?.redirectTo ?? ROUTES.HOME);
  };

  const setOtpChallenge = (
    challengeId: number,
    channel: string,
    target: AuthTarget,
    flow: OtpFlow = "login",
  ) => {
    const value = { challengeId, channel, flow };
    sessionStorage.setItem(CHALLENGE_KEY, JSON.stringify(value));
    sessionStorage.setItem(AUTH_TARGET_KEY, target);
    sessionStorage.setItem(OTP_FLOW_KEY, flow);
    setOtpChallengeState(value);
    setAuthTargetState(target);
    setOtpFlowState(flow);
  };

  const clearOtpChallenge = () => {
    sessionStorage.removeItem(CHALLENGE_KEY);
    sessionStorage.removeItem(AUTH_TARGET_KEY);
    sessionStorage.removeItem(OTP_FLOW_KEY);
    setOtpChallengeState(null);
    setAuthTargetState(null);
    setOtpFlowState(null);
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
      logout({ redirectTo: false });
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
    otpFlow,
    setOtpChallenge,
    clearOtpChallenge,
    isAuthenticated,
    viewerRole,
  };
});
