/**
 * Evaluación de sellos de advertencia frontal según Resolución 810 de 2021 (Colombia)
 * modificada por Resolución 2492 de 2022.
 *
 * Artículo 32, Tabla 17 - Límites para establecimiento de sellos:
 * - Sodio: >= 300 mg/100g (para carnes crudas envasadas con sal añadida)
 * - Azúcares: >= 10% del total de energía
 * - Grasas saturadas: >= 10% del total de energía
 * - Grasas trans: >= 1% del total de energía
 *
 * Cálculo de % energía:
 * - Grasas: 9 kcal/g
 * - Azúcares/Proteína/Carbohidratos: 4 kcal/g
 */

import { Prisma } from "@prisma/client";

type Decimal = Prisma.Decimal;
type DecimalInput = Prisma.Decimal.Value;

/** Sellos de advertencia posibles */
export type WarningSeal =
  | "EXCESO_SODIO"
  | "EXCESO_AZUCARES"
  | "EXCESO_GRASAS_SATURADAS"
  | "EXCESO_GRASAS_TRANS";

/** Resultado de la evaluación de sellos */
export interface SealEvaluation {
  /** Sellos activos (que superan el umbral) */
  activeSeals: WarningSeal[];
  /** Détalle por nutriente evaluado */
  nutrients: {
    sodium: {
      valuePer100g: Decimal;
      threshold: number;
      exceeds: boolean;
    };
    sugars: {
      valuePer100g: Decimal;
      energyKcal: Decimal;
      totalEnergyKcal: Decimal;
      percentageOfEnergy: Decimal;
      threshold: number;
      exceeds: boolean;
    };
    fatSaturated: {
      valuePer100g: Decimal;
      energyKcal: Decimal;
      totalEnergyKcal: Decimal;
      percentageOfEnergy: Decimal;
      threshold: number;
      exceeds: boolean;
    };
    fatTrans: {
      valuePer100g: Decimal;
      energyKcal: Decimal;
      totalEnergyKcal: Decimal;
      percentageOfEnergy: Decimal;
      threshold: number;
      exceeds: boolean;
    };
  };
}

/** Valores de umbral según normativa colombiana (Resolución 810/2021 - 2492/2022) */
export const SEAL_THRESHOLDS = {
  /** mg por 100g de producto */
  SODIUM_MG_PER_100G: 300,
  /** Porcentaje de energía total (10% = 0.10) */
  ENERGY_PERCENTAGE_THRESHOLD: 10,
  /** Porcentaje para grasas trans (1% = 0.01) */
  FAT_TRANS_THRESHOLD: 1,
} as const;

export interface SealThresholds {
  SODIUM_MG_PER_100G: number;
  ENERGY_PERCENTAGE_THRESHOLD: number;
  FAT_TRANS_THRESHOLD: number;
}

/** Factores de conversión calórica (kcal por gramo) */
const KCAL_PER_GRAM = {
  FAT: 9,
  CARBS: 4,
  PROTEIN: 4,
  SUGAR: 4,
} as const;

function decimal(value: DecimalInput): Decimal {
  return new Prisma.Decimal(value);
}

function valueOrZero(value: DecimalInput | undefined): Decimal {
  return value === undefined ? new Prisma.Decimal(0) : decimal(value);
}

/**
 * Evalúa los sellos de advertencia para una fórmula nutricional.
 *
 * @param nutritionData - Datos nutricionales calculados (por 100g y energía)
 * @returns Evaluación de sellos con detalle de cada nutriente
 */
