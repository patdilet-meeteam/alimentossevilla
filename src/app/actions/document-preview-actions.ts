"use server";

import { Prisma, Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { buildLegalIngredientsPreview } from "@/lib/documents/legal-ingredients-preview";
import { globalProfileIdentityIssue } from "@/lib/nutrition/source-identity-guards";
import { getSourceRecipeEvidence } from "@/lib/formulations/source-recipe-evidence";
import { getKnownRecipeConflict } from "@/lib/nutrition/recipe-source-consistency";
import { calculateNutrition } from "@/lib/nutrition/nutrition-calculator";
import { evaluateWarningSeals } from "@/lib/nutrition/warning-seals";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { recordAuditEvent } from "@/lib/audit/audit-service";
import { getCurrentRegulatoryParameters } from "@/lib/nutrition/regulatory-parameters";
import { resolveCtnNutritionSnapshot } from "@/lib/nutrition/ctn-import";

import { readVersionSpeciesClassifications } from "@/lib/formulations/source-working-review";
import { evaluateSpeciesFatRule } from "@/lib/nutrition/species-fat-rule";

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
          _count: { select: { bundleVersions: true } },
          presentations: {
            where: { isActive: true },
            select: { id: true, gramajeNeto: true, porcionDeclarada: true },
            orderBy: { gramajeNeto: "asc" },
          },
        },
      },
      versions: {
        where: { estado: "APPROVED" },
        orderBy: [{validFrom:{sort:"desc",nulls:"last"}},{aprobadaEn:{sort:"desc",nulls:"last"}},{numeroSecuencial:"desc"}],
        take: 1,
        include: {
          ingredients: {
            include: {
              ingredient: {
                select: {
                  id: true,
                  name: true,
                  genericName: true,
                  siesaCode: true,
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
    const sourceEvidence = getSourceRecipeEvidence(version.sourceRecipeSnapshot,version.ingredients.map(r=>({ingredientId:r.ingredientId,percentage:r.porcentajeParticipacion.toString(),quantity:r.cantidadCanonica?.toString()??null})),version.sourceReviewSnapshot);
    const recipeConflict = getKnownRecipeConflict(formulation.product.codigoInterno, version.ingredients.map((row) => ({ siesaCode: row.ingredient.siesaCode, percentage: row.porcentajeParticipacion.toString() })));
    const identityIssue = ctnInputs.status === "ready" ? null : version.ingredients.map(entry => globalProfileIdentityIssue(entry.ingredient.siesaCode)).find(Boolean);
    const quantityCount=version.ingredients.filter(r=>r.cantidadCanonica!==null).length;
    const mixedQuantityBasis=quantityCount>0&&quantityCount!==version.ingredients.length;
    const isBundle = formulation.product._count.bundleVersions > 0;
    const nutritionReady = !isBundle && !mixedQuantityBasis && !identityIssue && !sourceEvidence?.issues.length && !recipeConflict && ctnInputs.status !== "invalid"
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
          calculationSource: ctnInputs.status === "ready" ? (ctnInputs.source === "SOURCE_REVIEW" ? "SOURCE_REVIEW" as const : "EXCEL_CTN" as const) : "BANCO_NUTRICIONAL" as const,
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
      : { ready: false as const, reason: isBundle ? "Etiqueta agregada bloqueada: una agrupación requiere pesos verificables, productos miembros y perfiles completos; aprobar su composición no certifica su nutrición global." : sourceEvidence?.issues.length ? `Receta fuente pendiente: ${sourceEvidence.issues.join(", ")}` : mixedQuantityBasis ? "Complete las cantidades canónicas; no se mezclan unidades con porcentajes." : identityIssue ?? recipeConflict ?? (ctnInputs.status === "invalid" ? ctnInputs.reason : "Faltan perfiles o nutrientes críticos para construir la tabla nutricional.") };

    const positiveIngredients = version.ingredients.filter(entry => new Prisma.Decimal(entry.porcentajeParticipacion).gt(0));
    const classifications = readVersionSpeciesClassifications(version.sourceReviewSnapshot, positiveIngredients.map(entry => ({id:entry.ingredient.id,name:entry.ingredient.name,siesaCode:entry.ingredient.siesaCode})));
    const speciesFat = evaluateSpeciesFatRule(positiveIngredients.map(entry => classifications[entry.ingredient.id] ?? {ingredientId:entry.ingredient.id,role:"UNKNOWN",species:null,evidence:null}));
    return [{
      speciesFat: {...speciesFat},
      speciesClassifications: positiveIngredients.map(entry => ({... (classifications[entry.ingredient.id] ?? {ingredientId:entry.ingredient.id,role:"UNKNOWN" as const,species:null,evidence:null})})),
      documentReady: nutrition.ready && ["EXCEL_CTN","SOURCE_REVIEW"].includes(nutrition.calculationSource) && speciesFat.status !== "PENDING_CLASSIFICATION",
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
  if (!preview.nutrition.ready || !["EXCEL_CTN","SOURCE_REVIEW"].includes(preview.nutrition.calculationSource)) {
    throw new Error("Solo se puede guardar una versión preliminar cuando la salida nutricional proviene de una captura CTN o una copia conciliada y aprobada.");
  }

  if (!preview.documentReady) throw new Error("Complete y guarde la clasificación grasa/especie con evidencia en una copia de trabajo antes de guardar el documento.");

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
