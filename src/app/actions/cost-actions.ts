"use server";

import { createHash } from "node:crypto";
import { CostImportItemStatus, CostImportStatus, Prisma, Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roles";
import { recordAuditEvent } from "@/lib/audit/audit-service";
import { categorizeBySiesaCode } from "@/lib/validations/ingredients";
import { costImportIdSchema, costImportPeriodSchema, periodToDate } from "@/lib/validations/costs";
import {
  normalizeCostDescription,
  parseCostWorkbook,
  type ParsedCostRow,
} from "@/lib/costs/cost-import-parser";

const READ_ROLES: Role[] = [Role.ADMIN, Role.R_AND_D, Role.QUALITY, Role.VIEWER];
const FINANCE_ROLES: Role[] = [Role.ADMIN];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface CostImportActionResult {
  ok: boolean;
  message: string;
  importId?: string;
}

async function requireCurrentUser(roles: Role[]) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, roles);
  return user;
}

function validateUpload(formData: FormData): { file: File; period: string } {
  const file = formData.get("file");
  const period = costImportPeriodSchema.parse(formData.get("period"));
  if (!(file instanceof File)) throw new Error("Seleccione un archivo XLSX.");
  if (!file.name.toLowerCase().endsWith(".xlsx")) throw new Error("Solo se permiten archivos .xlsx.");
  if (file.size <= 0 || file.size > MAX_FILE_SIZE) {
    throw new Error("El archivo debe pesar entre 1 byte y 5 MB.");
  }
  return { file, period };
}

function buildNameIndex(
  ingredients: Array<{ id: string; name: string; genericName: string | null; siesaCode: string }>,
) {
  const index = new Map<string, Array<{ id: string; siesaCode: string }>>();
  for (const ingredient of ingredients) {
    for (const name of [ingredient.name, ingredient.genericName]) {
      if (!name) continue;
      const key = normalizeCostDescription(name);
      const entries = index.get(key) ?? [];
      if (!entries.some((entry) => entry.id === ingredient.id)) {
        entries.push({ id: ingredient.id, siesaCode: ingredient.siesaCode });
      }
      index.set(key, entries);
    }
  }
  return index;
}

export async function listCostImports() {
  await requireCurrentUser(READ_ROLES);
  return db.costImport.findMany({
    include: {
      importedBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } },
      _count: { select: { items: true } },
      items: {
        where: { status: { in: [CostImportItemStatus.INVALID, CostImportItemStatus.DUPLICATE_CONFLICT] } },
        select: { id: true, sourceRow: true, sourceCode: true, description: true, status: true, issues: true },
        orderBy: { sourceRow: "asc" },
        take: 8,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createCostImport(formData: FormData): Promise<CostImportActionResult> {
  const user = await requireCurrentUser(FINANCE_ROLES);
  const { file, period } = validateUpload(formData);
  const buffer = Buffer.from(await file.arrayBuffer());
  const sourceFileHash = createHash("sha256").update(buffer).digest("hex");
  const parsed = await parseCostWorkbook(buffer);

  const existingImport = await db.costImport.findUnique({ where: { sourceFileHash } });
  if (existingImport) {
    return { ok: false, message: "Este archivo ya fue importado.", importId: existingImport.id };
  }

  const createdIngredientCodes: string[] = [];
  const result = await db.$transaction(async (tx) => {
    const ingredients = await tx.ingredient.findMany({
      select: { id: true, name: true, genericName: true, siesaCode: true },
    });
    const byCode = new Map(ingredients.map((ingredient) => [ingredient.siesaCode, ingredient]));
    const byName = buildNameIndex(ingredients);
    const resolvedBySourceCode = new Map<string, { id: string; created: boolean }>();

    const imported = await tx.costImport.create({
      data: {
        periodStart: periodToDate(period),
        sourceFileName: file.name,
        sourceFileHash,
        rowCount: parsed.rows.length,
        validItemCount: parsed.validItemCount,
        warningCount: parsed.warningCount,
        importedById: user.id,
      },
    });

    for (const row of parsed.rows) {
      let resolved = resolvedBySourceCode.get(row.sourceCode);
      if (!resolved && !row.sourceCode.startsWith("INVALID-")) {
        const exact = byCode.get(row.sourceCode);
        if (exact) {
          resolved = { id: exact.id, created: false };
        } else {
          const nameMatches = byName.get(normalizeCostDescription(row.description)) ?? [];
          if (nameMatches.length === 1) {
            resolved = { id: nameMatches[0].id, created: false };
          } else {
            const ingredient = await tx.ingredient.create({
              data: {
                name: row.description,
                siesaCode: row.sourceCode,
                category: categorizeBySiesaCode(row.sourceCode),
                pendingReview: true,
                createdById: user.id,
              },
            });
            resolved = { id: ingredient.id, created: true };
            createdIngredientCodes.push(row.sourceCode);
          }
        }
        resolvedBySourceCode.set(row.sourceCode, resolved);
      }

      const itemStatus = mapItemStatus(row, resolved?.created ?? false);
      await tx.costImportItem.create({
        data: {
          costImportId: imported.id,
          sourceRow: row.sourceRow,
          sourceCode: row.sourceCode,
          description: row.description,
          unit: row.unit,
          unitCost: new Prisma.Decimal(row.unitCost),
          codeType: row.codeType,
          status: itemStatus,
          issues: row.issues.length ? row.issues : undefined,
          ingredientId: resolved?.id,
        },
      });
    }

    return imported;
  });

  await recordAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    action: "cost_import.create",
    entity: "CostImport",
    entityId: result.id,
    metadata: {
      period,
      sourceFileName: file.name,
      rowCount: parsed.rows.length,
      validItemCount: parsed.validItemCount,
      warningCount: parsed.warningCount,
      duplicateCodes: parsed.duplicateCodes,
      createdIngredientCount: createdIngredientCodes.length,
    },
  });

  revalidatePath("/costos");
  return {
    ok: true,
    importId: result.id,
    message: `Importación creada con ${parsed.rows.length} filas y ${parsed.warningCount} advertencias.`,
  };
}

function mapItemStatus(row: ParsedCostRow, createdIngredient: boolean): CostImportItemStatus {
  if (row.status === "INVALID") return CostImportItemStatus.INVALID;
  return createdIngredient
    ? CostImportItemStatus.CREATED_PENDING_REVIEW
    : CostImportItemStatus.MATCHED;
}

export async function applyCostImport(rawId: string): Promise<CostImportActionResult> {
  const user = await requireCurrentUser(FINANCE_ROLES);
  const id = costImportIdSchema.parse(rawId);
  const costImport = await db.costImport.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          items: { where: { status: { in: [CostImportItemStatus.INVALID, CostImportItemStatus.DUPLICATE_CONFLICT] } } },
        },
      },
    },
  });
  if (!costImport) throw new Error("Importación no encontrada.");
  if (costImport.status !== CostImportStatus.DRAFT) throw new Error("Solo se pueden aplicar importaciones en borrador.");
  if (costImport._count.items > 0) {
    return { ok: false, importId: id, message: `No se puede aplicar: hay ${costImport._count.items} filas inválidas o duplicadas.` };
  }

  await db.$transaction(async (tx) => {
    await tx.costImport.updateMany({
      where: { status: CostImportStatus.APPLIED, id: { not: id } },
      data: { status: CostImportStatus.SUPERSEDED },
    });
    await tx.costImport.update({
      where: { id },
      data: {
        status: CostImportStatus.APPLIED,
        approvedById: user.id,
        appliedAt: new Date(),
      },
    });
  });

  await recordAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    action: "cost_import.apply",
    entity: "CostImport",
    entityId: id,
    metadata: { periodStart: costImport.periodStart.toISOString() },
  });

  revalidatePath("/costos");
  return { ok: true, importId: id, message: "Costos aplicados correctamente." };
}

