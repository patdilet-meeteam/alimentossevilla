"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roles";
import { recordAuditEvent } from "@/lib/audit/audit-service";
import {
  getOrCreateFormulationSchema,
  createDraftVersionSchema,
  updateDraftProcessLossSchema,
  addIngredientToVersionSchema,
  updateIngredientPercentageSchema,
  removeIngredientFromVersionSchema,
  transitionVersionSchema,
  type GetOrCreateFormulationInput,
  type CreateDraftVersionInput,
  type AddIngredientToVersionInput,
  type UpdateIngredientPercentageInput,
  type RemoveIngredientFromVersionInput,
  type TransitionVersionInput,
} from "@/lib/validations/products";
import { Role } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

const WRITE_ROLES: Role[] = [Role.ADMIN, Role.R_AND_D];
const READ_ROLES: Role[] = [Role.ADMIN, Role.R_AND_D, Role.QUALITY, Role.VIEWER];
const APPROVE_ROLES: Role[] = [Role.ADMIN];
// El Director Técnico (ADMIN) es la única autoridad confirmada para aprobar
// o devolver una versión a corrección.
const REJECT_ROLES: Role[] = [Role.ADMIN];

class VersionLockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VersionLockedError";
  }
}

async function loadVersionOrThrow(id: string) {
  const version = await db.formulationVersion.findUnique({
    where: { id },
    include: {
      formulation: { select: { id: true, productId: true } },
    },
  });
  if (!version) throw new Error("Versión de formulación no encontrada.");
  return version;
}

function assertMutable(version: { estado: string }) {
  if (version.estado !== "DRAFT") {
    throw new VersionLockedError(
      `La versión está en estado ${version.estado} y no admite modificaciones.`
    );
  }
}

// --- Formulation ---

export async function getOrCreateFormulation(rawInput: GetOrCreateFormulationInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const input = getOrCreateFormulationSchema.parse(rawInput);

  const product = await db.product.findUnique({
    where: { id: input.productId },
    select: { id: true, isActive: true, formulations: true },
  });
  if (!product) throw new Error("Producto no encontrado.");

  const existing = product.formulations[0];
  if (existing) {
    // Los parámetros de proceso se conservan en cada FormulationVersion.
    // Una formulación ya existente es solo la relación 1:1 con el producto;
    // no se altera como efecto lateral de solicitarla de nuevo.
    return existing;
  }

  const created = await db.formulation.create({
    data: {
      productId: input.productId,
      baseCalculo: input.baseCalculo ?? 100,
      rendimientoEsperado: input.rendimientoEsperado ?? null,
    },
  });

  await recordAuditEvent({
    actorId: user.id, actorEmail: user.email,
    action: "formulation.create", entity: "Formulation", entityId: created.id,
    metadata: { productId: created.productId },
  });

  revalidatePath(`/productos/${input.productId}`);
  return created;
}

// --- FormulationVersion lifecycle ---

export async function createDraftVersion(rawInput: CreateDraftVersionInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const input = createDraftVersionSchema.parse(rawInput);

  const formulation = await db.formulation.findUnique({
    where: { id: input.formulationId },
    include: { versions: { orderBy: { numeroSecuencial: "desc" }, take: 1 } },
  });
  if (!formulation) throw new Error("Formulación no encontrada.");

  const nextNumber = (formulation.versions[0]?.numeroSecuencial ?? 0) + 1;

  const created = await db.formulationVersion.create({
    data: {
      formulationId: formulation.id,
      numeroSecuencial: nextNumber,
      estado: "DRAFT",
      rendimientoEsperado: input.rendimientoEsperado
        ?? formulation.versions[0]?.rendimientoEsperado
        ?? formulation.rendimientoEsperado
        ?? null,
    },
  });

  await recordAuditEvent({
    actorId: user.id, actorEmail: user.email,
    action: "formulation_version.create", entity: "FormulationVersion", entityId: created.id,
    metadata: { formulationId: formulation.id, numeroSecuencial: created.numeroSecuencial },
  });

  revalidatePath(`/productos/${formulation.productId}`);
  return created;
}

