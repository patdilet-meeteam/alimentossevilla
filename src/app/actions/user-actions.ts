"use server";

import { db } from "@/lib/db";
import { getCurrentUser, revokeUserSessions } from "@/lib/auth/session";
import { requireRole, Role } from "@/lib/auth/roles";
import {
  updateUserRoleSchema,
  updateUserStatusSchema,
} from "@/lib/validations/auth";
import { recordAuditEvent } from "@/lib/audit/audit-service";
import { revalidatePath } from "next/cache";

export async function getUsersAction() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("No autenticado");
  }

  requireRole(currentUser.role, [Role.ADMIN]);

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return users;
}

export async function updateUserRoleAction(input: {
  userId: string;
  role: Role;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "No autenticado" };
  }

  try {
    requireRole(currentUser.role, [Role.ADMIN]);
  } catch {
    return {
      success: false,
      error: "Solo administradores pueden cambiar roles de usuario",
    };
  }

  const validation = updateUserRoleSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Datos inválidos",
    };
  }

  const { userId, role } = validation.data;

  try {
    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) {
      return { success: false, error: "Usuario no encontrado" };
    }

    const previousRole = targetUser.role;

    await db.user.update({
      where: { id: userId },
      data: { role },
    });

    await recordAuditEvent({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: "USER_ROLE_UPDATED",
      entity: "User",
      entityId: userId,
      metadata: {
        targetUserEmail: targetUser.email,
        previousRole,
        newRole: role,
      },
    });

    revalidatePath("/usuarios");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar rol de usuario:", error);
    return { success: false, error: "Error al actualizar el rol" };
  }
}

export async function toggleUserStatusAction(input: {
  userId: string;
  isActive: boolean;
}) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return { success: false, error: "No autenticado" };
  }

  try {
    requireRole(currentUser.role, [Role.ADMIN]);
  } catch {
    return {
      success: false,
      error: "Solo administradores pueden cambiar el estado de usuarios",
    };
  }

  const validation = updateUserStatusSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: validation.error.errors[0]?.message || "Datos inválidos",
    };
  }

  const { userId, isActive } = validation.data;

  if (currentUser.id === userId && !isActive) {
    return {
      success: false,
      error: "No puede desactivar su propia cuenta de administrador",
    };
  }

  try {
    const targetUser = await db.user.update({
      where: { id: userId },
      data: { isActive },
    });

    if (!isActive) {
      // Invalida todas las sesiones activas del usuario desactivado
      await revokeUserSessions(userId);
    }

    await recordAuditEvent({
      actorId: currentUser.id,
      actorEmail: currentUser.email,
      action: isActive ? "USER_ACTIVATED" : "USER_DEACTIVATED",
      entity: "User",
      entityId: userId,
      metadata: {
        targetUserEmail: targetUser.email,
        newStatus: isActive ? "ACTIVE" : "INACTIVE",
      },
    });

    revalidatePath("/usuarios");
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar estado de usuario:", error);
    return { success: false, error: "Error al actualizar el estado" };
  }
}
