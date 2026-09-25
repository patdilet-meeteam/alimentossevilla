"use server";

import { NutrientUnit, Prisma, Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { assessNutritionReadiness } from "@/lib/nutrition/nutrition-readiness";
import { buildCtnImportPlan, parseCtnCsv } from "@/lib/nutrition/ctn-import";
import { calculateNutrition } from "@/lib/nutrition/nutrition-calculator";
import { evaluateWarningSeals, formatActiveSeals, getSealText, type WarningSeal } from "@/lib/nutrition/warning-seals";
import { parseNutritionalBankWorkbook } from "@/lib/nutrition/nutritional-bank-import";
import { parseJuneSalchichaMasterWorkbook } from "@/lib/nutrition/june-salchicha-master-import";
import { normalizeCostDescription } from "@/lib/costs/cost-import-parser";
import { revalidatePath } from "next/cache";

const READ_ROLES: Role[] = [Role.ADMIN, Role.R_AND_D, Role.QUALITY, Role.VIEWER];
const WRITE_ROLES: Role[] = [Role.ADMIN, Role.R_AND_D];

const CTN_NAME_ALIASES: Record<string, string> = {
  [normalizeCostDescription("COLOR NATURAL LINICOL")]: normalizeCostDescription("COLOR NATURAL ROJO AC150"),
  [normalizeCostDescription("HUMO CHARDEX EN POLVO")]: normalizeCostDescription("HUMO TRUSMOKE OIL EX"),
  [normalizeCostDescription("TOCINO CINTA")]: normalizeCostDescription("TOCINO NACIONAL"),
  [normalizeCostDescription("REPELE FAZÁN")]: normalizeCostDescription("REPELE CHARQUEADO"),
  [normalizeCostDescription("COLOR NATURAL NARANJA PR801 WD.")]: normalizeCostDescription("COLOR NATURAL NARANJA PR801WD"),
  [normalizeCostDescription("SAL REDUCIDA EN SODIO.")]: normalizeCostDescription("SAL REDUCIDA EN SODIO 60/40"),
  [normalizeCostDescription("MEZCLA DE FOSFATOS SUPRA MEAT F451")]: normalizeCostDescription("SUPRA MEAT F451"),
  [normalizeCostDescription("CEBOLLA EN POLVO B.1.")]: normalizeCostDescription("CEBOLLA EN POLVO"),
  [normalizeCostDescription("PIMIENTA NEGRA MOLIDA ESP. 0.9 MM.")]: normalizeCostDescription("PIMIENTA NEGRA MOLIDA"),
};

function canonicalCtnName(name: string): string {
  const normalized = normalizeCostDescription(name);
  return CTN_NAME_ALIASES[normalized] ?? normalized;
}

const BANK_NUTRIENT_DEFINITIONS: Record<string, { unit: NutrientUnit; displayName: string; isRequiredOnLabel: boolean }> = {
  MOISTURE: { unit: "G", displayName: "Humedad", isRequiredOnLabel: false },
  FAT_TOTAL: { unit: "G", displayName: "Grasas Totales", isRequiredOnLabel: true },
  FAT_SAT: { unit: "G", displayName: "Grasas Saturadas", isRequiredOnLabel: true },
  FAT_TRANS: { unit: "G", displayName: "Grasas Trans", isRequiredOnLabel: true },
  CHOLESTEROL: { unit: "MG", displayName: "Colesterol", isRequiredOnLabel: false },
  PROTEIN: { unit: "G", displayName: "Proteína", isRequiredOnLabel: true },
  CARBS_TOTAL: { unit: "G", displayName: "Carbohidratos Totales", isRequiredOnLabel: true },
  SUGAR_TOTAL: { unit: "G", displayName: "Azúcares Totales", isRequiredOnLabel: true },
  SUGAR_ADDED: { unit: "G", displayName: "Azúcares Añadidos", isRequiredOnLabel: true },
  STARCH: { unit: "G", displayName: "Almidón", isRequiredOnLabel: false },
  FIBER: { unit: "G", displayName: "Fibra Dietaria", isRequiredOnLabel: true },
  SODIUM: { unit: "MG", displayName: "Sodio", isRequiredOnLabel: true },
  CALCIUM: { unit: "MG", displayName: "Calcio", isRequiredOnLabel: false },
  IRON: { unit: "MG", displayName: "Hierro", isRequiredOnLabel: false },
  ZINC: { unit: "MG", displayName: "Zinc", isRequiredOnLabel: false },
  VITAMIN_A: { unit: "MCG", displayName: "Vitamina A", isRequiredOnLabel: false },
  VITAMIN_D: { unit: "MCG", displayName: "Vitamina D", isRequiredOnLabel: false },
};

// Confirmed functional rule: TN OFICIAL omits trans fat when the source
// reports no trans fat; persist an explicit zero instead of treating absence
// as an unreviewed profile.
const CONFIRMED_BANK_DEFAULTS: Record<string, number> = { FAT_TRANS: 0 };

export async function listNutritionReadiness() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, READ_ROLES);

  const formulations = await db.formulation.findMany({
    include: {
      product: { select: { id: true, codigoInterno: true, nombreComercial: true } },
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
                  siesaCode: true,
                  profiles: {
                    where: { isActive: true },
                    select: { _count: { select: { values: true } } },
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
    const ingredients = version.ingredients.map(({ ingredient }) => assessNutritionReadiness({
      ingredientId: ingredient.id,
      ingredientName: ingredient.name,
      siesaCode: ingredient.siesaCode,
      activeProfiles: ingredient.profiles.map((profile) => ({ valueCount: profile._count.values })),
    }));
    return [{
      formulationId: formulation.id,
      productId: formulation.product.id,
      productCode: formulation.product.codigoInterno,
      productName: formulation.product.nombreComercial,
      versionNumber: version.numeroSecuencial,
      ingredients,
      issueCount: ingredients.reduce((total, ingredient) => total + ingredient.issues.length, 0),
    }];
  });
}

/**
 * Imports a CTN CSV into a new DRAFT only when every source row maps to an
 * existing active ingredient. It never creates ingredients or profiles from a
 * recipe file, avoiding silent nutritional source substitutions.
 */
export async function importCtnCsvToDraft(formData: FormData): Promise<{ ok: boolean; message: string; versionId?: string }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const formulationId = formData.get("formulationId");
  const file = formData.get("file");
  if (typeof formulationId !== "string" || !formulationId) throw new Error("La formulación es requerida.");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) throw new Error("Seleccione un archivo CTN CSV.");
  if (file.size === 0 || file.size > 2 * 1024 * 1024) throw new Error("El CTN debe pesar entre 1 byte y 2 MB.");

  const plan = buildCtnImportPlan(parseCtnCsv(await file.text()));
  const formulation = await db.formulation.findUnique({
    where: { id: formulationId },
    include: { versions: { orderBy: { numeroSecuencial: "desc" }, take: 1 } },
  });
  if (!formulation) throw new Error("Formulación no encontrada.");

  const ingredients = await db.ingredient.findMany({
    where: { isActive: true },
    select: { id: true, siesaCode: true, name: true, genericName: true },
  });
  const byCode = new Map(ingredients.map((ingredient) => [ingredient.siesaCode.toUpperCase(), ingredient]));
  const byName = new Map<string, typeof ingredients[number]>();
  for (const ingredient of ingredients) {
    byName.set(normalizeCostDescription(ingredient.name), ingredient);
    if (ingredient.genericName) byName.set(normalizeCostDescription(ingredient.genericName), ingredient);
  }

  const unresolved = plan.filter((row) => !((row.sourceCode && byCode.get(row.sourceCode.toUpperCase())) || byName.get(canonicalCtnName(row.sourceName))));
  if (unresolved.length > 0) {
    return {
      ok: false,
      message: `No se creó el borrador: faltan ${unresolved.length} ingrediente(s) en el maestro (${unresolved.map((row) => row.sourceName).join(", ")}).`,
    };
  }

  const resolvedPlan = new Map<string, { ingredientId: string; percentage: Prisma.Decimal; quantity: Prisma.Decimal; sourceRows: number[] }>();
  for (const row of plan) {
    const ingredient = (row.sourceCode && byCode.get(row.sourceCode.toUpperCase())) || byName.get(canonicalCtnName(row.sourceName));
    if (!ingredient) throw new Error(`Ingrediente no resuelto: ${row.sourceName}`);
    const current = resolvedPlan.get(ingredient.id);
    if (current) {
      current.quantity = current.quantity.plus(row.quantity);
      current.percentage = current.percentage.plus(row.percentage);
      current.sourceRows.push(row.sourceRow);
    } else resolvedPlan.set(ingredient.id, { ingredientId: ingredient.id, quantity: row.quantity, percentage: row.percentage, sourceRows: [row.sourceRow] });
  }

  const version = await db.$transaction(async (tx) => tx.formulationVersion.create({
    data: {
      formulationId: formulation.id,
      numeroSecuencial: (formulation.versions[0]?.numeroSecuencial ?? 0) + 1,
      estado: "DRAFT",
      ingredients: {
        create: [...resolvedPlan.values()].map((row) => ({ ingredientId: row.ingredientId, porcentajeParticipacion: row.percentage, cantidadCanonica: row.quantity })),
      },
    },
  }));

  await db.auditEvent.create({
    data: {
      actorId: user.id,
      actorEmail: user.email,
      action: "formulation_version.ctn_import",
      entity: "FormulationVersion",
      entityId: version.id,
      metadata: {
        formulationId: formulation.id,
        sourceFileName: file.name,
        ingredientCount: plan.length,
        persistedIngredientCount: resolvedPlan.size,
        consolidatedSourceRows: [...resolvedPlan.values()].filter((row) => row.sourceRows.length > 1).map((row) => row.sourceRows),
        totalCanonicalQuantity: plan.reduce((sum, row) => sum.plus(row.quantity), new Prisma.Decimal(0)).toString(),
        percentageTotal: plan.reduce((sum, row) => sum.plus(row.percentage), new Prisma.Decimal(0)).toString(),
        aliasesApplied: Object.keys(CTN_NAME_ALIASES),
      },
    },
  });

  revalidatePath(`/productos/${formulation.productId}`);
  revalidatePath("/normativa");
  return { ok: true, versionId: version.id, message: `CTN importado en borrador v${version.numeroSecuencial}.` };
}

