import type { NutrientUnit } from "@prisma/client";

// Catálogo de nutrientes obligatorios según normativa y DATA-SOURCES.md.
// Lo comparten el seed de desarrollo y el bootstrap de producción: es dato
// de referencia, no de demostración.
export const NUTRIENTS_SEED = [
  { key: "ENERGY_KCAL", unit: "KCAL" as NutrientUnit, displayName: "Energía", isRequiredOnLabel: true },
  { key: "ENERGY_KJ", unit: "KJ" as NutrientUnit, displayName: "Energía (kJ)", isRequiredOnLabel: false },
  { key: "FAT_TOTAL", unit: "G" as NutrientUnit, displayName: "Grasas Totales", isRequiredOnLabel: true },
  { key: "FAT_SAT", unit: "G" as NutrientUnit, displayName: "Grasas Saturadas", isRequiredOnLabel: true },
  { key: "FAT_TRANS", unit: "G" as NutrientUnit, displayName: "Grasas Trans", isRequiredOnLabel: true },
  { key: "CARBS_TOTAL", unit: "G" as NutrientUnit, displayName: "Carbohidratos Totales", isRequiredOnLabel: true },
  { key: "SUGAR_TOTAL", unit: "G" as NutrientUnit, displayName: "Azúcares Totales", isRequiredOnLabel: true },
  { key: "SUGAR_ADDED", unit: "G" as NutrientUnit, displayName: "Azúcares Añadidos", isRequiredOnLabel: true },
  { key: "FIBER", unit: "G" as NutrientUnit, displayName: "Fibra Dietaria", isRequiredOnLabel: true },
  { key: "PROTEIN", unit: "G" as NutrientUnit, displayName: "Proteína", isRequiredOnLabel: true },
  { key: "SODIUM", unit: "MG" as NutrientUnit, displayName: "Sodio", isRequiredOnLabel: true },
  { key: "VITAMIN_A", unit: "MCG" as NutrientUnit, displayName: "Vitamina A", isRequiredOnLabel: false },
  { key: "VITAMIN_C", unit: "MG" as NutrientUnit, displayName: "Vitamina C", isRequiredOnLabel: false },
  { key: "CALCIUM", unit: "MG" as NutrientUnit, displayName: "Calcio", isRequiredOnLabel: false },
  { key: "IRON", unit: "MG" as NutrientUnit, displayName: "Hierro", isRequiredOnLabel: false },
  { key: "MOISTURE", unit: "G" as NutrientUnit, displayName: "Humedad", isRequiredOnLabel: false },
  { key: "CHOLESTEROL", unit: "MG" as NutrientUnit, displayName: "Colesterol", isRequiredOnLabel: false },
  { key: "STARCH", unit: "G" as NutrientUnit, displayName: "Almidón", isRequiredOnLabel: false },
  { key: "VITAMIN_D", unit: "MCG" as NutrientUnit, displayName: "Vitamina D", isRequiredOnLabel: false },
  { key: "ZINC", unit: "MG" as NutrientUnit, displayName: "Zinc", isRequiredOnLabel: false },
];
