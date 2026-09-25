import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { calculateNutrition } from "@/lib/nutrition/nutrition-calculator";
import { evaluateWarningSeals, formatActiveSeals, getSealText, SEAL_THRESHOLDS } from "@/lib/nutrition/warning-seals";

// Datos de los 18 ingredientes de Salchicha Desayuno Premium (CTN v11)
// Perfiles nutricionales del archivo de junio (TN OFICIAL)
const ctnIngredients = [
  { ingredientId: "1", name: "BRAZUELO DE CERDO", quantity: 315, nutrientsPer100g: { FAT_TOTAL: 4, FAT_SAT: 1.42, PROTEIN: 21.1, CARBS_TOTAL: 0.21, SUGAR_TOTAL: 0, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 67 } },
  { ingredientId: "2", name: "TOCINO CINTA", quantity: 25, nutrientsPer100g: { FAT_TOTAL: 85.8, FAT_SAT: 34.6, PROTEIN: 2.9, CARBS_TOTAL: 8.48, SUGAR_TOTAL: 0, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 22 } },
  { ingredientId: "3", name: "REPELE FAZÁN", quantity: 46, nutrientsPer100g: { FAT_TOTAL: 25, FAT_SAT: 8.48, PROTEIN: 13.28, CARBS_TOTAL: 0, SUGAR_TOTAL: 0, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 62 } },
  { ingredientId: "4", name: "AGUA POTABLE", quantity: 82.964, nutrientsPer100g: { FAT_TOTAL: 0, FAT_SAT: 0, PROTEIN: 0, CARBS_TOTAL: 0, SUGAR_TOTAL: 0, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 4 } },
  { ingredientId: "5", name: "COLOR NATURAL ROJO AC150", quantity: 0.123, nutrientsPer100g: { FAT_TOTAL: 0, FAT_SAT: 0, PROTEIN: 1.4, CARBS_TOTAL: 7.8, SUGAR_TOTAL: 0, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 0 } },
  { ingredientId: "6", name: "COLOR NATURAL NARANJA PR801 WD", quantity: 0.096, nutrientsPer100g: { FAT_TOTAL: 96.3, FAT_SAT: 21.8, PROTEIN: 1.43, CARBS_TOTAL: 2.27, SUGAR_TOTAL: 0, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 0 } },
  { ingredientId: "7", name: "SAL REDUCIDA EN SODIO", quantity: 8.25, nutrientsPer100g: { FAT_TOTAL: 0, FAT_SAT: 0, PROTEIN: 0, CARBS_TOTAL: 0, SUGAR_TOTAL: 0, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 23268 } },
  { ingredientId: "8", name: "SAL CURANTE AL 12 %", quantity: 0.405, nutrientsPer100g: { FAT_TOTAL: 0, FAT_SAT: 0, PROTEIN: 0.001, CARBS_TOTAL: 0.005, SUGAR_TOTAL: 0, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 38339 } },
  { ingredientId: "9", name: "MEZCLA DE FOSFATOS SUPRA MEAT F451", quantity: 2, nutrientsPer100g: { FAT_TOTAL: 0, FAT_SAT: 0, PROTEIN: 0, CARBS_TOTAL: 0, SUGAR_TOTAL: 0, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 11100 } },
  { ingredientId: "10", name: "CONSERVANTE INBAC ACN/NA", quantity: 1.53, nutrientsPer100g: { FAT_TOTAL: 2, FAT_SAT: 2, PROTEIN: 1, CARBS_TOTAL: 33, SUGAR_TOTAL: 2, SUGAR_ADDED: 2, FIBER: 0, SODIUM: 17000 } },
  { ingredientId: "11", name: "PVH LIQUIDA M 1222", quantity: 2.25, nutrientsPer100g: { FAT_TOTAL: 0, FAT_SAT: 0, PROTEIN: 13.7, CARBS_TOTAL: 29.2, SUGAR_TOTAL: 0, SUGAR_ADDED: 0.2, FIBER: 0, SODIUM: 7160 } },
  { ingredientId: "12", name: "CEBOLLA EN POLVO B.1", quantity: 0.1, nutrientsPer100g: { FAT_TOTAL: 1, FAT_SAT: 0.2, PROTEIN: 10.4, CARBS_TOTAL: 79.1, SUGAR_TOTAL: 15.2, SUGAR_ADDED: 0, FIBER: 6.6, SODIUM: 73 } },
  { ingredientId: "13", name: "ERITORBATO DE SODIO", quantity: 0.23, nutrientsPer100g: { FAT_TOTAL: 0, FAT_SAT: 0, PROTEIN: 0, CARBS_TOTAL: 0, SUGAR_TOTAL: 0, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 10680 } },
  { ingredientId: "14", name: "PLASMA PORCINO", quantity: 0.3, nutrientsPer100g: { FAT_TOTAL: 2, FAT_SAT: 0.8, PROTEIN: 75, CARBS_TOTAL: 2, SUGAR_TOTAL: 0, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 4750 } },
  { ingredientId: "15", name: "AJO MOLIDO DESHIDRATADO", quantity: 0.1, nutrientsPer100g: { FAT_TOTAL: 0.8, FAT_SAT: 0, PROTEIN: 17, CARBS_TOTAL: 75, SUGAR_TOTAL: 24, SUGAR_ADDED: 0, FIBER: 9.9, SODIUM: 60 } },
  { ingredientId: "16", name: "PIMIENTA NEGRA MOLIDA", quantity: 0.3, nutrientsPer100g: { FAT_TOTAL: 3.3, FAT_SAT: 1, PROTEIN: 11, CARBS_TOTAL: 64.8, SUGAR_TOTAL: 26.5, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 44 } },
  { ingredientId: "17", name: "DEXTROSA", quantity: 3.1, nutrientsPer100g: { FAT_TOTAL: 0, FAT_SAT: 0, PROTEIN: 0.002, CARBS_TOTAL: 99.5, SUGAR_TOTAL: 99.5, SUGAR_ADDED: 99.5, FIBER: 0, SODIUM: 0 } },
  { ingredientId: "18", name: "HUMO TRUSMOKE OIL EX", quantity: 0.2, nutrientsPer100g: { FAT_TOTAL: 0, FAT_SAT: 0, PROTEIN: 0, CARBS_TOTAL: 60.7, SUGAR_TOTAL: 2.2, SUGAR_ADDED: 0, FIBER: 0, SODIUM: 45 } },
];

