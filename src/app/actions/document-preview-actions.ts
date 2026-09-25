"use server";

import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { buildLegalIngredientsPreview } from "@/lib/documents/legal-ingredients-preview";
import { calculateNutrition } from "@/lib/nutrition/nutrition-calculator";
import { evaluateWarningSeals } from "@/lib/nutrition/warning-seals";

const READ_ROLES: Role[] = [Role.ADMIN, Role.R_AND_D, Role.QUALITY, Role.VIEWER];

export async function listLegalIngredientsPreviews() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  requireRole(user.role, READ_ROLES);

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
    const nutritionInputs = version.ingredients.map((entry) => ({
      ingredientId: entry.ingredient.id,
      name: entry.ingredient.name,
      quantity: Number(entry.cantidadCanonica ?? entry.porcentajeParticipacion),
      nutrientsPer100g: Object.fromEntries((entry.ingredient.profiles[0]?.values ?? []).map((value) => [value.nutrient.key, Number(value.value)])),
    }));
    const requiredNutrients = ["SODIUM", "SUGAR_TOTAL", "FAT_SAT", "FAT_TRANS"];
    const nutritionReady = nutritionInputs.length > 0 && nutritionInputs.every((input) => requiredNutrients.every((key) => input.nutrientsPer100g[key] !== undefined));
    const nutrition = nutritionReady
      ? (() => {
        const calculation = calculateNutrition(nutritionInputs, 100);
        const seals = evaluateWarningSeals({ per100g: calculation.per100g, energyKcalPer100g: calculation.energyKcalPer100g });
        return {
          ready: true as const,
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
      : { ready: false as const, reason: "Faltan perfiles o nutrientes críticos para construir la tabla nutricional." };

    return [{
      productId: formulation.product.id,
      productCode: formulation.product.codigoInterno,
      productName: formulation.product.nombreComercial,
      versionNumber: version.numeroSecuencial,
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
