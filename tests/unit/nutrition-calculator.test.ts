import { describe, expect, it } from "vitest";
import { calculateNutrition, normalizePercentagesFromQuantities } from "@/lib/nutrition/nutrition-calculator";

const ctnIngredients = [
  ["1", "BRAZUELO DE CERDO", 315, 4, 1.42, 21.1, 0.21, 0, 0, 0, 67],
  ["2", "TOCINO CINTA", 25, 85.8, 34.6, 2.9, 0, 0, 0, 0, 22],
  ["3", "REPELE FAZÁN", 46, 25, 8.48, 13.28, 0, 0, 0, 0, 62],
  ["4", "AGUA POTABLE", 82.964, 0, 0, 0, 0, 0, 0, 0, 4],
  ["5", "COLOR NATURAL ROJO AC150", 0.123, 0, 0, 1.4, 7.8, 0, 0, 0, 0],
  ["6", "COLOR NATURAL NARANJA PR801 WD", 0.096, 96.3, 21.8, 1.43, 2.27, 0, 0, 0, 0],
  ["7", "SAL REDUCIDA EN SODIO", 8.25, 0, 0, 0, 0, 0, 0, 0, 23268],
  ["8", "SAL CURANTE AL 12 %", 0.405, 0, 0, 0.001, 0.005, 0, 0, 0, 38339],
  ["9", "MEZCLA DE FOSFATOS SUPRA MEAT F451", 2, 0, 0, 0, 0, 0, 0, 0, 11100],
  ["10", "CONSERVANTE INBAC ACN/NA", 1.53, 2, 2, 1, 33, 2, 2, 0, 17000],
  ["11", "PVH LIQUIDA M 1222", 2.25, 0, 0, 13.7, 29.2, 0, 0, 0.2, 7160],
  ["12", "CEBOLLA EN POLVO B.1", 0.1, 1, 0.2, 10.4, 79.1, 15.2, 0, 6.6, 73],
  ["13", "ERITORBATO DE SODIO", 0.23, 0, 0, 0, 0, 0, 0, 0, 10680],
  ["14", "PLASMA PORCINO", 0.3, 2, 0.8, 75, 2, 0, 0, 0, 4750],
  ["15", "AJO MOLIDO DESHIDRATADO", 0.1, 0.8, 0, 17, 75, 24, 0, 9.9, 60],
  ["16", "PIMIENTA NEGRA MOLIDA", 0.3, 3.3, 1, 11, 64.8, 26.5, 0, 0, 44],
  ["17", "DEXTROSA", 3.1, 0, 0, 0.002, 99.5, 99.5, 99.5, 0, 0],
  ["18", "HUMO TRUSMOKE OIL EX", 0.2, 0, 0, 0, 60.7, 2.2, 0, 0, 45],
].map(([ingredientId, name, quantity, fat, fatSat, protein, carbs, sugar, sugarAdded, fiber, sodium]) => ({
  ingredientId: String(ingredientId), name: String(name), quantity: Number(quantity),
  nutrientsPer100g: {
    FAT_TOTAL: Number(fat), FAT_SAT: Number(fatSat), PROTEIN: Number(protein), CARBS_TOTAL: Number(carbs),
    SUGAR_TOTAL: Number(sugar), SUGAR_ADDED: Number(sugarAdded), FIBER: Number(fiber), SODIUM: Number(sodium),
  },
}));

describe("Unit: motor nutricional CTN", () => {
  it("normaliza cantidades sin tolerancia y conserva exactamente 100,0000 %", () => {
    const normalized = normalizePercentagesFromQuantities(ctnIngredients);
    const total = normalized.reduce((sum, ingredient) => sum.plus(ingredient.percentage), normalized[0].percentage.minus(normalized[0].percentage));
    expect(total.toFixed(4)).toBe("100.0000");
  });

  it("calcula aportes ponderados desde los perfiles de entrada sin concentrar nutrientes por merma", () => {
    const calculation = calculateNutrition(ctnIngredients, 34);
    expect(calculation.totalQuantity.toFixed(3)).toBe("487.948");
    expect(calculation.per100g.FAT_TOTAL.toFixed(4)).toBe("9.3639");
    expect(calculation.per100g.FAT_SAT.toFixed(4)).toBe("3.5006");
    expect(calculation.per100g.PROTEIN.toFixed(4)).toBe("15.1473");
    expect(calculation.per100g.SODIUM.toFixed(4)).toBe("615.9756");
    expect(calculation.perPortion.FAT_SAT.toFixed(4)).toBe("1.1902");
  });
});