/**
 * Imports the official nutritional bank only into existing active master
 * ingredients. The source workbook has no SIESA identifiers, therefore an
 * unmatched row is reported and ignored rather than creating a synthetic
 * ingredient. Existing laboratory/literature profiles are never replaced.
 */
export async function importNutritionalBankProfiles(formData: FormData): Promise<{ ok: boolean; message: string; importedCount?: number }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const file = formData.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Seleccione el Banco Nutricional en formato XLSX.");
  }
  if (file.size === 0 || file.size > 10 * 1024 * 1024) throw new Error("El Banco Nutricional debe pesar entre 1 byte y 10 MB.");

  const bankRows = await parseNutritionalBankWorkbook(Buffer.from(await file.arrayBuffer()));
  const ingredients = await db.ingredient.findMany({
    where: { isActive: true },
    include: { profiles: { where: { isActive: true }, select: { id: true, source: true } } },
  });
  const byName = new Map<string, typeof ingredients>();
  for (const ingredient of ingredients) {
    for (const name of [ingredient.name, ingredient.genericName].filter(Boolean) as string[]) {
      const normalized = normalizeCostDescription(name);
      const candidates = byName.get(normalized) ?? [];
      if (!candidates.some((candidate) => candidate.id === ingredient.id)) {
        byName.set(normalized, [...candidates, ingredient]);
      }
    }
  }

  const matched = bankRows.flatMap((row) => {
    const candidates = byName.get(normalizeCostDescription(row.ingredientName)) ?? [];
    return candidates.length === 1 ? [{ row, ingredient: candidates[0] }] : [];
  });
  const ambiguous = bankRows.filter((row) => (byName.get(normalizeCostDescription(row.ingredientName)) ?? []).length > 1);
  const matchedIngredientIds = new Set<string>();
  const duplicateRows = matched.filter(({ ingredient }) => {
    if (matchedIngredientIds.has(ingredient.id)) return true;
    matchedIngredientIds.add(ingredient.id);
    return false;
  });
  const protectedProfiles = matched.filter(({ ingredient }) => ingredient.profiles.some((profile) => profile.source !== "BANCO_ALIMENTOS"));

  if (ambiguous.length > 0 || duplicateRows.length > 0 || protectedProfiles.length > 0) {
    const issues = [
      ambiguous.length ? `${ambiguous.length} nombre(s) ambiguo(s)` : null,
      duplicateRows.length ? `${duplicateRows.length} fila(s) duplicada(s) para un mismo ingrediente` : null,
      protectedProfiles.length ? `${protectedProfiles.length} perfil(es) de laboratorio o literatura protegido(s)` : null,
    ].filter(Boolean).join("; ");
    return { ok: false, message: `No se modificó ningún perfil: ${issues}. Corrija el maestro o use la edición manual trazable.` };
  }
  if (matched.length === 0) {
    return { ok: false, message: "No se modificó ningún perfil: ninguna fila del Banco coincide de forma única con un ingrediente maestro activo." };
  }

  const nutrientKeys = [...new Set([
    ...matched.flatMap(({ row }) => Object.keys(row.valuesPer100g)),
    ...Object.keys(CONFIRMED_BANK_DEFAULTS),
  ])];
  const defaultedNutrientCount = matched.reduce(
    (count, { row }) => count + Object.keys(CONFIRMED_BANK_DEFAULTS).filter((key) => row.valuesPer100g[key] === undefined).length,
    0,
  );
  await db.$transaction(async (tx) => {
    const nutrients = new Map<string, { id: string }>();
    for (const key of nutrientKeys) {
      const definition = BANK_NUTRIENT_DEFINITIONS[key];
      if (!definition) throw new Error(`Nutriente no soportado: ${key}`);
      const nutrient = await tx.nutrient.upsert({ where: { key }, update: {}, create: { key, ...definition } });
      nutrients.set(key, nutrient);
    }
    for (const { row, ingredient } of matched) {
      await tx.nutritionalProfile.updateMany({ where: { ingredientId: ingredient.id, isActive: true }, data: { isActive: false } });
      await tx.nutritionalProfile.create({
        data: {
          ingredientId: ingredient.id,
          source: "BANCO_ALIMENTOS",
          sourceDetail: `Banco Nutricional / TN OFICIAL${row.sourceDetail ? ` · ${row.sourceDetail}` : ""}`,
          referenceBase: "100g",
          isActive: true,
          createdById: user.id,
          values: { create: nutrientKeys.map((key) => ({
            nutrientId: nutrients.get(key)!.id,
            value: row.valuesPer100g[key] ?? CONFIRMED_BANK_DEFAULTS[key],
            method: row.valuesPer100g[key] === undefined
              ? `TN OFICIAL fila ${row.sourceRow} · valor por defecto confirmado`
              : `TN OFICIAL fila ${row.sourceRow}`,
          })) },
        },
      });
    }
  });

  const unmatchedCount = bankRows.length - matched.length;
  await db.auditEvent.create({
    data: {
      actorId: user.id,
      actorEmail: user.email,
      action: "nutritional_profile.bank_import",
      entity: "NutritionalProfile",
      metadata: { sourceFileName: file.name, sheet: "TN OFICIAL", importedCount: matched.length, unmatchedCount, defaultedNutrientCount, defaults: CONFIRMED_BANK_DEFAULTS },
    },
  });
  revalidatePath("/ingredientes");
  revalidatePath("/normativa");
  return { ok: true, importedCount: matched.length, message: `Se versionaron ${matched.length} perfil(es) desde TN OFICIAL.${defaultedNutrientCount ? ` Se completaron ${defaultedNutrientCount} valor(es) FAT_TRANS en cero según la regla confirmada.` : ""}${unmatchedCount ? ` Se omitieron ${unmatchedCount} fila(s) sin ingrediente maestro coincidente.` : ""}` };
}

