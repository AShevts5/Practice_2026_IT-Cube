import { createGStore } from "create-gstore";
import { jwtDecode } from "jwt-decode";
import { useMemo, useState } from "react";
import { publicFetchClient } from "@/shared/api/instance";

export type UserRole = "team" | "admin";

export type Session = {
  userId: string;
  email: string;
  role: UserRole;
  twoFaVerified?: boolean;
  exp: number;
  iat: number;
};

const TOKEN_KEY = "token";
const TEMP_TOKEN_KEY = "tempToken";

let refreshTokenPromise: Promise<string | null> | null = null;

export const useSession = createGStore(() => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [tempToken, setTempTokenState] = useState(() =>
    sessionStorage.getItem(TEMP_TOKEN_KEY),
  );

  const login = (newToken: string) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    clearTempToken();
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    clearTempToken();
  };

  const setTempToken = (value: string) => {
    sessionStorage.setItem(TEMP_TOKEN_KEY, value);
    setTempTokenState(value);
  };

  const clearTempToken = () => {
    sessionStorage.removeItem(TEMP_TOKEN_KEY);
    setTempTokenState(null);
  };

  const session = useMemo(
    () => (token ? jwtDecode<Session>(token) : null),
    [token],
  );

  const isAuthenticated = Boolean(
    session?.twoFaVerified && session.exp * 1000 > Date.now(),
  );

  const refreshToken = async (): Promise<string | null> => {
    if (!token) {
      return null;
    }

    const decoded = jwtDecode<Session>(token);

    if (decoded.exp >= Date.now() / 1000) {
      return token;
    }

    if (!refreshTokenPromise) {
      refreshTokenPromise = publicFetchClient
        .POST("/auth/refresh")
        .then((r) => r.data?.accessToken ?? null)
        .then((newToken) => {
          if (newToken) {
            login(newToken);
            return newToken;
          }
          logout();
          return null;
        })
        .finally(() => {
          refreshTokenPromise = null;
        });
    }

    return refreshTokenPromise;
  };

  return {
    refreshToken,
    login,
    logout,
    session,
    token,
    tempToken,
    setTempToken,
    clearTempToken,
    isAuthenticated,
  };
});
