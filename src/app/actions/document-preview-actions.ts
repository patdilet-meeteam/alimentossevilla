"use server";

import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { buildLegalIngredientsPreview } from "@/lib/documents/legal-ingredients-preview";
import { calculateNutrition } from "@/lib/nutrition/nutrition-calculator";
import { evaluateWarningSeals } from "@/lib/nutrition/warning-seals";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { recordAuditEvent } from "@/lib/audit/audit-service";
import { getCurrentRegulatoryParameters } from "@/lib/nutrition/regulatory-parameters";
import { resolveCtnNutritionSnapshot } from "@/lib/nutrition/ctn-import";

const READ_ROLES: Role[] = [Role.ADMIN, Role.R_AND_D, Role.QUALITY, Role.VIEWER];
const WRITE_ROLES: Role[] = [Role.ADMIN, Role.R_AND_D];
const productIdSchema = z.string().trim().min(1).max(128);

export async function listLegalIngredientsPreviews() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, READ_ROLES);
  const regulatoryParameters = await getCurrentRegulatoryParameters();

  const formulations = await db.formulation.findMany({
    include: {
      product: {
        select: {
          id: true,
          codigoInterno: true,
          nombreComercial: true,
          presentations: {
            where: { isActive: true },
            select: { id: true, gramajeNeto: true, porcionDeclarada: true },
            orderBy: { gramajeNeto: "asc" },
          },
        },
      },
      versions: {
        where: { estado: "APPROVED" },
        orderBy: { numeroSecuencial: "desc" },
        take: 1,
        include: {
          ingredients: {
            include: {
              ingredient: {
                select: {
                  id: true,
                  name: true,
                  genericName: true,
                  isAllergen: true,
                  allergenTags: true,
                  profiles: {
                    where: { isActive: true },
                    include: { values: { include: { nutrient: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { product: { nombreComercial: "asc" } },
  });

  return formulations.flatMap((formulation) => {
    const version = formulation.versions[0];
    if (!version) return [];
    const profileInputs = version.ingredients.map((entry) => ({
      ingredientId: entry.ingredient.id,
      name: entry.ingredient.name,
      quantity: Number(entry.cantidadCanonica ?? entry.porcentajeParticipacion),
      nutrientsPer100g: Object.fromEntries((entry.ingredient.profiles[0]?.values ?? []).map((value) => [value.nutrient.key, Number(value.value)])),
    }));
    const ctnInputs = resolveCtnNutritionSnapshot(version.nutritionSourceSnapshot, profileInputs);
    const nutritionInputs = ctnInputs.status === "ready" ? ctnInputs.inputs : ctnInputs.status === "absent" ? profileInputs : [];
    const requiredNutrients = ["FAT_TOTAL", "FAT_SAT", "FAT_TRANS", "PROTEIN", "CARBS_TOTAL", "SUGAR_TOTAL", "SUGAR_ADDED", "FIBER", "SODIUM"];
    const nutritionReady = ctnInputs.status !== "invalid"
      && nutritionInputs.length > 0
      && nutritionInputs.every((input) => requiredNutrients.every((key) => input.nutrientsPer100g[key] !== undefined));
    const nutrition = nutritionReady
      ? (() => {
        const calculation = calculateNutrition(nutritionInputs, 100);
        const seals = evaluateWarningSeals(
          { per100g: calculation.per100g, energyKcalPer100g: calculation.energyKcalPer100g },
          regulatoryParameters.thresholds,
        );
        return {
          ready: true as const,
          calculationSource: ctnInputs.status === "ready" ? "EXCEL_CTN" as const : "BANCO_NUTRICIONAL" as const,
          sourceFileName: ctnInputs.status === "ready" ? ctnInputs.sourceFileName : null,
          regulatoryParametersVersion: regulatoryParameters.version,
          energyKcalPer100g: Number(calculation.energyKcalPer100g),
          per100g: Object.fromEntries(Object.entries(calculation.per100g).map(([key, value]) => [key, Number(value)])),
          presentations: formulation.product.presentations.map((presentation) => {
            const portion = presentation.porcionDeclarada === null ? null : Number(presentation.porcionDeclarada);
            return {
              id: presentation.id,
              portionGrams: portion,
              values: portion === null ? null : Object.fromEntries(Object.entries(calculation.per100g).map(([key, value]) => [key, Number(value.mul(portion).div(100))])),
            };
          }),
          activeSeals: seals.activeSeals,
        };
      })()
      : { ready: false as const, reason: ctnInputs.status === "invalid" ? ctnInputs.reason : "Faltan perfiles o nutrientes críticos para construir la tabla nutricional." };

    return [{
      productId: formulation.product.id,
      productCode: formulation.product.codigoInterno,
      productName: formulation.product.nombreComercial,
      versionNumber: version.numeroSecuencial,
      sourceFormulationVersionId: version.id,
      presentations: formulation.product.presentations.map((presentation) => ({
        id: presentation.id,
        netWeightGrams: Number(presentation.gramajeNeto),
        portionGrams: presentation.porcionDeclarada === null ? null : Number(presentation.porcionDeclarada),
      })),
      nutrition,
      ...buildLegalIngredientsPreview(version.ingredients.map((entry) => ({
        ingredientId: entry.ingredient.id,
        name: entry.ingredient.name,
        genericName: entry.ingredient.genericName,
        percentage: Number(entry.porcentajeParticipacion),
        isAllergen: entry.ingredient.isAllergen,
        allergenTags: entry.ingredient.allergenTags,
      }))),
    }];
  });
}

export async function saveLegalIngredientsPreviewSnapshot(rawProductId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);
  const productId = productIdSchema.parse(rawProductId);

  const preview = (await listLegalIngredientsPreviews()).find((item) => item.productId === productId);
  if (!preview) throw new Error("No hay una previsualización aprobada disponible para guardar.");
  if (!preview.nutrition.ready || preview.nutrition.calculationSource !== "EXCEL_CTN") {
    throw new Error("Solo se puede guardar una versión preliminar cuando la salida nutricional proviene de una captura del Excel CTN.");
  }

  const snapshot = await db.$transaction(async (tx) => {
    const latest = await tx.technicalDocumentSnapshot.findFirst({
      where: { productId },
      orderBy: { documentVersion: "desc" },
      select: { documentVersion: true },
    });
    return tx.technicalDocumentSnapshot.create({
      data: {
        productId,
        documentVersion: (latest?.documentVersion ?? 0) + 1,
        sourceFormulationVersionId: preview.sourceFormulationVersionId,
        sourceFormulationVersionNumber: preview.versionNumber,
        createdById: user.id,
        createdByEmail: user.email,
        content: preview,
      },
    });
  });

  await recordAuditEvent({
    actorId: user.id,
    actorEmail: user.email,
    action: "technical_document.preview_snapshot.create",
    entity: "TechnicalDocumentSnapshot",
    entityId: snapshot.id,
    metadata: {
      productId,
      documentVersion: snapshot.documentVersion,
      sourceFormulationVersionId: snapshot.sourceFormulationVersionId,
      status: "PRELIMINARY_NOT_ISSUED",
      calculationSource: preview.nutrition.ready ? preview.nutrition.calculationSource : null,
      calculationSourceFile: preview.nutrition.ready ? preview.nutrition.sourceFileName : null,
    },
  });
  revalidatePath("/documentos");
}

export async function listLegalPreviewSnapshots() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, READ_ROLES);

  return db.technicalDocumentSnapshot.findMany({
    orderBy: [{ productId: "asc" }, { documentVersion: "desc" }],
    select: {
      id: true,
      productId: true,
      documentVersion: true,
      sourceFormulationVersionId: true,
      sourceFormulationVersionNumber: true,
      createdByEmail: true,
      createdAt: true,
      content: true,
      product: { select: { nombreComercial: true } },
    },
  });
}
