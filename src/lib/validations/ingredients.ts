import { z } from "zod";

// Enum values based on Prisma schema (extended in SPEC-003 to include real customer categories)
const IngredientCategoryEnum = z.enum([
  // Legacy demo values (preserved)
  "CARNE",
  "MATERIA_SECA",
  "EMPAQUE",
  "ADITIVO",
  // Real customer categories (SPEC-003)
  "MPC",
  "MPNC",
  "PROTEINA",
  "AGUA",
  "CONDIMENTO_ESPECIA",
  "CONSERVANTE",
  "REGULADOR_ACIDEZ",
  "SABORIZANTE",
  "COLORANTE",
  "MPC_PROTEINA",
  // Catch-all
  "OTRO",
]);

const NutrientSourceEnum = z.enum([
  "BANCO_ALIMENTOS",
  "LAB_PROVEEDOR",
  "LITERATURA",
]);

const __NutrientUnitEnum = z.enum(["G", "MG", "MCG", "KCAL", "KJ"]);

// SIESA code validation patterns (relaxed in SPEC-003 to accept real customer codes).
// Two accepted shapes:
//   - Operational/Formulation: ^MP[A-Z]{2}\d{3}$  (e.g. MPCC010, MPII311)
//   - Accounting/Costs:        ^\d{7}$            (e.g. 1210005, 2903003)
// Both old demo format (8-digit ^1[123]\d{6}$) and any other alnum 6-8 char are tolerated via SIESA_CODE_PATTERN_RELAXED.
const SIESA_CODE_PATTERN_RELAXED = /^[A-Z0-9]{6,8}$/;
const SIESA_CODE_PATTERN_LEGACY = /^(11|12|13)\d{5}$/;

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
      (val) => SIESA_CODE_PATTERN_RELAXED.test(val) || SIESA_CODE_PATTERN_LEGACY.test(val),
      "El código SIESA debe ser alfanumérico de 6-8 caracteres (p.ej. MPCC010 o 1210005)"
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
    .regex(/^(11|12|13|MP)?$/, "Prefijo SIESA debe ser 11, 12, 13 o MP")
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
// SPEC-003: returns the first 2 chars (letters or digits) without assuming 11/12/13.
// Returns null for empty or too-short codes.
export function getSiesaPrefix(code: string): string | null {
  const normalized = normalizeSiesaCode(code);
  if (normalized.length < 2) return null;
  // Legacy demo codes start with 11/12/13; real customer codes start with MP or 2 digits.
  const match = normalized.match(/^([0-9]{2}|MP)/);
  return match ? match[1] : null;
}

// Helper to categorize by SIESA prefix.
// SPEC-003: maps real customer prefixes (MPCC/MPII/MPCP/MPPA/MPPS/MPPD/MPPO/MPPC/MPLP/MPLS/MPI/MPPK, 11-15)
// to the customer's own 10-category taxonomy. Legacy 11/12/13 still maps to demo categories.
export function categorizeBySiesaCode(code: string): IngredientCategory {
  const normalized = normalizeSiesaCode(code);
  const prefix2 = normalized.slice(0, 2);
  // Real customer MP-prefix buckets
  if (prefix2 === "MP") {
    const slot = normalized.slice(2, 4); // MP{CC,II,CP,PA,PS,PD,PO,PC,LP,LS,II,PK}
    switch (slot) {
      case "CC": // Carne de Cerdo (MPC)
      case "CP": // Carne de Pollo (MPC)
        return "MPC";
      case "II": // Insumos industriales (MPNC)
      case "PD": // Productos deshidratados (MPNC)
        return "MPNC";
      case "PA": // Proteínas / almidones
      case "PK": // Proteínas / condimentos
        return "PROTEINA";
      case "PS": // Productos de sal / sales
        return "MPC_PROTEINA";
      case "PO": // Polvo / oleorresinas / colorantes
        return "COLORANTE";
      case "PC": // Preparados / condimentos complejos
      case "LP": // Líquidos / preparados
      case "LS": // Líquidos / saborizantes
        return "SABORIZANTE";
      default:
        return "MPNC";
    }
  }
  // Legacy 8-digit demo codes
  if (/^11/.test(normalized)) return "CARNE";
  if (/^12/.test(normalized)) return "MATERIA_SECA";
  if (/^13/.test(normalized)) return "EMPAQUE";
  if (/^14/.test(normalized)) return "ADITIVO";
  if (/^15/.test(normalized)) return "EMPAQUE";
  return "OTRO";
}
