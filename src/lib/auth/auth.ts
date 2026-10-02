import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";
import { resolveAuthSecret, resolveTrustedOrigins } from "@/lib/auth/config";

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    // Sin registro público: las cuentas se crean desde el servidor con
    // src/lib/auth/provision-user.ts (seed de desarrollo y bootstrap del
    // administrador). Con el registro abierto, cualquiera en internet podía
    // crearse una cuenta activa.
    disableSignUp: true,
  },
  // Solo la URL pública configurada (y las locales fuera de producción).
  trustedOrigins: resolveTrustedOrigins(),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "VIEWER",
        input: false,
      },
      isActive: {
        type: "boolean",
        required: false,
        defaultValue: true,
        input: false,
      },
    },
  },
  session: {
    expiresIn: 8 * 60 * 60, // 8 horas
    // Renovación en cada validación de sesión para conservar disponibilidad
    // continua mientras el usuario permanezca activo.
    updateAge: 0,
  },
  // Falla al arrancar en producción si falta o es el valor de ejemplo.
  secret: resolveAuthSecret(),
});
