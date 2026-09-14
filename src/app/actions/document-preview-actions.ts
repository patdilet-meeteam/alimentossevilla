"use server";

import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { buildLegalIngredientsPreview } from "@/lib/documents/legal-ingredients-preview";

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