/**
 * Bootstrap only the 18 material rows in the confirmed June Salchicha
 * Desayuno pilot. It refuses conflicts with an existing SIESA code. It may
 * reconcile only the provisional rows created by the cost loader (category
 * OTRO, no generic name, and matching or placeholder description).
 */
export async function importJuneSalchichaMaster(formData: FormData): Promise<{ ok: boolean; message: string; createdCount?: number }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, WRITE_ROLES);

  const file = formData.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".xlsx")) {
    throw new Error("Seleccione el archivo de junio en formato XLSX.");
  }
  if (file.size === 0 || file.size > 10 * 1024 * 1024) throw new Error("El archivo de junio debe pesar entre 1 byte y 10 MB.");

  const rows = await parseJuneSalchichaMasterWorkbook(Buffer.from(await file.arrayBuffer()));
  const existing = await db.ingredient.findMany({ where: { siesaCode: { in: rows.map((row) => row.siesaCode) } } });
  const byCode = new Map(existing.map((ingredient) => [ingredient.siesaCode, ingredient]));
  const canReconcile = (ingredient: typeof existing[number], row: typeof rows[number]) => ingredient.category === "OTRO"
    && ingredient.genericName === null
    && (ingredient.name === row.name || /^Fila \d+ sin descripción$/.test(ingredient.name));
  const conflicts = rows.filter((row) => {
    const ingredient = byCode.get(row.siesaCode);
    return ingredient && (!ingredient.isActive || !canReconcile(ingredient, row));
  });
  if (conflicts.length > 0) {
    return { ok: false, message: `No se modificó el maestro: ${conflicts.length} código(s) SIESA ya existen con datos diferentes o están inactivos (${conflicts.map((row) => row.siesaCode).join(", ")}).` };
  }
  const missing = rows.filter((row) => !byCode.has(row.siesaCode));
  const provisional = rows.filter((row) => {
    const ingredient = byCode.get(row.siesaCode);
    return ingredient ? canReconcile(ingredient, row) : false;
  });
  if (missing.length === 0 && provisional.length === 0) return { ok: true, createdCount: 0, message: "El maestro piloto ya contiene las 18 materias primas sin conflictos." };

  await db.$transaction(async (tx) => {
    await tx.ingredient.createMany({
      data: missing.map((row) => ({
        siesaCode: row.siesaCode,
        name: row.name,
        genericName: row.nutritionalBankName,
        category: row.category,
        isActive: true,
        pendingReview: false,
        createdById: user.id,
      })),
    });
    for (const row of provisional) {
      await tx.ingredient.update({
        where: { siesaCode: row.siesaCode },
        data: { name: row.name, genericName: row.nutritionalBankName, category: row.category, pendingReview: false },
      });
    }
    await tx.auditEvent.create({
      data: {
        actorId: user.id,
        actorEmail: user.email,
        action: "ingredient.june_pilot_import",
        entity: "Ingredient",
        metadata: { sourceFileName: file.name, sheet: "SCHA DESAYUNO 480 G -14 UND", createdCount: missing.length, reconciledCount: provisional.length, siesaCodes: rows.map((row) => row.siesaCode) },
      },
    });
  });
  revalidatePath("/ingredientes");
  return { ok: true, createdCount: missing.length, message: `Se crearon ${missing.length} ingrediente(s) y se reconciliaron ${provisional.length} registro(s) provisionales. El código SIESA 1250004 usa la equivalencia confirmada con NaranjaPR80J WD para su vínculo nutricional.` };
}

