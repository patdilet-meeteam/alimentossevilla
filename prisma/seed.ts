import { PrismaClient, Role, NutrientUnit } from "@prisma/client";
import { auth } from "../src/lib/auth/auth";

const prisma = new PrismaClient();

// Catálogo de nutrientes obligatorios según normativa y DATA-SOURCES.md
const NUTRIENTS_SEED = [
  { key: "ENERGY_KCAL", unit: "KCAL" as NutrientUnit, displayName: "Energía", isRequiredOnLabel: true },
  { key: "ENERGY_KJ", unit: "KJ" as NutrientUnit, displayName: "Energía (kJ)", isRequiredOnLabel: false },
  { key: "FAT_TOTAL", unit: "G" as NutrientUnit, displayName: "Grasas Totales", isRequiredOnLabel: true },
  { key: "FAT_SAT", unit: "G" as NutrientUnit, displayName: "Grasas Saturadas", isRequiredOnLabel: true },
  { key: "FAT_TRANS", unit: "G" as NutrientUnit, displayName: "Grasas Trans", isRequiredOnLabel: true },
  { key: "CARBS_TOTAL", unit: "G" as NutrientUnit, displayName: "Carbohidratos Totales", isRequiredOnLabel: true },
  { key: "SUGAR_TOTAL", unit: "G" as NutrientUnit, displayName: "Azúcares Totales", isRequiredOnLabel: true },
  { key: "SUGAR_ADDED", unit: "G" as NutrientUnit, displayName: "Azúcares Añadidos", isRequiredOnLabel: true },
  { key: "FIBER", unit: "G" as NutrientUnit, displayName: "Fibra Dietaria", isRequiredOnLabel: true },
  { key: "PROTEIN", unit: "G" as NutrientUnit, displayName: "Proteína", isRequiredOnLabel: true },
  { key: "SODIUM", unit: "MG" as NutrientUnit, displayName: "Sodio", isRequiredOnLabel: true },
  { key: "VITAMIN_A", unit: "MCG" as NutrientUnit, displayName: "Vitamina A", isRequiredOnLabel: false },
  { key: "VITAMIN_C", unit: "MG" as NutrientUnit, displayName: "Vitamina C", isRequiredOnLabel: false },
  { key: "CALCIUM", unit: "MG" as NutrientUnit, displayName: "Calcio", isRequiredOnLabel: false },
  { key: "IRON", unit: "MG" as NutrientUnit, displayName: "Hierro", isRequiredOnLabel: false },
];

async function main() {
  console.log("🌱 Iniciando inicialización de base de datos...");

  // FIX-06: Fail-closed en producción. Bloquear creación de cuentas de demostración.
  if (process.env.NODE_ENV === "production") {
    console.warn(
      "⚠️ Entorno de producción detectado. El seed de demostración ha sido omitido por seguridad."
    );
    console.log(
      "ℹ️ Para inicializar el primer administrador en producción, configure las variables INITIAL_ADMIN_* en su entorno y ejecute el script de bootstrap administrativo."
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

  // 1. Crear o asegurar Administrador principal mediante Better Auth
  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    console.log(`Creando administrador inicial: ${adminEmail}`);
    const res = await auth.api.signUpEmail({
      body: {
        email: adminEmail,
        password: adminPassword,
        name: adminName,
      },
    });

    if (res?.user) {
      adminUser = await prisma.user.update({
        where: { id: res.user.id },
        data: {
          role: Role.ADMIN,
          isActive: true,
        },
      });
    }
  } else {
    adminUser = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        name: adminName,
        role: Role.ADMIN,
        isActive: true,
      },
    });
  }

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
    const existing = await prisma.user.findUnique({
      where: { email: demo.email },
    });

    if (!existing) {
      const res = await auth.api.signUpEmail({
        body: {
          email: demo.email,
          password: demo.password,
          name: demo.name,
        },
      });
      if (res?.user) {
        await prisma.user.update({
          where: { id: res.user.id },
          data: {
            role: demo.role,
            isActive: true,
          },
        });
      }
    } else {
      await prisma.user.update({
        where: { email: demo.email },
        data: {
          name: demo.name,
          role: demo.role,
          isActive: true,
        },
      });
    }
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
      actorId: adminUser?.id || null,
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
