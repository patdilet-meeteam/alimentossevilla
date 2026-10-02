/**
 * Bootstrap de producción: primer administrador y datos de referencia.
 *
 * El seed de desarrollo se niega a correr en producción (crea cuentas de
 * demostración con contraseñas conocidas). Este script es el camino seguro
 * para dejar una instalación nueva lista:
 *
 *   1. Crea el administrador inicial con INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL
 *      e INITIAL_ADMIN_PASSWORD. No tiene valores por defecto.
 *   2. Carga el catálogo de nutrientes (dato de referencia, idempotente).
 *
 * Si ya existe un administrador activo, no crea otro: el script no es una vía
 * para fabricar administradores sobre una instalación en uso.
 *
 * Uso: pnpm admin:bootstrap
 */
import { PrismaClient, Role } from "@prisma/client";
import { createUserSchema } from "../src/lib/validations/auth";
import { provisionCredentialUser } from "../src/lib/auth/provision-user";
import { NUTRIENTS_SEED } from "../prisma/nutrients-catalog";

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findFirst({
    where: { role: Role.ADMIN, isActive: true },
    select: { email: true },
  });

  let adminId: string | null = null;
  let adminEmail: string | null = null;

  if (existingAdmin) {
    console.log(`ℹ️ Ya existe un administrador activo (${existingAdmin.email}); no se crea otro.`);
  } else {
    const input = createUserSchema.safeParse({
      name: process.env.INITIAL_ADMIN_NAME,
      email: process.env.INITIAL_ADMIN_EMAIL,
      password: process.env.INITIAL_ADMIN_PASSWORD,
      role: Role.ADMIN,
    });
    if (!input.success) {
      const detalle = input.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
      throw new Error(
        `Variables INITIAL_ADMIN_* incompletas o inválidas:\n${detalle.join("\n")}`
      );
    }

    const admin = await provisionCredentialUser(prisma, input.data);
    adminId = admin.id;
    adminEmail = input.data.email.toLowerCase().trim();
    console.log(`✅ Administrador inicial creado: ${adminEmail}`);
  }

  for (const nutrient of NUTRIENTS_SEED) {
    await prisma.nutrient.upsert({
      where: { key: nutrient.key },
      update: {},
      create: nutrient,
    });
  }
  console.log(`✅ Catálogo de nutrientes verificado: ${NUTRIENTS_SEED.length} nutrientes`);

  await prisma.auditEvent.create({
    data: {
      actorId: adminId,
      actorEmail: adminEmail,
      action: "PLATFORM_BOOTSTRAPPED",
      entity: "System",
      metadata: {
        environment: process.env.NODE_ENV || "development",
        adminCreated: adminId !== null,
        nutrients: NUTRIENTS_SEED.length,
      },
    },
  });
}

main()
  .catch((e) => {
    console.error("❌ Bootstrap fallido:", e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
