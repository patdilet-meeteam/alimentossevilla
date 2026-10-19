import { describe, expect, it } from "vitest";
import originalHeaders from "../fixtures/bank-original-headers.json";
import { parseNutritionalBankRows } from "@/lib/nutrition/nutritional-bank-import";

describe("Unit: importador Banco Nutricional", () => {
  it("lee la hoja TN OFICIAL y conserva solo valores numéricos por 100 g", () => {
    const rows = parseNutritionalBankRows([
      ["FUENTE", "CATEGORÍA", "INGREDIENTE", "HUMEDAD", "GRASA", "GRASA SATURADA", "PROTEÍNA", "SODIO", "VIT D"],
      ["LAB PROVEEDOR", "MPC", "Tocino de Cerdo", 10.5, "85,8", 34.6, 2.9, 22, "-"],
      ["ICBF", "MPNC", "Agua potable", "", "", "", "", 0, ""],
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ ingredientName: "Tocino de Cerdo", sourceDetail: "LAB PROVEEDOR" });
    expect(rows[0].valuesPer100g.FAT_TOTAL.toString()).toBe("85.8");
    expect(rows[0].valuesPer100g.FAT_SAT.toString()).toBe("34.6");
    expect(rows[1].valuesPer100g.SODIUM.toString()).toBe("0");
  });

  it("recognizes the original workbook trans fat and vitamin A headers", () => {
    const rows = parseNutritionalBankRows(originalHeaders);
    expect(rows[0].valuesPer100g.FAT_TRANS.toString()).toBe("0.032");
    expect(rows[0].valuesPer100g.VITAMIN_A.toString()).toBe("0");
    expect(Object.keys(rows[0].valuesPer100g)).toHaveLength(17);
  });

  it("keeps missing, negative and nonfinite values absent", () => {
    const [row] = parseNutritionalBankRows([
      ["INGREDIENTE", "GRASA TRANS (g)", "SODIO", "PROTEINA", "GRASA"],
      ["sample", "", 0, -1, "Infinity"],
    ]);
    expect(Object.keys(row.valuesPer100g)).toEqual(["SODIUM"]);
  });

  it("requiere el encabezado oficial en vez de inferir columnas", () => {
    expect(() => parseNutritionalBankRows([["NOMBRE", "GRASA"], ["x", 1]])).toThrow("INGREDIENTE");
  });
});