export async function updateDraftProcessLoss(rawInput: {
  formulationVersionId: string;
  rendimientoEsperado: number | null;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const input = updateDraftProcessLossSchema.parse(rawInput);
  const version = await loadVersionOrThrow(input.formulationVersionId);
  assertMutable(version);

  const updated = await db.formulationVersion.update({
    where: { id: version.id },
    data: { rendimientoEsperado: input.rendimientoEsperado },
  });

  await recordAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    action: "formulation_version.process_loss.update",
    entity: "FormulationVersion",
    entityId: version.id,
    metadata: {
      numeroSecuencial: version.numeroSecuencial,
      rendimientoEsperado: input.rendimientoEsperado,
    },
  });

  revalidatePath(`/productos/${version.formulation.productId}`);
  return updated;
}

export async function addIngredientToVersion(rawInput: AddIngredientToVersionInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const input = addIngredientToVersionSchema.parse(rawInput);
  const version = await loadVersionOrThrow(input.formulationVersionId);
  assertMutable(version);

  // Idempotent on the (versionId, ingredientId) unique — update if exists.
  const created = await db.formulationIngredient.upsert({
    where: {
      formulationVersionId_ingredientId: {
        formulationVersionId: input.formulationVersionId,
        ingredientId: input.ingredientId,
      },
    },
    create: {
      formulationVersionId: input.formulationVersionId,
      ingredientId: input.ingredientId,
      porcentajeParticipacion: input.porcentajeParticipacion,
      cantidadCanonica: input.cantidadCanonica ?? null,
    },
    update: {
      porcentajeParticipacion: input.porcentajeParticipacion,
      cantidadCanonica: input.cantidadCanonica ?? null,
    },
  });

  await recordAuditEvent({
    actorId: user.id, actorEmail: user.email,
    action: "formulation_ingredient.upsert", entity: "FormulationIngredient", entityId: created.id,
    metadata: { versionId: version.id, ingredientId: input.ingredientId, porcentaje: input.porcentajeParticipacion, cantidadCanonica: input.cantidadCanonica ?? null },
  });

  revalidatePath(`/productos/${version.formulation.productId}`);
  return created;
}

export async function updateIngredientPercentage(rawInput: UpdateIngredientPercentageInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const input = updateIngredientPercentageSchema.parse(rawInput);
  const version = await loadVersionOrThrow(input.formulationVersionId);
  assertMutable(version);

  const updated = await db.formulationIngredient.update({
    where: {
      formulationVersionId_ingredientId: {
        formulationVersionId: input.formulationVersionId,
        ingredientId: input.ingredientId,
      },
    },
    data: { porcentajeParticipacion: input.porcentajeParticipacion, cantidadCanonica: input.cantidadCanonica ?? null },
  });

  await recordAuditEvent({
    actorId: user.id, actorEmail: user.email,
    action: "formulation_ingredient.update", entity: "FormulationIngredient", entityId: updated.id,
    metadata: { versionId: version.id, ingredientId: input.ingredientId, porcentaje: input.porcentajeParticipacion, cantidadCanonica: input.cantidadCanonica ?? null },
  });

  revalidatePath(`/productos/${version.formulation.productId}`);
  return updated;
}

export async function removeIngredientFromVersion(rawInput: RemoveIngredientFromVersionInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const input = removeIngredientFromVersionSchema.parse(rawInput);
  const version = await loadVersionOrThrow(input.formulationVersionId);
  assertMutable(version);

  await db.formulationIngredient.delete({
    where: {
      formulationVersionId_ingredientId: {
        formulationVersionId: input.formulationVersionId,
        ingredientId: input.ingredientId,
      },
    },
  });

  await recordAuditEvent({
    actorId: user.id, actorEmail: user.email,
    action: "formulation_ingredient.remove", entity: "FormulationIngredient",
    metadata: { versionId: version.id, ingredientId: input.ingredientId },
  });

  revalidatePath(`/productos/${version.formulation.productId}`);
}

