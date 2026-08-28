import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando semilla de base de datos (Platform Foundation)...");

  const adminEmail = process.env.INITIAL_ADMIN_EMAIL || "admin@alimentossevilla.com";
  const adminName = process.env.INITIAL_ADMIN_NAME || "Administrador del Sistema";
  const adminPassword = process.env.INITIAL_ADMIN_PASSWORD || "AdminSevilla2026!#";

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(adminPassword, salt);

  // 1. Crear o actualizar Administrador principal
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      name: adminName,
      role: Role.ADMIN,
      isActive: true,
    },
    create: {
      email: adminEmail,
      name: adminName,
      passwordHash: passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  console.log(`✅ Usuario Administrador listo: ${admin.email} (Rol: ${admin.role})`);

  // 2. Crear usuarios de prueba para los demás roles
  const demoUsers = [
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

  for (const demo of demoUsers) {
    const hash = await bcrypt.hash(demo.password, salt);
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {
        name: demo.name,
        role: demo.role,
        isActive: true,
      },
      create: {
        email: demo.email,
        name: demo.name,
        passwordHash: hash,
        role: demo.role,
        isActive: true,
      },
    });
    console.log(`✅ Usuario ${demo.role} listo: ${user.email}`);
  }

  // 3. Registrar evento de auditoría del seed
  await prisma.auditEvent.create({
    data: {
      actorId: admin.id,
      actorEmail: admin.email,
      action: "DATABASE_SEEDED",
      entity: "System",
      entityId: "initial-foundation",
      metadata: {
        environment: process.env.NODE_ENV || "development",
        seededUsersCount: demoUsers.length + 1,
      },
    },
  });

  console.log("🚀 Semilla completada exitosamente.");
}

main()
  .catch((e) => {
    console.error("❌ Error en semilla de base de datos:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
