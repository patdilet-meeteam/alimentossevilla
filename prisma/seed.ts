import { PrismaClient, Role } from "@prisma/client";
import { provisionCredentialUser } from "../src/lib/auth/provision-user";
import { NUTRIENTS_SEED } from "./nutrients-catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando inicialización de base de datos...");

  // FIX-06: Fail-closed en producción. Bloquear creación de cuentas de demostración.
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "⚠️ Entorno de producción detectado. El seed de demostración ha sido omitido por seguridad."
    );
    console.log(
      "ℹ️ Para inicializar el primer administrador en producción, configure las variables INITIAL_ADMIN_* y ejecute: pnpm admin:bootstrap"
    );
    return;
  }

  const adminEmail = (
    process.env.INITIAL_ADMIN_EMAIL || "admin@alimentossevilla.com"
  ).toLowerCase().trim();
  const adminName =
    process.env.INITIAL_ADMIN_NAME || "Administrador del Sistema";
  const adminPassword =
    process.env.INITIAL_ADMIN_PASSWORD || "AdminSevilla2026!#";

  // 1. Crear o asegurar Administrador principal (registro público deshabilitado:
  //    la cuenta se crea con el adaptador interno de Better Auth).
  const admin = await provisionCredentialUser(prisma, {
    email: adminEmail,
    name: adminName,
    password: adminPassword,
    role: Role.ADMIN,
  });
  if (admin.created) console.log(`Creando administrador inicial: ${adminEmail}`);

  console.log(`✅ Administrador listo: ${adminEmail} (Rol: ADMIN)`);

  // 2. Crear cuentas de prueba para desarrollo (SOLO EN ENTORNO DEV/TEST)
  const demoAccounts = [
    {
      email: "id@alimentossevilla.com",
      name: "Especialista I+D",
      role: Role.R_AND_D,
      password: "IDSevilla2026!#",
    },
    {
      email: "calidad@alimentossevilla.com",
      name: "Auditor de Calidad",
      role: Role.QUALITY,
      password: "CalidadSevilla2026!#",
    },
    {
      email: "consulta@alimentossevilla.com",
      name: "Usuario de Consulta",
      role: Role.VIEWER,
      password: "ConsultaSevilla2026!#",
    },
  ];

  for (const demo of demoAccounts) {
    await provisionCredentialUser(prisma, demo);
    console.log(`✅ Cuenta de prueba lista: ${demo.email} (Rol: ${demo.role})`);
  }

  // 3. Sembrar catálogo de nutrientes
  console.log("🌿 Sembrando catálogo de nutrientes...");
  for (const nutrient of NUTRIENTS_SEED) {
    await prisma.nutrient.upsert({
      where: { key: nutrient.key },
      update: {},
      create: nutrient,
    });
  }
  console.log(`✅ Catálogo de nutrientes sembrado: ${NUTRIENTS_SEED.length} nutrientes`);

  // 4. Registrar evento de auditoría del seed
  await prisma.auditEvent.create({
    data: {
      actorId: admin.id,
      actorEmail: adminEmail,
      action: "DATABASE_SEEDED",
      entity: "System",
      entityId: "platform-foundation-v2-spec-002",
      metadata: {
        environment: process.env.NODE_ENV || "development",
        seededAccounts: demoAccounts.length + 1,
        seededNutrients: NUTRIENTS_SEED.length,
        authProvider: "Better Auth",
      },
    },
  });

  console.log("🚀 Base de datos inicializada exitosamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error en inicialización de base de datos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
