import crypto from "node:crypto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

const session = vi.hoisted(() => ({ user: null as null | { id: string; email: string; role: Role } }));
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: vi.fn(async () => session.user) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { applyCostImport, listFormulationCostSummaries } from "@/app/actions/cost-actions";

describe("Integration: workflow de importación y costo directo (SPEC-005)", () => {
  const runId = crypto.randomBytes(5).toString("hex");
  const adminId = `cost_admin_${runId}`;
  const ingredientId = `cost_ing_${runId}`;
  const productCode = `cost-product-${runId}`;
  let productId: string;
  let formulationId: string;
  let firstImportId: string;
  let secondImportId: string;

  beforeAll(async () => {
    const admin = await db.user.create({
      data: { id: adminId, name: "Admin Costos", email: `cost-admin-${runId}@test.local`, role: Role.ADMIN, isActive: true },
    });
    session.user = { id: admin.id, email: admin.email, role: admin.role };

    await db.ingredient.create({
      data: {
        id: ingredientId,
        name: `Ingrediente costos ${runId}`,
        siesaCode: `13${runId.toUpperCase()}`,
        category: "ADITIVO",
        pendingReview: true,
        createdById: admin.id,
      },
    });

    const product = await db.product.create({
      data: {
        codigoInterno: productCode,
        nombreComercial: `Producto costos ${runId}`,
        categoriaProducto: "OTRO",
        createdById: admin.id,
      },
    });
    productId = product.id;
    const formulation = await db.formulation.create({ data: { productId, baseCalculo: 100 } });
    formulationId = formulation.id;
    const version = await db.formulationVersion.create({
      data: {
        formulationId,
        numeroSecuencial: 1,
        estado: "APPROVED",
        aprobadaPorId: admin.id,
        aprobadaEn: new Date(),
      },
    });
    await db.formulationIngredient.create({
      data: { formulationVersionId: version.id, ingredientId, porcentajeParticipacion: 25 },
    });

    const first = await db.costImport.create({
      data: {
        periodStart: new Date("2026-05-01T00:00:00.000Z"),
        sourceFileName: `costos-mayo-${runId}.xlsx`,
        sourceFileHash: crypto.createHash("sha256").update(`first-${runId}`).digest("hex"),
        rowCount: 1,
        validItemCount: 1,
        importedById: admin.id,
        items: {
          create: {
            sourceRow: 2,
            sourceCode: `13${runId.toUpperCase()}`,
            description: `Ingrediente costos ${runId}`,
            unit: "KG",
            unitCost: 8000,
            codeType: "INSUMO",
            status: "MATCHED",
            ingredientId,
          },
        },
      },
    });
    firstImportId = first.id;

    const second = await db.costImport.create({
      data: {
        periodStart: new Date("2026-06-01T00:00:00.000Z"),
        sourceFileName: `costos-junio-${runId}.xlsx`,
        sourceFileHash: crypto.createHash("sha256").update(`second-${runId}`).digest("hex"),
        rowCount: 1,
        validItemCount: 1,
        importedById: admin.id,
        items: {
          create: {
            sourceRow: 2,
            sourceCode: `13${runId.toUpperCase()}`,
            description: `Ingrediente costos ${runId}`,
            unit: "KG",
            unitCost: 10000,
            codeType: "INSUMO",
            status: "MATCHED",
            ingredientId,
          },
        },
      },
    });
    secondImportId = second.id;
  });

  afterAll(async () => {
    await db.auditEvent.deleteMany({ where: { actorId: adminId, entity: "CostImport" } });
    await db.costImport.deleteMany({ where: { importedById: adminId } });
    await db.formulationIngredient.deleteMany({ where: { formulationVersion: { formulationId } } });
    await db.formulationVersion.deleteMany({ where: { formulationId } });
    await db.formulation.deleteMany({ where: { id: formulationId } });
    await db.product.deleteMany({ where: { id: productId } });
    await db.ingredient.deleteMany({ where: { id: ingredientId } });
    await db.user.deleteMany({ where: { id: adminId } });
  });

  it("persiste la fila y el indicador de revisión del ingrediente", async () => {
    const item = await db.costImportItem.findFirst({
      where: { costImportId: firstImportId },
      include: { ingredient: true },
    });

    expect(item).toMatchObject({ sourceRow: 2, unit: "KG", status: "MATCHED" });
    expect(item?.ingredient?.pendingReview).toBe(true);
  });

  it("aplica el primer periodo y registra auditoría", async () => {
    await expect(applyCostImport(firstImportId)).resolves.toMatchObject({ ok: true });

    const [costImport, audit] = await Promise.all([
      db.costImport.findUnique({ where: { id: firstImportId } }),
      db.auditEvent.findFirst({ where: { actorId: adminId, entityId: firstImportId, action: "cost_import.apply" } }),
    ]);
    expect(costImport).toMatchObject({ status: "APPLIED", approvedById: adminId });
    expect(costImport?.appliedAt).toBeInstanceOf(Date);
    expect(audit).not.toBeNull();
  });

  it("reemplaza el periodo anterior y calcula el costo directo desde el aplicado", async () => {
    await expect(applyCostImport(secondImportId)).resolves.toMatchObject({ ok: true });

    const first = await db.costImport.findUnique({ where: { id: firstImportId } });
    expect(first?.status).toBe("SUPERSEDED");

    const result = await listFormulationCostSummaries();
    expect(result.costImport?.id).toBe(secondImportId);
    const summary = result.formulations.find((entry) => entry.formulationId === formulationId);
    expect(summary).toMatchObject({ baseCalculoKg: 100, issues: [] });
    expect(summary?.directMaterialCost).toBeCloseTo(250000, 2);
  });
});
