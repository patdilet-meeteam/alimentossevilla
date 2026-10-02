import type { PrismaClient, Role } from "@prisma/client";
import { auth } from "./auth";

/**
 * Creación de cuentas desde el servidor.
 *
 * El registro público de Better Auth está deshabilitado (`disableSignUp`), y
 * esa bandera también bloquea `auth.api.signUpEmail` aunque se llame desde el
 * propio servidor. Por eso las cuentas se crean con el adaptador interno de
 * Better Auth: mismo hash de contraseña y misma cuenta "credential" que
 * produciría su registro, sin exponer ningún endpoint.
 */

/** Emisor que Better Auth asigna a las cuentas locales de correo y contraseña. */
const CREDENTIAL_ISSUER = "local:credential";

export interface ProvisionUserInput {
  email: string;
  name: string;
  password: string;
  role: Role;
}

/**
 * Crea un usuario con correo y contraseña, o devuelve el existente sin tocar
 * su contraseña. El rol y el estado activo se fijan siempre.
 */
export async function provisionCredentialUser(
  prisma: PrismaClient,
  input: ProvisionUserInput
): Promise<{ id: string; created: boolean }> {
  const email = input.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { name: input.name, role: input.role, isActive: true },
    });
    return { id: existing.id, created: false };
  }

  const ctx = await auth.$context;
  const passwordHash = await ctx.password.hash(input.password);

  // Mismo origen que declara el registro de Better Auth: así corren las
  // mismas validaciones internas que en un alta normal.
  const user = await ctx.internalAdapter.createUser(
    { email, name: input.name, emailVerified: false },
    { method: "email-password" }
  );
  if (!user) throw new Error(`No fue posible crear el usuario ${email}`);

  await ctx.internalAdapter.linkAccount({
    userId: user.id,
    providerId: "credential",
    issuer: CREDENTIAL_ISSUER,
    accountId: user.id,
    password: passwordHash,
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { role: input.role, isActive: true },
  });

  return { id: user.id, created: true };
}
