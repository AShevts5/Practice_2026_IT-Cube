import { SignJWT, jwtVerify } from "jose";
import { HttpResponse } from "msw";

export type UserRole = "team" | "admin";

export type MockSession = {
  userId: string;
  email: string;
  role: UserRole;
  twoFaVerified?: boolean;
};

const JWT_SECRET = new TextEncoder().encode("your-secret-key");
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "7d";
const TEMP_TOKEN_EXPIRY = "10m";

export function createRefreshTokenCookie(refreshToken: string) {
  return `refreshToken=${refreshToken}; Path=/; Max-Age=604800`;
}

export async function generateTokens(session: MockSession) {
  const accessToken = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  const refreshToken = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(REFRESH_TOKEN_EXPIRY)
    .sign(JWT_SECRET);

  return { accessToken, refreshToken };
}

export async function generateTempToken(session: Omit<MockSession, "twoFaVerified">) {
  return new SignJWT({ ...session, twoFaVerified: false })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TEMP_TOKEN_EXPIRY)
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<MockSession> {
  const { payload } = await jwtVerify(token, JWT_SECRET);
  return payload as MockSession;
}

export async function verifyTokenOrThrow(request: Request): Promise<MockSession> {
  const token = request.headers.get("Authorization")?.split(" ")[1];
  const session = token ? await verifyToken(token).catch(() => null) : null;

  if (!session?.twoFaVerified) {
    throw HttpResponse.json(
      {
        message: "Invalid token",
        code: "INVALID_TOKEN",
      },
      { status: 401 },
    );
  }

  return session;
}

export async function verifyAdminOrThrow(request: Request): Promise<MockSession> {
  const session = await verifyTokenOrThrow(request);
  if (session.role !== "admin") {
    throw HttpResponse.json(
      { message: "Forbidden", code: "FORBIDDEN" },
      { status: 403 },
    );
  }
  return session;
}
