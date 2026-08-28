import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export async function getCurrentSession() {
  try {
    const reqHeaders = await headers();
    const sessionData = await auth.api.getSession({
      headers: reqHeaders,
    });
    return sessionData;
  } catch (error) {
    console.error("Error al obtener sesión de Better Auth:", error);
    return null;
  }
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const sessionData = await getCurrentSession();
  if (!sessionData?.user) {
    return null;
  }

  // Consultar en base de datos para garantizar frescura de estado y rol
  const dbUser = await db.user.findUnique({
    where: { id: sessionData.user.id },
  });

  if (!dbUser) {
    return null;
  }

  // FIX-03: Inactive user => access denied server-side
  if (!dbUser.isActive) {
    return null;
  }

  return {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
    emailVerified: dbUser.emailVerified,
    image: dbUser.image,
    role: dbUser.role,
    isActive: dbUser.isActive,
    createdAt: dbUser.createdAt,
    updatedAt: dbUser.updatedAt,
  };
}

export async function revokeUserSessions(userId: string): Promise<void> {
  try {
    await db.session.deleteMany({
      where: { userId },
    });
  } catch (error) {
    console.error("Error al revocar sesiones de usuario:", error);
  }
}
