import { z } from "zod";

const ProductCategoryEnum = z.enum([
  "SALCHICHA",
  "CHORIZO",
  "JAMON",
  "MORTADELA",
  "TOCINETA",
  "PERRO_CALIENTE",
  "OTRO",
]);

// codigoInterno: slug único legible, sin espacios, sin acentos, max 60 chars.
const codigoInternoRegex = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/;

export const createProductSchema = z.object({
  codigoInterno: z
    .string()
    .min(2, "El código interno debe tener al menos 2 caracteres")
    .max(60, "El código interno no puede exceder 60 caracteres")
    .regex(
      codigoInternoRegex,
      "El código interno debe estar en minúsculas, sin espacios ni acentos, y usar solo letras, números y guiones (p.ej. salchicha-desayuno-premium)"
    ),
  nombreComercial: z
    .string()
    .min(1, "El nombre comercial es requerido")
    .max(255, "El nombre comercial no puede exceder 255 caracteres"),
  categoriaProducto: ProductCategoryEnum,
  descripcion: z
    .string()
    .max(2000, "La descripción no puede exceder 2000 caracteres")
    .optional()
    .nullable(),
});

export const updateProductSchema = createProductSchema.partial().extend({
  id: z.string().min(1, "El ID es requerido"),
  isActive: z.boolean().optional(),
});

export const productFilterSchema = z.object({
  search: z.string().optional(),
  categoriaProducto: ProductCategoryEnum.optional(),
  isActive: z.boolean().optional(),
});

// Presentation

const positiveDecimal = z
  .number()
  .finite("El valor debe ser un número finito")
  .min(0, "El valor no puede ser negativo")
  .max(100000, "El valor es demasiado grande");

const positiveInt = z
  .number()
  .int("Debe ser un número entero")
  .min(1, "Debe ser al menos 1")
  .max(10000, "El valor es demasiado grande");

export const createPresentationSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  gramajeNeto: positiveDecimal,
  unidadesPorEmpaque: positiveInt.optional().nullable(),
  porcionDeclarada: positiveDecimal.optional().nullable(),
  porcionPorEnvase: z
    .number()
    .finite("El valor debe ser un número finito")
    .min(0, "El valor no puede ser negativo")
    .max(10000, "El valor es demasiado grande")
    .optional()
    .nullable(),
});

export const updatePresentationSchema = createPresentationSchema.partial().extend({
  id: z.string().min(1, "El ID es requerido"),
  isActive: z.boolean().optional(),
});

// Formulation

export const getOrCreateFormulationSchema = z.object({
  productId: z.string().min(1, "El producto es requerido"),
  baseCalculo: positiveDecimal.optional().nullable(),
  rendimientoEsperado: z
    .number()
    .finite("El valor debe ser un número finito")
    .min(0)
    .max(1, "El rendimiento debe estar entre 0 y 1 (ej. 0.11 = 11% merma)")
    .optional()
    .nullable(),
});

// FormulationVersion

// Only used as a type alias — the actual state-guard lives in formulation-actions.ts
// against the Prisma enum. Defined here to keep the schema and type names aligned.
type FormulationVersionStatusValue = "DRAFT" | "IN_REVIEW" | "APPROVED" | "OBSOLETE";

export const createDraftVersionSchema = z.object({
  formulationId: z.string().min(1, "La formulación es requerida"),
  rendimientoEsperado: z
    .number()
    .finite()
    .min(0)
    .max(1)
    .optional()
    .nullable(),
});

export const updateDraftProcessLossSchema = z.object({
  formulationVersionId: z.string().min(1),
  rendimientoEsperado: z
    .number()
    .finite()
    .min(0)
    .max(1, "La merma debe estar entre 0 y 1 (ej. 0.11 = 11%)")
    .nullable(),
});

export const addIngredientToVersionSchema = z.object({
  formulationVersionId: z.string().min(1),
  ingredientId: z.string().min(1, "El ingrediente es requerido"),
  porcentajeParticipacion: z
    .number()
    .finite()
    .min(0, "El porcentaje no puede ser negativo")
    .max(100, "El porcentaje no puede exceder 100"),
  cantidadCanonica: positiveDecimal.optional().nullable(),
});

export const updateIngredientPercentageSchema = z.object({
  formulationVersionId: z.string().min(1),
  ingredientId: z.string().min(1),
  porcentajeParticipacion: z
    .number()
    .finite()
    .min(0)
    .max(100),
  cantidadCanonica: positiveDecimal.optional().nullable(),
});

export const removeIngredientFromVersionSchema = z.object({
  formulationVersionId: z.string().min(1),
  ingredientId: z.string().min(1),
});

// Workflow transitions

export const transitionVersionSchema = z.object({
  formulationVersionId: z.string().min(1),
  // Only meaningful for reject: free-text reason for the audit trail.
  motivo: z.string().max(500).optional().nullable(),
});

// Type exports

export type ProductCategory = z.infer<typeof ProductCategoryEnum>;
export type FormulationVersionStatus = FormulationVersionStatusValue;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductFilter = z.infer<typeof productFilterSchema>;
export type CreatePresentationInput = z.infer<typeof createPresentationSchema>;
export type UpdatePresentationInput = z.infer<typeof updatePresentationSchema>;
export type GetOrCreateFormulationInput = z.infer<typeof getOrCreateFormulationSchema>;
export type CreateDraftVersionInput = z.infer<typeof createDraftVersionSchema>;
export type AddIngredientToVersionInput = z.infer<typeof addIngredientToVersionSchema>;
export type UpdateIngredientPercentageInput = z.infer<typeof updateIngredientPercentageSchema>;
export type RemoveIngredientFromVersionInput = z.infer<typeof removeIngredientFromVersionSchema>;
export type TransitionVersionInput = z.infer<typeof transitionVersionSchema>;

/**
 * Helper to normalize codigoInterno the same way we recommend users to write it:
 * lowercase, accent-stripped, spaces -> hyphens.
 */
export function normalizeCodigoInterno(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
