import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-dev-secret-dev-secret12");
const COOKIE = "pa_session";

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
  const secure = (process.env.APP_URL || "").startsWith("https://") || process.env.NODE_ENV === "production";
  cookies().set(COOKIE, token, { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function getUserId(): Promise<string | null> {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try {
    const { payload } = await jwtVerify(t, secret);
    return payload.sub as string;
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().set(COOKIE, "", { path: "/", maxAge: 0 });
}
