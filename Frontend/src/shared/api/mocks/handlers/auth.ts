import type { ApiSchemas } from "../../schema/index.ts";
import { http } from "../http.ts";
import {
  createRefreshTokenCookie,
  generateTempToken,
  generateTokens,
  verifyToken,
} from "../session.ts";

export const userPasswords = new Map<string, string>();
const resetTokens = new Map<string, string>();

export const mockUsers: ApiSchemas["User"][] = [
  { id: "1", email: "admin@gmail.com", role: "admin" },
  { id: "2", email: "captain@gmail.com", role: "team" },
];

userPasswords.set("admin@gmail.com", "123456");
userPasswords.set("captain@gmail.com", "123456");

export const userTeamIds: Record<string, string> = {
  "2": "t1",
};

const OTP_CODE = "123456";

export const authHandlers = [
  http.post("/auth/login", async ({ request, response }) => {
    const body = await request.json();

    const user = mockUsers.find((u) => u.email === body.email);
    const storedPassword = userPasswords.get(body.email);

    if (!user || !storedPassword || storedPassword !== body.password) {
      return response(401).json({
        message: "Неверный email или пароль",
        code: "INVALID_CREDENTIALS",
      });
    }

    const tempToken = await generateTempToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return response(200).json({
      tempToken,
      requires2fa: true,
    });
  }),

  http.post("/auth/verify-2fa", async ({ request, response }) => {
    const body = await request.json();

    if (body.code !== OTP_CODE) {
      return response(401).json({
        message: "Неверный код",
        code: "INVALID_OTP",
      });
    }

    let session;
    try {
      session = await verifyToken(body.tempToken);
    } catch {
      return response(401).json({
        message: "Сессия истекла",
        code: "INVALID_TEMP_TOKEN",
      });
    }

    const user = mockUsers.find((u) => u.id === session.userId);
    if (!user) {
      return response(401).json({
        message: "Пользователь не найден",
        code: "USER_NOT_FOUND",
      });
    }

    const { accessToken, refreshToken } = await generateTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      twoFaVerified: true,
    });

    return response(200).json(
      { accessToken, user },
      {
        headers: {
          "Set-Cookie": createRefreshTokenCookie(refreshToken),
        },
      },
    );
  }),

  http.post("/auth/forgot-password", async ({ request, response }) => {
    const body = await request.json();
    const user = mockUsers.find((u) => u.email === body.email);
    if (user) {
      resetTokens.set(`reset-${user.id}`, user.id);
    }
    return response(200).empty();
  }),

  http.post("/auth/reset-password/{token}", async ({ params, request, response }) => {
    const body = (await request.json()) as ApiSchemas["ResetPasswordRequest"];
    const userId = resetTokens.get(params.token);
    if (!userId) {
      return response(400).json({
        message: "Недействительная ссылка",
        code: "INVALID_RESET_TOKEN",
      });
    }
    const user = mockUsers.find((u) => u.id === userId);
    if (user) {
      userPasswords.set(user.email, body.password);
      resetTokens.delete(params.token);
    }
    return response(200).empty();
  }),

  http.post("/auth/register", async ({ request, response }) => {
    const body = await request.json();

    if (mockUsers.some((u) => u.email === body.email)) {
      return response(400).json({
        message: "Пользователь уже существует",
        code: "USER_EXISTS",
      });
    }

    const newUser: ApiSchemas["User"] = {
      id: String(mockUsers.length + 1),
      email: body.email,
      role: "team",
    };

    mockUsers.push(newUser);
    userPasswords.set(body.email, body.password);

    const tempToken = await generateTempToken({
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return response(201).json({
      tempToken,
      requires2fa: true,
    });
  }),

  http.post("/auth/refresh", async ({ cookies, response }) => {
    const refreshToken = cookies.refreshToken;

    if (!refreshToken) {
      return response(401).json({
        message: "Refresh token не найден",
        code: "REFRESH_TOKEN_MISSING",
      });
    }

    try {
      const session = await verifyToken(refreshToken);
      const user = mockUsers.find((u) => u.id === session.userId);

      if (!user) {
        throw new Error("User not found");
      }

      const { accessToken, refreshToken: newRefreshToken } = await generateTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        twoFaVerified: true,
      });

      return response(200).json(
        { accessToken, user },
        {
          headers: {
            "Set-Cookie": createRefreshTokenCookie(newRefreshToken),
          },
        },
      );
    } catch {
      return response(401).json({
        message: "Недействительный refresh token",
        code: "INVALID_REFRESH_TOKEN",
      });
    }
  }),
];
