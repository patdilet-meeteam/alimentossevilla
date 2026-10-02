"use server";

import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roles";
import { recordAuditEvent } from "@/lib/audit/audit-service";
import { createRegulatoryParameterVersionSchema } from "@/lib/validations/regulatory";
import { getCurrentRegulatoryParameters } from "@/lib/nutrition/regulatory-parameters";

const READ_ROLES: Role[] = [Role.ADMIN, Role.R_AND_D, Role.QUALITY, Role.VIEWER];

export async function getRegulatoryParametersForPage() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, READ_ROLES);
  return getCurrentRegulatoryParameters();
}

export async function listRegulatoryParameterVersions() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, READ_ROLES);
  return db.regulatoryParameterVersion.findMany({ orderBy: { version: "desc" } });
}

export async function saveRegulatoryParameterVersion(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, [Role.ADMIN]);

  const input = createRegulatoryParameterVersionSchema.parse({
    sodiumMgPer100g: formData.get("sodiumMgPer100g"),
    energyPercentageThreshold: formData.get("energyPercentageThreshold"),
    fatTransPercentageThreshold: formData.get("fatTransPercentageThreshold"),
  });

  const version = await db.$transaction(async (tx) => {
    const latest = await tx.regulatoryParameterVersion.findFirst({
      orderBy: { version: "desc" },
      select: { version: true },
    });
    return tx.regulatoryParameterVersion.create({
      data: {
        version: (latest?.version ?? 0) + 1,
        sodiumMgPer100g: input.sodiumMgPer100g,
        energyPercentageThreshold: input.energyPercentageThreshold,
        fatTransPercentageThreshold: input.fatTransPercentageThreshold,
        createdById: user.id,
        createdByEmail: user.email,
      },
    });
  });

  await recordAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    action: "regulatory_parameters.version.create",
    entity: "RegulatoryParameterVersion",
    entityId: version.id,
    metadata: {
      version: version.version,
      sodiumMgPer100g: Number(version.sodiumMgPer100g),
      energyPercentageThreshold: Number(version.energyPercentageThreshold),
      fatTransPercentageThreshold: Number(version.fatTransPercentageThreshold),
    },
  });

  revalidatePath("/normativa");
  revalidatePath("/productos");
  revalidatePath("/documentos");
}