export async function submitForReview(rawInput: TransitionVersionInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const input = transitionVersionSchema.parse(rawInput);
  const version = await loadVersionOrThrow(input.formulationVersionId);
  if (version.estado !== "DRAFT") {
    throw new Error(`Solo se pueden enviar a revisión versiones en estado DRAFT. Estado actual: ${version.estado}.`);
  }

  const percentageSum = await db.formulationIngredient.aggregate({
    where: { formulationVersionId: version.id },
    _sum: { porcentajeParticipacion: true },
  });
  if (!percentageSum._sum.porcentajeParticipacion?.equals(new Prisma.Decimal(100))) {
    throw new Error("La suma de porcentajes debe ser exactamente 100,00 % antes de enviar a revisión.");
  }

  const updated = await db.formulationVersion.update({
    where: { id: version.id },
    data: { estado: "IN_REVIEW" },
  });

  await recordAuditEvent({
    actorId: user.id, actorEmail: user.email,
    action: "formulation_version.submit", entity: "FormulationVersion", entityId: version.id,
    metadata: { motivo: input.motivo ?? null },
  });

  revalidatePath(`/productos/${version.formulation.productId}`);
  return updated;
}

export async function approveVersion(rawInput: TransitionVersionInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, APPROVE_ROLES);

  const input = transitionVersionSchema.parse(rawInput);
  const version = await loadVersionOrThrow(input.formulationVersionId);
  if (version.estado !== "IN_REVIEW") {
    throw new Error(`Solo se pueden aprobar versiones en estado IN_REVIEW. Estado actual: ${version.estado}.`);
  }

  // Audit event for the approval first, then point the version's auditTrailId at it.
  const audit = await recordAuditEvent({
    actorId: user.id, actorEmail: user.email,
    action: "formulation_version.approve", entity: "FormulationVersion", entityId: version.id,
    metadata: { numeroSecuencial: version.numeroSecuencial, motivo: input.motivo ?? null },
  });

  const updated = await db.formulationVersion.update({
    where: { id: version.id },
    data: {
      estado: "APPROVED",
      aprobadaPorId: user.id,
      aprobadaEn: new Date(),
      validFrom: new Date(),
      auditTrailId: audit?.id ?? null,
    },
  });

  revalidatePath(`/productos/${version.formulation.productId}`);
  return updated;
}

export async function rejectToDraft(rawInput: TransitionVersionInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, REJECT_ROLES);

  const input = transitionVersionSchema.parse(rawInput);
  const version = await loadVersionOrThrow(input.formulationVersionId);
  if (version.estado !== "IN_REVIEW") {
    throw new Error(`Solo se pueden rechazar versiones en estado IN_REVIEW. Estado actual: ${version.estado}.`);
  }

  const updated = await db.formulationVersion.update({
    where: { id: version.id },
    data: { estado: "DRAFT" },
  });

  await recordAuditEvent({
    actorId: user.id, actorEmail: user.email,
    action: "formulation_version.reject", entity: "FormulationVersion", entityId: version.id,
    metadata: { motivo: input.motivo ?? "(sin motivo especificado)" },
  });

  revalidatePath(`/productos/${version.formulation.productId}`);
  return updated;
}

export async function obsoleteVersion(rawInput: TransitionVersionInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const input = transitionVersionSchema.parse(rawInput);
  const version = await loadVersionOrThrow(input.formulationVersionId);
  if (version.estado !== "APPROVED") {
    throw new Error(`Solo se pueden marcar como obsoletas versiones en estado APPROVED. Estado actual: ${version.estado}.`);
  }

  const updated = await db.formulationVersion.update({
    where: { id: version.id },
    data: { estado: "OBSOLETE" },
  });

  await recordAuditEvent({
    actorId: user.id, actorEmail: user.email,
    action: "formulation_version.obsolete", entity: "FormulationVersion", entityId: version.id,
    metadata: { motivo: input.motivo ?? null },
  });

  revalidatePath(`/productos/${version.formulation.productId}`);
  return updated;
}

// --- Reads ---

export async function listProductsForFilter() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, READ_ROLES);

  return db.product.findMany({
    where: { isActive: true },
    select: { id: true, codigoInterno: true, nombreComercial: true, categoriaProducto: true },
    orderBy: { nombreComercial: "asc" },
  });
}

export async function listActiveIngredients() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, READ_ROLES);

  return db.ingredient.findMany({
    where: { isActive: true },
    select: { id: true, name: true, siesaCode: true, category: true },
    orderBy: { name: "asc" },
  });
}
