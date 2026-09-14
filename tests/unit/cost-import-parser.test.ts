import { describe, expect, it } from "vitest";
import { parseCostRows } from "@/lib/costs/cost-import-parser";

describe("Unit: parser de costos SIESA", () => {
  it("acepta una fila completa y clasifica prefijos de insumos confirmados", () => {
    const result = parseCostRows([["1130001", "Carne de cerdo", "1130001", "kg", 12500.5]]);

    expect(result).toMatchObject({ validItemCount: 1, warningCount: 0, duplicateCodes: [] });
    expect(result.rows[0]).toMatchObject({
      sourceRow: 2,
      sourceCode: "1130001",
      description: "Carne de cerdo",
      unit: "KG",
      unitCost: 12500.5,
      codeType: "INSUMO",
      status: "VALID",
      issues: [],
    });
  });

  it("marca todas las ocurrencias de un código repetido sin elegir una silenciosamente", () => {
    const result = parseCostRows([
      ["2903003", "Producto A", "2903003", "UND", 11506.13],
      ["2903003", "Producto A", "2903003", "KG", 11937.77],
    ]);

    expect(result.duplicateCodes).toEqual(["2903003"]);
    expect(result.rows).toHaveLength(2);
    expect(result.rows.every((row) => row.status === "DUPLICATE_CONFLICT")).toBe(true);
  });

  it("mantiene una unidad vacía como dato faltante y no la convierte", () => {
    const result = parseCostRows([["1131002", "Ingrediente", "1131002", "", 1000]]);

    expect(result.rows[0].unit).toBeNull();
    expect(result.rows[0].status).toBe("INVALID");
    expect(result.rows[0].issues).toContain("Unidad ausente");
  });

  it("rechaza una fila cuando las dos columnas de código no coinciden", () => {
    const result = parseCostRows([["1130001", "Ingrediente", "1130002", "KG", 1000]]);

    expect(result.rows[0].status).toBe("INVALID");
    expect(result.rows[0].issues).toContain("Las dos columnas de código no coinciden");
  });

  it("preserva un costo cero como valor válido", () => {
    const result = parseCostRows([["1230001", "Ingrediente sin costo", "1230001", "KG", 0]]);

    expect(result.rows[0].unitCost).toBe(0);
    expect(result.rows[0].status).toBe("VALID");
  });
});