export function evaluateWarningSeals(nutritionData: {
  /** Nutrientes por 100g (clave: código del nutriente) */
  per100g: Record<string, Decimal>;
  /** Energía total en kcal por 100g */
  energyKcalPer100g: Decimal;
}, thresholds: SealThresholds = SEAL_THRESHOLDS): SealEvaluation {
  const { per100g, energyKcalPer100g } = nutritionData;

  // Extraer valores de nutrientes críticos
  const sodiumMg = valueOrZero(per100g.SODIUM); // mg por 100g
  const sugarsG = valueOrZero(per100g.SUGAR_TOTAL); // g por 100g
  const fatSaturatedG = valueOrZero(per100g.FAT_SAT); // g por 100g
  const fatTransG = valueOrZero(per100g.FAT_TRANS); // g por 100g

  // Calcular energía de cada nutriente crítico
  const sugarsEnergyKcal = sugarsG.mul(KCAL_PER_GRAM.SUGAR);
  const fatSaturatedEnergyKcal = fatSaturatedG.mul(KCAL_PER_GRAM.FAT);
  const fatTransEnergyKcal = fatTransG.mul(KCAL_PER_GRAM.FAT);

  // Evitar división por cero en cálculos de porcentaje de energía
  const safeTotalEnergy = energyKcalPer100g.isZero()
    ? new Prisma.Decimal(0.0001) // Usar un valor mínimo para evitar división por cero
    : energyKcalPer100g;

  // Calcular porcentaje de energía
  const sugarsPercentageOfEnergy = sugarsEnergyKcal.mul(100).div(safeTotalEnergy);
  const fatSaturatedPercentageOfEnergy = fatSaturatedEnergyKcal.mul(100).div(safeTotalEnergy);
  const fatTransPercentageOfEnergy = fatTransEnergyKcal.mul(100).div(safeTotalEnergy);

  // Evaluar cada sello
  const exceedsSodium = sodiumMg.gte(thresholds.SODIUM_MG_PER_100G);
  const exceedsSugars = sugarsPercentageOfEnergy.gte(thresholds.ENERGY_PERCENTAGE_THRESHOLD);
  const exceedsFatSaturated = fatSaturatedPercentageOfEnergy.gte(thresholds.ENERGY_PERCENTAGE_THRESHOLD);
  const exceedsFatTrans = fatTransPercentageOfEnergy.gte(thresholds.FAT_TRANS_THRESHOLD);

  // Construir resultado
  const activeSeals: WarningSeal[] = [];
  if (exceedsSodium) activeSeals.push("EXCESO_SODIO");
  if (exceedsSugars) activeSeals.push("EXCESO_AZUCARES");
  if (exceedsFatSaturated) activeSeals.push("EXCESO_GRASAS_SATURADAS");
  if (exceedsFatTrans) activeSeals.push("EXCESO_GRASAS_TRANS");

  return {
    activeSeals,
    nutrients: {
      sodium: {
        valuePer100g: sodiumMg,
        threshold: thresholds.SODIUM_MG_PER_100G,
        exceeds: exceedsSodium,
      },
      sugars: {
        valuePer100g: sugarsG,
        energyKcal: sugarsEnergyKcal,
        totalEnergyKcal: energyKcalPer100g,
        percentageOfEnergy: sugarsPercentageOfEnergy,
        threshold: thresholds.ENERGY_PERCENTAGE_THRESHOLD,
        exceeds: exceedsSugars,
      },
      fatSaturated: {
        valuePer100g: fatSaturatedG,
        energyKcal: fatSaturatedEnergyKcal,
        totalEnergyKcal: energyKcalPer100g,
        percentageOfEnergy: fatSaturatedPercentageOfEnergy,
        threshold: thresholds.ENERGY_PERCENTAGE_THRESHOLD,
        exceeds: exceedsFatSaturated,
      },
      fatTrans: {
        valuePer100g: fatTransG,
        energyKcal: fatTransEnergyKcal,
        totalEnergyKcal: energyKcalPer100g,
        percentageOfEnergy: fatTransPercentageOfEnergy,
        threshold: thresholds.FAT_TRANS_THRESHOLD,
        exceeds: exceedsFatTrans,
      },
    },
  };
}

/**
 * Genera mensaje legible de los sellos activos
 */
export function formatActiveSeals(seals: WarningSeal[]): string {
  if (seals.length === 0) return "Sin sellos de advertencia";

  const sealLabels: Record<WarningSeal, string> = {
    EXCESO_SODIO: "Exceso de Sodio",
    EXCESO_AZUCARES: "Exceso de Azúcares",
    EXCESO_GRASAS_SATURADAS: "Exceso de Grasas Saturadas",
    EXCESO_GRASAS_TRANS: "Exceso de Grasas Trans",
  };

  return seals.map((seal) => sealLabels[seal]).join(", ");
}

/**
 * Obtiene el texto del sello para el formato de advertencia frontal
 */
export function getSealText(seal: WarningSeal): string {
  const sealTexts: Record<WarningSeal, string> = {
    EXCESO_SODIO: "EXCESO EN SODIO",
    EXCESO_AZUCARES: "EXCESO EN AZÚCARES",
    EXCESO_GRASAS_SATURADAS: "EXCESO EN GRASAS SATURADAS",
    EXCESO_GRASAS_TRANS: "EXCESO EN GRASAS TRANS",
  };

  return sealTexts[seal];
}
