"use server";

import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import {
  createSession,
  destroySession,
  setSessionCookie,
  deleteSessionCookie,
  SESSION_COOKIE_NAME,
} from "@/lib/auth/session";
import { loginSchema } from "@/lib/validations/auth";
import { recordAuditEvent } from "@/lib/audit/audit-service";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface ActionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function loginAction(
  prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const rawEmail = formData.get("email");
  const rawPassword = formData.get("password");

  const validation = loginSchema.safeParse({
    email: rawEmail,
    password: rawPassword,
  });

  if (!validation.success) {
    const firstError = validation.error.errors[0]?.message || "Datos inválidos";
    return { success: false, error: firstError };
  }

  const { email, password } = validation.data;

  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Registrar intento fallido de inicio de sesión
      await recordAuditEvent({
        actorEmail: email,
        action: "AUTH_LOGIN_FAILED",
        entity: "User",
        metadata: { reason: "USER_NOT_FOUND" },
      });
      return { success: false, error: "Credenciales de acceso incorrectas" };
    }

    if (!user.isActive) {
      await recordAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "AUTH_LOGIN_BLOCKED",
        entity: "User",
        entityId: user.id,
        metadata: { reason: "USER_INACTIVE" },
      });
      return {
        success: false,
        error: "Esta cuenta de usuario se encuentra desactivada",
      };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);

    if (!isValidPassword) {
      await recordAuditEvent({
        actorId: user.id,
        actorEmail: user.email,
        action: "AUTH_LOGIN_FAILED",
        entity: "User",
        entityId: user.id,
        metadata: { reason: "INVALID_PASSWORD" },
      });
      return { success: false, error: "Credenciales de acceso incorrectas" };
    }

    // Crear sesión en base de datos
    const { token, session } = await createSession(user.id);
    await setSessionCookie(token, session.expiresAt);

    // Registrar evento de auditoría exitoso
    await recordAuditEvent({
      actorId: user.id,
      actorEmail: user.email,
      action: "AUTH_LOGIN_SUCCESS",
      entity: "Session",
      entityId: session.id,
      metadata: { role: user.role },
    });

    return { success: true };
  } catch (error) {
    console.error("Error en loginAction:", error);
    return {
      success: false,
      error: "Ocurrió un error inesperado al procesar el inicio de sesión",
    };
  }
}

export async function logoutAction(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await destroySession(token);
    }
    await deleteSessionCookie();
  } catch (error) {
    console.error("Error en logoutAction:", error);
  }

  redirect("/login");
}
