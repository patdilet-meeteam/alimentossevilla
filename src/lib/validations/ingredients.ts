import { z } from "zod";

// Enum values based on Prisma schema
const IngredientCategoryEnum = z.enum([
  "CARNE",
  "MATERIA_SECA",
  "EMPAQUE",
  "ADITIVO",
  "OTRO",
]);

const NutrientSourceEnum = z.enum([
  "BANCO_ALIMENTOS",
  "LAB_PROVEEDOR",
  "LITERATURA",
]);

const __NutrientUnitEnum = z.enum(["G", "MG", "MCG", "KCAL", "KJ"]);

// SIESA code validation patterns
const SIESA_CODE_PATTERN = /^(11|12|13)\d{5}$/;

export const ingredientSchema = z.object({
  name: z
    .string()
    .min(1, "El nombre es requerido")
    .max(255, "El nombre no puede exceder 255 caracteres"),
  genericName: z
    .string()
    .max(255, "El nombre genérico no puede exceder 255 caracteres")
    .optional()
    .nullable(),
  siesaCode: z
    .string()
    .min(1, "El código SIESA es requerido")
    .max(20, "El código SIESA no puede exceder 20 caracteres")
    .refine(
      (val) => SIESA_CODE_PATTERN.test(val),
      "El código SIESA debe comenzar con 11, 12 o 13 seguido de 5 dígitos"
    ),
  category: IngredientCategoryEnum,
  isAllergen: z.boolean().default(false),
  allergenTags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export const ingredientUpdateSchema = ingredientSchema.partial().extend({
  id: z.string().min(1, "El ID es requerido"),
});

export const ingredientFilterSchema = z.object({
  search: z.string().optional(),
  category: IngredientCategoryEnum.optional(),
  isActive: z.boolean().optional(),
  siesaPrefix: z
    .string()
    .regex(/^(11|12|13)?$/, "Prefijo SIESA debe ser 11, 12 o 13")
    .optional(),
});

export const nutritionalProfileSchema = z.object({
  ingredientId: z.string().min(1, "El ingrediente es requerido"),
  source: NutrientSourceEnum,
  sourceDetail: z
    .string()
    .max(500, "El detalle de fuente no puede exceder 500 caracteres")
    .optional()
    .nullable(),
  validFrom: z.date().default(() => new Date()),
  referenceBase: z.string().default("100g"),
  isActive: z.boolean().default(true),
});

export const nutrientValueSchema = z.object({
  nutrientId: z.string().min(1, "El nutriente es requerido"),
  value: z
    .number()
    .finite("El valor debe ser un número finito")
    .min(0, "El valor no puede ser negativo"),
  method: z
    .string()
    .max(255, "El método no puede exceder 255 caracteres")
    .optional()
    .nullable(),
});

export const nutrientValueBatchSchema = z.array(nutrientValueSchema).min(1);

export const createIngredientWithProfileSchema = z.object({
  ingredient: ingredientSchema,
  profile: nutritionalProfileSchema.extend({
    nutrientValues: nutrientValueBatchSchema,
  }),
});

// Type exports
export type IngredientCategory = z.infer<typeof IngredientCategoryEnum>;
export type NutrientSource = z.infer<typeof NutrientSourceEnum>;
export type NutrientUnit = z.infer<typeof __NutrientUnitEnum>;
export type IngredientInput = z.infer<typeof ingredientSchema>;
export type IngredientUpdateInput = z.infer<typeof ingredientUpdateSchema>;
export type IngredientFilter = z.infer<typeof ingredientFilterSchema>;
export type NutritionalProfileInput = z.infer<typeof nutritionalProfileSchema>;
export type NutrientValueInput = z.infer<typeof nutrientValueSchema>;
export type CreateIngredientWithProfile = z.infer<typeof createIngredientWithProfileSchema>;

// Helper to normalize SIESA code
export function normalizeSiesaCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s/g, "");
}

// Helper to validate SIESA prefix
export function getSiesaPrefix(code: string): string | null {
  const normalized = normalizeSiesaCode(code);
  const match = normalized.match(/^(11|12|13)/);
  return match ? match[1] : null;
}

// Helper to categorize by SIESA prefix
export function categorizeBySiesaCode(code: string): IngredientCategory {
  const prefix = getSiesaPrefix(code);
  switch (prefix) {
    case "11":
      return "CARNE";
    case "12":
      return "MATERIA_SECA";
    case "13":
      return "EMPAQUE";
    default:
      return "OTRO";
  }
}
