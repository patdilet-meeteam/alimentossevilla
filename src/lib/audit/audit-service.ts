import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export interface AuditEventInput {
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

const SENSITIVE_KEY_PATTERNS = [
  "password",
  "token",
  "secret",
  "auth",
  "credential",
  "cookie",
  "session",
  "key",
  "signature",
  "passphrase",
  "bearer",
];

export function isSensitiveKey(key: string): boolean {
  if (!key) return false;
  // Normalizar clave: minúsculas y eliminación de guiones, guiones bajos y espacios
  const normalized = key.toLowerCase().replace(/[-_\s]/g, "");

  return SENSITIVE_KEY_PATTERNS.some((pattern) =>
    normalized.includes(pattern)
  );
}

export function sanitizeMetadata(
  metadata?: Record<string, unknown> | unknown[] | null
): Prisma.InputJsonValue | undefined {
  if (metadata === null || metadata === undefined) {
    return undefined;
  }

  if (Array.isArray(metadata)) {
    return metadata.map((item) => {
      if (item !== null && typeof item === "object") {
        return sanitizeMetadata(item as Record<string, unknown>);
      }
      return item;
    }) as Prisma.InputJsonValue;
  }

  if (typeof metadata !== "object") {
    return metadata as Prisma.InputJsonValue;
  }

  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (isSensitiveKey(key)) {
      clean[key] = "[REDACTED]";
    } else if (Array.isArray(value)) {
      clean[key] = value.map((item) => {
        if (item !== null && typeof item === "object") {
          return sanitizeMetadata(item as Record<string, unknown>);
        }
        return item;
      });
    } else if (
      value !== null &&
      typeof value === "object" &&
      !(value instanceof Date)
    ) {
      clean[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }

  return clean as Prisma.InputJsonValue;
}

export async function recordAuditEvent(input: AuditEventInput) {
  try {
    const sanitizedMeta = sanitizeMetadata(input.metadata);

    const event = await db.auditEvent.create({
      data: {
        actorId: input.actorId || null,
        actorEmail: input.actorEmail || null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId || null,
        metadata: sanitizedMeta,
        ipAddress: input.ipAddress || null,
        userAgent: input.userAgent || null,
      },
    });

    return event;
  } catch (error) {
    // Fail-safe: Registra error internamente sin quebrar la transacción principal
    console.error("❌ Fallo al registrar evento de auditoría:", error);
    return null;
  }
}

export async function getRecentAuditEvents(limit = 50) {
  return db.auditEvent.findMany({
    take: limit,
    orderBy: {
      timestamp: "desc",
    },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
}