export async function listFormulationCostSummaries() {
  await requireCurrentUser(READ_ROLES);
  const applied = await db.costImport.findFirst({
    where: { status: CostImportStatus.APPLIED },
    orderBy: { appliedAt: "desc" },
    include: { items: true },
  });
  if (!applied) return { costImport: null, formulations: [] };

  const formulations = await db.formulation.findMany({
    include: {
      product: { select: { id: true, codigoInterno: true, nombreComercial: true } },
      versions: {
        where: { estado: "APPROVED" },
        orderBy: { numeroSecuencial: "desc" },
        take: 1,
        include: { ingredients: { include: { ingredient: true } } },
      },
    },
    orderBy: { product: { nombreComercial: "asc" } },
  });

  const itemsByIngredient = new Map<string, typeof applied.items>();
  for (const item of applied.items) {
    if (!item.ingredientId) continue;
    const entries = itemsByIngredient.get(item.ingredientId) ?? [];
    entries.push(item);
    itemsByIngredient.set(item.ingredientId, entries);
  }

  return {
    costImport: {
      id: applied.id,
      periodStart: applied.periodStart,
      sourceFileName: applied.sourceFileName,
    },
    formulations: formulations.flatMap((formulation) => {
      const version = formulation.versions[0];
      if (!version) return [];
      let total = 0;
      const issues: string[] = [];
      for (const entry of version.ingredients) {
        const candidates = (itemsByIngredient.get(entry.ingredientId) ?? []).filter(
          (item) => item.status === CostImportItemStatus.MATCHED || item.status === CostImportItemStatus.CREATED_PENDING_REVIEW,
        );
        if (candidates.length === 0) {
          issues.push(`${entry.ingredient.name}: sin costo`);
          continue;
        }
        // La fila posterior del archivo es la última asignación de costo
        // confirmada por Finanzas. Las filas previas quedan persistidas como
        // evidencia del archivo, pero no participan en el cálculo.
        const item = candidates.reduce((latest, candidate) =>
          candidate.sourceRow > latest.sourceRow ? candidate : latest,
        );
        if (item.unit !== "KG") {
          issues.push(`${entry.ingredient.name}: unidad ${item.unit ?? "ausente"}`);
          continue;
        }
        const quantityKg = Number(formulation.baseCalculo) * (Number(entry.porcentajeParticipacion) / 100);
        total += quantityKg * Number(item.unitCost);
      }
      return [{
        formulationId: formulation.id,
        productId: formulation.product.id,
        productCode: formulation.product.codigoInterno,
        productName: formulation.product.nombreComercial,
        versionNumber: version.numeroSecuencial,
        baseCalculoKg: Number(formulation.baseCalculo),
        directMaterialCost: total,
        issues,
      }];
    }),
  };
}
