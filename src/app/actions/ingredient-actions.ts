"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { recordAuditEvent } from "@/lib/audit/audit-service";
import {
  ingredientSchema,
  ingredientUpdateSchema,
  ingredientFilterSchema,
  nutritionalProfileSchema,
  nutrientValueSchema,
  createIngredientWithProfileSchema,
  normalizeSiesaCode,
} from "@/lib/validations/ingredients";
import { Role, Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const WRITE_ROLES: Role[] = ["ADMIN", "R_AND_D"];

export async function listIngredients(
  filter?: z.infer<typeof ingredientFilterSchema>
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const where: Prisma.IngredientWhereInput = {};

  if (filter?.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { genericName: { contains: filter.search, mode: "insensitive" } },
      { siesaCode: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  if (filter?.category) {
    where.category = filter.category;
  }

  if (filter?.isActive !== undefined) {
    where.isActive = filter.isActive;
  }

  if (filter?.siesaPrefix) {
    where.siesaCode = { startsWith: filter.siesaPrefix };
  }

  const ingredients = await db.ingredient.findMany({
    where,
    include: {
      profiles: {
        where: { isActive: true },
        include: {
          values: {
            include: {
              nutrient: true,
            },
          },
        },
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return ingredients;
}

export async function getIngredientById(id: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const ingredient = await db.ingredient.findUnique({
    where: { id },
    include: {
      profiles: {
        orderBy: { createdAt: "desc" },
        include: {
          values: {
            include: {
              nutrient: true,
            },
          },
        },
      },
      createdBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!ingredient) {
    throw new Error("Ingredient not found");
  }

  return ingredient;
}

export async function createIngredient(
  data: z.infer<typeof ingredientSchema>
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  // Check write permissions
  if (!hasRole(currentUser.role, WRITE_ROLES)) {
    throw new Error("Forbidden: insufficient permissions");
  }

  // Validate input
  const validated = ingredientSchema.parse(data);

  // Normalize SIESA code
  const normalizedCode = normalizeSiesaCode(validated.siesaCode);

  // Check for duplicate SIESA code
  const existing = await db.ingredient.findUnique({
    where: { siesaCode: normalizedCode },
  });

  if (existing) {
    throw new Error(
      `Ya existe un ingrediente con código SIESA ${normalizedCode}`
    );
  }

  // Create ingredient
  const ingredient = await db.ingredient.create({
    data: {
      ...validated,
      siesaCode: normalizedCode,
      createdById: currentUser.id,
    },
  });

  // Record audit event
  await recordAuditEvent({
    action: "INGREDIENT_CREATE",
    entity: "Ingredient",
    entityId: ingredient.id,
    metadata: {
      name: ingredient.name,
      siesaCode: ingredient.siesaCode,
      category: ingredient.category,
    },
  });

  revalidatePath("/ingredientes");
  return ingredient;
}

export async function createIngredientWithProfile(
  data: z.infer<typeof createIngredientWithProfileSchema>
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  // Check write permissions
  if (!hasRole(currentUser.role, WRITE_ROLES)) {
    throw new Error("Forbidden: insufficient permissions");
  }

  // Validate input
  const validated = createIngredientWithProfileSchema.parse(data);

  // Normalize SIESA code
  const normalizedCode = normalizeSiesaCode(validated.ingredient.siesaCode);

  // Check for duplicate SIESA code
  const existing = await db.ingredient.findUnique({
    where: { siesaCode: normalizedCode },
  });

  if (existing) {
    throw new Error(
      `Ya existe un ingrediente con código SIESA ${normalizedCode}`
    );
  }

  // Create ingredient with profile in transaction
  const result = await db.$transaction(async (tx) => {
    // Create ingredient
    const ingredient = await tx.ingredient.create({
      data: {
        ...validated.ingredient,
        siesaCode: normalizedCode,
        createdById: currentUser.id,
      },
    });

    // Create profile with nutrient values
    const profile = await tx.nutritionalProfile.create({
      data: {
        ingredientId: ingredient.id,
        source: validated.profile.source,
        sourceDetail: validated.profile.sourceDetail,
        validFrom: validated.profile.validFrom,
        referenceBase: validated.profile.referenceBase,
        isActive: true,
        createdById: currentUser.id,
        values: {
          create: validated.profile.nutrientValues.map((nv) => ({
            nutrientId: nv.nutrientId,
            value: nv.value,
            method: nv.method,
          })),
        },
      },
      include: {
        values: {
          include: {
            nutrient: true,
          },
        },
      },
    });

    return { ingredient, profile };
  });

  // Record audit event
  await recordAuditEvent({
    action: "INGREDIENT_CREATE_WITH_PROFILE",
    entity: "Ingredient",
    entityId: result.ingredient.id,
    metadata: {
      name: result.ingredient.name,
      siesaCode: result.ingredient.siesaCode,
      category: result.ingredient.category,
      profileSource: result.profile.source,
      nutrientCount: result.profile.values.length,
    },
  });

  revalidatePath("/ingredientes");
  return result;
}

export async function updateIngredient(
  id: string,
  data: z.infer<typeof ingredientUpdateSchema>
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  // Check write permissions
  if (!hasRole(currentUser.role, WRITE_ROLES)) {
    throw new Error("Forbidden: insufficient permissions");
  }

  // Validate input
  const validated = ingredientUpdateSchema.parse({ ...data, id });

  // Normalize SIESA code if provided
  if (validated.siesaCode) {
    validated.siesaCode = normalizeSiesaCode(validated.siesaCode);

    // Check for duplicate SIESA code (excluding current ingredient)
    const existing = await db.ingredient.findFirst({
      where: {
        siesaCode: validated.siesaCode,
        NOT: { id },
      },
    });

    if (existing) {
      throw new Error(
        `Ya existe un ingrediente con código SIESA ${validated.siesaCode}`
      );
    }
  }

  // Update ingredient
  const ingredient = await db.ingredient.update({
    where: { id },
    data: validated,
  });

  // Record audit event
  await recordAuditEvent({
    action: "INGREDIENT_UPDATE",
    entity: "Ingredient",
    entityId: ingredient.id,
    metadata: {
      name: ingredient.name,
      siesaCode: ingredient.siesaCode,
      updates: Object.keys(validated).filter((k) => k !== "id"),
    },
  });

  revalidatePath("/ingredientes");
  return ingredient;
}

export async function deactivateIngredient(id: string) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  // Check write permissions
  if (!hasRole(currentUser.role, WRITE_ROLES)) {
    throw new Error("Forbidden: insufficient permissions");
  }

  // Get ingredient for audit
  const ingredient = await db.ingredient.findUnique({
    where: { id },
  });

  if (!ingredient) {
    throw new Error("Ingredient not found");
  }

  // Deactivate ingredient (soft delete)
  const updated = await db.ingredient.update({
    where: { id },
    data: { isActive: false },
  });

  // Also deactivate all profiles
  await db.nutritionalProfile.updateMany({
    where: { ingredientId: id },
    data: { isActive: false },
  });

  // Record audit event
  await recordAuditEvent({
    action: "INGREDIENT_DEACTIVATE",
    entity: "Ingredient",
    entityId: updated.id,
    metadata: {
      name: ingredient.name,
      siesaCode: ingredient.siesaCode,
    },
  });

  revalidatePath("/ingredientes");
  return updated;
}

export async function createNutritionalProfile(
  ingredientId: string,
  data: {
    source: z.infer<typeof nutritionalProfileSchema>["source"];
    sourceDetail?: string;
    validFrom?: Date;
    nutrientValues: z.infer<typeof nutrientValueSchema>[];
  }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  // Check write permissions
  if (!hasRole(currentUser.role, WRITE_ROLES)) {
    throw new Error("Forbidden: insufficient permissions");
  }

  // Verify ingredient exists
  const ingredient = await db.ingredient.findUnique({
    where: { id: ingredientId },
  });

  if (!ingredient) {
    throw new Error("Ingredient not found");
  }

  // Validate input
  const validated = nutritionalProfileSchema.parse({
    ingredientId,
    ...data,
    validFrom: data.validFrom || new Date(),
  });

  // Create new profile and deactivate old one in transaction
  const result = await db.$transaction(async (tx) => {
    // Deactivate all existing profiles
    await tx.nutritionalProfile.updateMany({
      where: { ingredientId, isActive: true },
      data: { isActive: false },
    });

    // Create new profile
    const profile = await tx.nutritionalProfile.create({
      data: {
        ingredientId,
        source: validated.source,
        sourceDetail: validated.sourceDetail,
        validFrom: validated.validFrom,
        referenceBase: validated.referenceBase,
        isActive: true,
        createdById: currentUser.id,
        values: {
          create: data.nutrientValues.map((nv) => ({
            nutrientId: nv.nutrientId,
            value: nv.value,
            method: nv.method,
          })),
        },
      },
      include: {
        values: {
          include: {
            nutrient: true,
          },
        },
      },
    });

    return profile;
  });

  // Record audit event
  await recordAuditEvent({
    action: "NUTRITIONAL_PROFILE_CREATE",
    entity: "NutritionalProfile",
    entityId: result.id,
    metadata: {
      ingredientId,
      source: result.source,
      nutrientCount: result.values.length,
    },
  });

  revalidatePath("/ingredientes");
  return result;
}

export async function getNutrients() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const nutrients = await db.nutrient.findMany({
    orderBy: { displayName: "asc" },
  });

  return nutrients;
}

export async function getActiveNutrients() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    throw new Error("Unauthorized");
  }

  const nutrients = await db.nutrient.findMany({
    where: { isRequiredOnLabel: true },
    orderBy: { displayName: "asc" },
  });

  return nutrients;
}
