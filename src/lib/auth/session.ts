import { db } from "@/lib/db";
import { cookies } from "next/headers";
import crypto from "crypto";
import type { User, Session } from "@prisma/client";

export const SESSION_COOKIE_NAME = "alimentos_session";
export const SESSION_DURATION_HOURS = 8;
export const SESSION_DURATION_MS = SESSION_DURATION_HOURS * 60 * 60 * 1000;

export interface SessionValidationResult {
  session: Session;
  user: Omit<User, "passwordHash">;
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: string): Promise<{
  session: Session;
  token: string;
}> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  const session = await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return { session, token };
}

export async function validateSession(
  token: string
): Promise<SessionValidationResult | null> {
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: true,
    },
  });

  if (!session) {
    return null;
  }

  // Verificar si expiró
  if (session.expiresAt.getTime() < Date.now()) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Verificar si el usuario sigue activo
  if (!session.user.isActive) {
    await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Excluir passwordHash por seguridad
  const { passwordHash: _, ...safeUser } = session.user;

  return {
    session,
    user: safeUser,
  };
}

export async function destroySession(token: string): Promise<void> {
  try {
    await db.session.deleteMany({
      where: { token },
    });
  } catch (error) {
    console.error("Error al destruir sesión:", error);
  }
}

export async function destroyAllUserSessions(userId: string): Promise<void> {
  try {
    await db.session.deleteMany({
      where: { userId },
    });
  } catch (error) {
    console.error("Error al destruir sesiones de usuario:", error);
  }
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentUser(): Promise<Omit<User, "passwordHash"> | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const result = await validateSession(token);
    return result?.user ?? null;
  } catch (error) {
    console.error("Error al validar sesión:", error);
    return null;
  }
}
