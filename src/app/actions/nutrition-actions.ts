"use server";

import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { requireRole } from "@/lib/auth/roles";
import { db } from "@/lib/db";
import { assessNutritionReadiness } from "@/lib/nutrition/nutrition-readiness";

const READ_ROLES: Role[] = [Role.ADMIN, Role.R_AND_D, Role.QUALITY, Role.VIEWER];

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