/**
 * Calcula la información nutricional y evalúa sellos de advertencia para una versión
 * de formulación aprobada. Requiere la versión en estado APPROVED.
 */
export async function calculateFormulationSeals(
  versionId: string,
  portionGrams: number = 100,
): Promise<{
  ok: boolean;
  message: string;
  nutrition?: {
    per100g: Record<string, number>;
    perPortion: Record<string, number>;
    energyKcalPer100g: number;
    energyKcalPerPortion: number;
  };
  seals?: {
    activeSeals: WarningSeal[];
    activeSealsFormatted: string;
    sealTexts: string[];
    details: {
      sodium: { valuePer100g: number; threshold: number; exceeds: boolean };
      sugars: { valuePer100g: number; percentageOfEnergy: number; threshold: number; exceeds: boolean };
      fatSaturated: { valuePer100g: number; percentageOfEnergy: number; threshold: number; exceeds: boolean };
      fatTrans: { valuePer100g: number; percentageOfEnergy: number; threshold: number; exceeds: boolean };
    };
  };
  readiness?: { ready: boolean; issues: string[] };
}> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, READ_ROLES);

  // Obtener la versión de formulación con ingredientes y perfiles nutricionales activos
  const version = await db.formulationVersion.findUnique({
    where: { id: versionId },
    include: {
      formulation: {
        include: {
          product: { select: { id: true, nombreComercial: true } },
        },
      },
      ingredients: {
        include: {
          ingredient: {
            include: {
              profiles: {
                where: { isActive: true },
                include: {
                  values: {
                    include: { nutrient: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!version) {
    return { ok: false, message: "Versión de formulación no encontrada." };
  }

  if (version.estado !== "APPROVED") {
    return { ok: false, message: `La versión ${version.numeroSecuencial} no está aprobada (estado: ${version.estado}). Los sellos solo se evalúan en versiones aprobadas.` };
  }

  // Verificar que cada ingrediente tenga perfil activo con valores
  const readinessIssues: string[] = [];
  const ingredientsWithProfiles = version.ingredients.filter((fi) => {
    const activeProfiles = fi.ingredient.profiles.filter((p) => p.isActive);
    if (activeProfiles.length === 0) {
      readinessIssues.push(`Falta perfil nutricional para: ${fi.ingredient.name}`);
      return false;
    }
    if (activeProfiles.length > 1) {
      readinessIssues.push(`Perfiles múltiples para: ${fi.ingredient.name}`);
      return false;
    }
    const profile = activeProfiles[0];
    const hasRequiredNutrients = profile.values.some((v) => v.nutrient.key === "SODIUM")
      && profile.values.some((v) => v.nutrient.key === "SUGAR_TOTAL")
      && profile.values.some((v) => v.nutrient.key === "FAT_SAT")
      && profile.values.some((v) => v.nutrient.key === "FAT_TRANS");
    if (!hasRequiredNutrients) {
      readinessIssues.push(`Perfil incompleto para: ${fi.ingredient.name}`);
      return false;
    }
    return true;
  });

  if (readinessIssues.length > 0) {
    return {
      ok: false,
      message: "No se puede calcular sellos: la formulación tiene perfiles nutricionales faltantes o incompletos.",
      readiness: { ready: false, issues: readinessIssues },
    };
  }

  if (ingredientsWithProfiles.length === 0) {
    return { ok: false, message: "Ningún ingrediente tiene perfil nutricional activo con los nutrientes requeridos para calcular sellos.", readiness: { ready: false, issues: readinessIssues } };
  }

  // Preparar datos para el calculador
  const nutritionInputs = ingredientsWithProfiles.map((fi) => {
    const profile = fi.ingredient.profiles.find((p) => p.isActive)!;
    const nutrientsPer100g: Record<string, number> = {};
    for (const v of profile.values) {
      nutrientsPer100g[v.nutrient.key] = Number(v.value);
    }
    return {
      ingredientId: fi.ingredientId,
      name: fi.ingredient.name,
      quantity: Number(fi.cantidadCanonica ?? fi.porcentajeParticipacion),
      nutrientsPer100g,
    };
  });

  // Calcular nutrición
  const calculation = calculateNutrition(nutritionInputs, portionGrams);

  // Evaluar sellos
  const per100gRecord: Record<string, Prisma.Decimal> = {};
  for (const [key, value] of Object.entries(calculation.per100g)) {
    per100gRecord[key] = value;
  }

  const sealEvaluation = evaluateWarningSeals({
    per100g: per100gRecord,
    energyKcalPer100g: calculation.energyKcalPer100g,
  });

  // Formatear resultados
  const sealTexts = sealEvaluation.activeSeals.map(getSealText);

  return {
    ok: true,
    message: sealEvaluation.activeSeals.length > 0
      ? `Evaluación completada: ${formatActiveSeals(sealEvaluation.activeSeals)}`
      : "Sin sellos de advertencia.",
    nutrition: {
      per100g: Object.fromEntries(
        Object.entries(calculation.per100g).map(([k, v]) => [k, Number(v)]),
      ),
      perPortion: Object.fromEntries(
        Object.entries(calculation.perPortion).map(([k, v]) => [k, Number(v)]),
      ),
      energyKcalPer100g: Number(calculation.energyKcalPer100g),
      energyKcalPerPortion: Number(calculation.energyKcalPerPortion),
    },
    seals: {
      activeSeals: sealEvaluation.activeSeals,
      activeSealsFormatted: formatActiveSeals(sealEvaluation.activeSeals),
      sealTexts,
      details: {
        sodium: {
          valuePer100g: Number(sealEvaluation.nutrients.sodium.valuePer100g),
          threshold: sealEvaluation.nutrients.sodium.threshold,
          exceeds: sealEvaluation.nutrients.sodium.exceeds,
        },
        sugars: {
          valuePer100g: Number(sealEvaluation.nutrients.sugars.valuePer100g),
          percentageOfEnergy: Number(sealEvaluation.nutrients.sugars.percentageOfEnergy),
          threshold: sealEvaluation.nutrients.sugars.threshold,
          exceeds: sealEvaluation.nutrients.sugars.exceeds,
        },
        fatSaturated: {
          valuePer100g: Number(sealEvaluation.nutrients.fatSaturated.valuePer100g),
          percentageOfEnergy: Number(sealEvaluation.nutrients.fatSaturated.percentageOfEnergy),
          threshold: sealEvaluation.nutrients.fatSaturated.threshold,
          exceeds: sealEvaluation.nutrients.fatSaturated.exceeds,
        },
        fatTrans: {
          valuePer100g: Number(sealEvaluation.nutrients.fatTrans.valuePer100g),
          percentageOfEnergy: Number(sealEvaluation.nutrients.fatTrans.percentageOfEnergy),
          threshold: sealEvaluation.nutrients.fatTrans.threshold,
          exceeds: sealEvaluation.nutrients.fatTrans.exceeds,
        },
      },
    },
    readiness: { ready: readinessIssues.length === 0, issues: readinessIssues },
  };
}
