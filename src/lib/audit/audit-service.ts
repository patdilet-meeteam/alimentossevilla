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

const FORBIDDEN_METADATA_KEYS = [
  "password",
  "passwordhash",
  "token",
  "secret",
  "authorization",
  "cookie",
  "session",
  "apikey",
  "privatekey",
];

export function sanitizeMetadata(
  metadata?: Record<string, unknown> | null
): Prisma.InputJsonValue | undefined {
  if (!metadata || typeof metadata !== "object") {
    return undefined;
  }

  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(metadata)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = FORBIDDEN_METADATA_KEYS.some((forbidden) =>
      lowerKey.includes(forbidden)
    );

    if (isSensitive) {
      clean[key] = "[REDACTED]";
    } else if (
      value !== null &&
      typeof value === "object" &&
      !Array.isArray(value)
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
    // Fail-safe: Log error locally without crashing the caller transaction
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