describe("Unit: sellos de advertencia (Resolución 810/2021 - 2492/2022)", () => {
  it("evalúa sellos para Salchicha Desayuno Premium v3 con TN OFICIAL", () => {
    const calculation = calculateNutrition(ctnIngredients, 34);
    
    const seals = evaluateWarningSeals({
      per100g: calculation.per100g,
      energyKcalPer100g: calculation.energyKcalPer100g,
    });

    // Verificar que se evalúan los 4 nutrientes críticos
    expect(seals.nutrients.sodium.valuePer100g.toFixed(2)).toBe("615.98");
    expect(seals.nutrients.sodium.threshold).toBe(SEAL_THRESHOLDS.SODIUM_MG_PER_100G);
    expect(seals.nutrients.sodium.exceeds).toBe(true); // 615.98 > 300

    // Grasas saturadas: 3.5006g * 9 kcal/g = 31.5 kcal
    // Energía total aproximada: ~160 kcal
    // % energía = 31.5 / 160 * 100 = 19.7% > 10%
    expect(seals.nutrients.fatSaturated.exceeds).toBe(true);

    // Verificar sellos activos
    expect(seals.activeSeals).toContain("EXCESO_SODIO");
    expect(seals.activeSeals).toContain("EXCESO_GRASAS_SATURADAS");
    // Azúcares y grasas trans probablemente no exceden
  });

  it("detecta correctamente un producto sin sellos", () => {
    // Producto hipotético bajo en sodio y grasas
    const lowRiskProduct = {
      per100g: {
        SODIUM: new Prisma.Decimal(50),
        SUGAR_TOTAL: new Prisma.Decimal(2),
        FAT_SAT: new Prisma.Decimal(1),
        FAT_TRANS: new Prisma.Decimal(0),
        // Nutrientes necesarios para calcular energía
        FAT_TOTAL: new Prisma.Decimal(3),
        CARBS_TOTAL: new Prisma.Decimal(15),
        FIBER: new Prisma.Decimal(2),
        PROTEIN: new Prisma.Decimal(8),
      },
      energyKcalPer100g: new Prisma.Decimal(107), // 3*9 + (15-2-2)*4 + 2*2 + 2*4 + 8*4
    };

    const seals = evaluateWarningSeals(lowRiskProduct);

    expect(seals.activeSeals).toHaveLength(0);
    expect(seals.nutrients.sodium.exceeds).toBe(false);
    expect(seals.nutrients.sugars.exceeds).toBe(false);
    expect(seals.nutrients.fatSaturated.exceeds).toBe(false);
  });

  it("detecta exceso de sodio en producto cárnico", () => {
    const highSodiumProduct = {
      per100g: {
        SODIUM: new Prisma.Decimal(850),
        SUGAR_TOTAL: new Prisma.Decimal(1),
        FAT_SAT: new Prisma.Decimal(2),
        FAT_TRANS: new Prisma.Decimal(0),
        FAT_TOTAL: new Prisma.Decimal(5),
        CARBS_TOTAL: new Prisma.Decimal(3),
        FIBER: new Prisma.Decimal(0),
        PROTEIN: new Prisma.Decimal(18),
      },
      energyKcalPer100g: new Prisma.Decimal(137),
    };

    const seals = evaluateWarningSeals(highSodiumProduct);

    expect(seals.activeSeals).toContain("EXCESO_SODIO");
    expect(seals.nutrients.sodium.exceeds).toBe(true);
  });

  it("formatea sellos activos correctamente", () => {
    expect(formatActiveSeals([])).toBe("Sin sellos de advertencia");
    expect(formatActiveSeals(["EXCESO_SODIO"])).toBe("Exceso de Sodio");
    expect(formatActiveSeals(["EXCESO_SODIO", "EXCESO_GRASAS_SATURADAS"])).toBe("Exceso de Sodio, Exceso de Grasas Saturadas");
  });

  it("genera texto de sello para advertencia frontal", () => {
    expect(getSealText("EXCESO_SODIO")).toBe("EXCESO EN SODIO");
    expect(getSealText("EXCESO_AZUCARES")).toBe("EXCESO EN AZÚCARES");
    expect(getSealText("EXCESO_GRASAS_SATURADAS")).toBe("EXCESO EN GRASAS SATURADAS");
    expect(getSealText("EXCESO_GRASAS_TRANS")).toBe("EXCESO EN GRASAS TRANS");
  });
});
