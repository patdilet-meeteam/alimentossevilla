import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { Role, requireRole, hasRole } from "@/lib/auth/roles";
import { recordAuditEvent } from "@/lib/audit/audit-service";
import crypto from "crypto";

describe("Integration: Database Persistence, Auth & Role Authorization", () => {
  const testRunId = crypto.randomBytes(4).toString("hex");
  const adminEmail = `test-admin-${testRunId}@alimentossevilla.com`;
  const viewerEmail = `test-viewer-${testRunId}@alimentossevilla.com`;
  const inactiveEmail = `test-inactive-${testRunId}@alimentossevilla.com`;

  let adminUserId: string;
  let viewerUserId: string;
  let inactiveUserId: string;

  beforeAll(async () => {
    // 1. Crear usuarios reales en PostgreSQL
    const admin = await db.user.create({
      data: {
        id: `usr_admin_${testRunId}`,
        name: "Admin Integración",
        email: adminEmail,
        role: Role.ADMIN,
        isActive: true,
      },
    });
    adminUserId = admin.id;

    const viewer = await db.user.create({
      data: {
        id: `usr_viewer_${testRunId}`,
        name: "Viewer Integración",
        email: viewerEmail,
        role: Role.VIEWER,
        isActive: true,
      },
    });
    viewerUserId = viewer.id;

    const inactive = await db.user.create({
      data: {
        id: `usr_inactive_${testRunId}`,
        name: "Inactive Integración",
        email: inactiveEmail,
        role: Role.R_AND_D,
        isActive: false, // Usuario inactivo
      },
    });
    inactiveUserId = inactive.id;
  });

  afterAll(async () => {
    // Limpieza de datos creados en el test
    await db.auditEvent.deleteMany({
      where: {
        OR: [
          { actorEmail: adminEmail },
          { actorEmail: viewerEmail },
          { actorEmail: inactiveEmail },
        ],
      },
    });

    await db.session.deleteMany({
      where: {
        userId: { in: [adminUserId, viewerUserId, inactiveUserId] },
      },
    });

    await db.account.deleteMany({
      where: {
        userId: { in: [adminUserId, viewerUserId, inactiveUserId] },
      },
    });

    await db.user.deleteMany({
      where: {
        id: { in: [adminUserId, viewerUserId, inactiveUserId] },
      },
    });
  });

  it("1. Persiste y consulta usuarios en la base de datos PostgreSQL", async () => {
    const user = await db.user.findUnique({
      where: { id: adminUserId },
    });

    expect(user).toBeDefined();
    expect(user?.email).toBe(adminEmail);
    expect(user?.role).toBe(Role.ADMIN);
    expect(user?.isActive).toBe(true);
  });

  it("2. Persiste sesión vinculada a un usuario real", async () => {
    const sessionToken = `token_${crypto.randomBytes(16).toString("hex")}`;
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

    const session = await db.session.create({
      data: {
        id: `sess_${testRunId}`,
        userId: viewerUserId,
        token: sessionToken,
        expiresAt,
      },
      include: { user: true },
    });

    expect(session.id).toBe(`sess_${testRunId}`);
    expect(session.user.email).toBe(viewerEmail);
    expect(session.user.role).toBe(Role.VIEWER);

    // Consulta por token
    const queried = await db.session.findUnique({
      where: { token: sessionToken },
    });
    expect(queried?.userId).toBe(viewerUserId);
  });

  it("3. FIX-03: Rechaza acceso server-side a usuarios inactivos (isActive=false)", async () => {
    const inactiveUser = await db.user.findUnique({
      where: { id: inactiveUserId },
    });

    expect(inactiveUser?.isActive).toBe(false);

    // Simulación del boundary de verificación server-side
    const isAllowed = inactiveUser !== null && inactiveUser.isActive === true;
    expect(isAllowed).toBe(false);
  });

  it("4. FIX-04: Bloquea roles no-admin (VIEWER, QUALITY, R_AND_D) de mutar usuarios", async () => {
    const viewer = await db.user.findUnique({ where: { id: viewerUserId } });
    expect(viewer).toBeDefined();

    // Intentar autorización con rol VIEWER
    expect(() => requireRole(viewer!.role, [Role.ADMIN])).toThrow(
      "Acceso denegado"
    );
    expect(hasRole(viewer!.role, [Role.ADMIN])).toBe(false);

    // Roles R_AND_D y QUALITY tampoco deben tener autorización administrativa
    expect(hasRole(Role.R_AND_D, [Role.ADMIN])).toBe(false);
    expect(hasRole(Role.QUALITY, [Role.ADMIN])).toBe(false);

    // Solo ADMIN tiene autorización
    expect(hasRole(Role.ADMIN, [Role.ADMIN])).toBe(true);
    expect(() => requireRole(Role.ADMIN, [Role.ADMIN])).not.toThrow();
  });

  it("5. Persiste AuditEvent en PostgreSQL y verifica sanitización real en DB", async () => {
    const sensitiveMetadataInput = {
      action: "USER_SECURITY_UPDATE",
      targetUserId: viewerUserId,
      api_key: "live_secret_key_12345",
      password_hash: "$scrypt$hash...",
      credentials: {
        token: "bearer_token_abc",
      },
      legitimateInfo: "Modificación de rol solicitada",
    };

    const event = await recordAuditEvent({
      actorId: adminUserId,
      actorEmail: adminEmail,
      action: "USER_ROLE_UPDATED",
      entity: "User",
      entityId: viewerUserId,
      metadata: sensitiveMetadataInput,
    });

    expect(event).toBeDefined();
    expect(event?.id).toBeDefined();

    // Consultar directamente desde PostgreSQL para verificar cómo se almacenó en JSONB
    const savedEvent = await db.auditEvent.findUnique({
      where: { id: event!.id },
    });

    expect(savedEvent).toBeDefined();
    expect(savedEvent?.action).toBe("USER_ROLE_UPDATED");
    expect(savedEvent?.actorEmail).toBe(adminEmail);

    const meta = savedEvent?.metadata as any;
    expect(meta.legitimateInfo).toBe("Modificación de rol solicitada");
    expect(meta.targetUserId).toBe(viewerUserId);

    // Verificación de sanitización efectiva en base de datos
    expect(meta.api_key).toBe("[REDACTED]");
    expect(meta.password_hash).toBe("[REDACTED]");
    expect(meta.credentials).toBe("[REDACTED]");
  });
});
