/**
 * Alta de usuarios y restablecimiento de contraseñas desde el servidor.
 *
 * El registro público está deshabilitado y el panel aún no permite crear
 * usuarios ni cambiar contraseñas, así que esta es la vía de operaciones:
 *
 *   pnpm user:create --email ana@empresa.com --name "Ana Pérez" --role R_AND_D
 *   pnpm user:create --email ana@empresa.com --reset-password
 *
 * Roles: ADMIN, R_AND_D, QUALITY, VIEWER.
 *
 * La contraseña la genera el script (nunca se pasa por argumento: quedaría en
 * el historial de la terminal) y se muestra UNA sola vez. Restablecer cierra
 * todas las sesiones abiertas del usuario. Ambas acciones quedan en auditoría.
 */
import { parseArgs } from "node:util";
import { PrismaClient } from "@prisma/client";
import { createUserSchema } from "../src/lib/validations/auth";
import {
  provisionCredentialUser,
  resetCredentialPassword,
} from "../src/lib/auth/provision-user";
import { generarContrasena } from "../src/lib/auth/password-generator";

const prisma = new PrismaClient();

const USO = `Uso:
  pnpm user:create --email <correo> --name "<nombre>" --role <ADMIN|R_AND_D|QUALITY|VIEWER>
  pnpm user:create --email <correo> --reset-password`;

function mostrarCredenciales(email: string, password: string, aviso: string) {
  console.log(`\n${aviso}`);
  console.log(`  Correo:     ${email}`);
  console.log(`  Contraseña: ${password}`);
  console.log("\n  Se muestra UNA sola vez. Entréguela por un canal seguro.\n");
}

async function crear(email: string, name: string | undefined, role: string | undefined) {
  const password = generarContrasena();
  const datos = createUserSchema.safeParse({ email, name, role, password });
  if (!datos.success) {
    const detalle = datos.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`);
    throw new Error(`Datos inválidos:\n${detalle.join("\n")}\n\n${USO}`);
  }

  const correo = datos.data.email.toLowerCase().trim();
  if (await prisma.user.findUnique({ where: { email: correo } })) {
    throw new Error(
      `Ya existe un usuario con el correo ${correo}. ` +
        "Cambie su rol desde el panel o use --reset-password para darle una contraseña nueva."
    );
  }

  const usuario = await provisionCredentialUser(prisma, datos.data);
  await prisma.auditEvent.create({
    data: {
      action: "USER_CREATED",
      entity: "User",
      entityId: usuario.id,
      metadata: { targetUserEmail: correo, role: datos.data.role, via: "cli" },
    },
  });

  mostrarCredenciales(correo, password, `✅ Usuario creado con rol ${datos.data.role}.`);
}

async function restablecer(email: string) {
  const correo = email.toLowerCase().trim();
  const usuario = await prisma.user.findUnique({ where: { email: correo } });
  if (!usuario) throw new Error(`No existe un usuario con el correo ${correo}.`);

  const password = generarContrasena();
  await resetCredentialPassword(prisma, usuario.id, password);
  await prisma.auditEvent.create({
    data: {
      action: "USER_PASSWORD_RESET",
      entity: "User",
      entityId: usuario.id,
      metadata: { targetUserEmail: correo, via: "cli", sessionsRevoked: true },
    },
  });

  mostrarCredenciales(correo, password, "✅ Contraseña restablecida y sesiones cerradas.");
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      name: { type: "string" },
      role: { type: "string" },
      "reset-password": { type: "boolean", default: false },
    },
  });

  if (!values.email) throw new Error(USO);

  if (values["reset-password"]) {
    await restablecer(values.email);
  } else {
    await crear(values.email, values.name, values.role?.toUpperCase());
  }
}

main()
  .catch((e) => {
    console.error(`❌ ${e instanceof Error ? e.message : e}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
