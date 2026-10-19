import { describe, expect, it } from "vitest";
import { buildCtnImportPlan, parseCtnCsv } from "@/lib/nutrition/ctn-import";

const ctn = `,,,SALCHICHAS DESAYUNO PREMIUM,,,,,,,,
,,FUENTE, CÓDIGO, DESCRIPCIÓN, CANTIDAD, %,GRASA (g),GRASA SATURADA (g),PROTEÍNA (g),SODIO (mg)
,,FDC,,BRAZUELO DE CERDO,315,64.56,4,1.42,21.1,67
,,ICBF,MPCC026,TOCINO CINTA,25,5.12,85.8,34.6,2.9,22
,,,TOTAL,,340,100,,,,,
,,,BRAZUELO DE OTRA SECCIÓN,64.56,100,4,1.42,21.1,67
`;

describe("Unit: importador CTN", () => {
  it("lee cantidades y nutrientes, sin consumir totales o fórmulas post-merma", () => {
    const rows = parseCtnCsv(ctn);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ sourceName: "BRAZUELO DE CERDO", sourceCode: null });
    expect(rows[1].nutrientsPer100g.FAT_SAT.toString()).toBe("34.6");
  });

  it("se detiene cuando TOTAL aparece en la columna de código", () => {
    const rows = parseCtnCsv(ctn);
    expect(rows.map((row) => row.sourceName)).not.toContain("BRAZUELO DE OTRA SECCIÓN");
  });

  it("does not invent zero nutrients for blank source cells", () => {
    const rows = parseCtnCsv("DESCRIPCIÓN,CANTIDAD,GRASA (g),SODIO (mg)\nSample,10,,0\nTOTAL,10,,");
    expect(rows[0].nutrientsPer100g.FAT_TOTAL).toBeUndefined();
    expect(rows[0].nutrientsPer100g.SODIUM.toString()).toBe("0");
  });

  it("rechaza porcentajes fuente incompletos en vez de normalizarlos", () => {
    expect(() => buildCtnImportPlan(parseCtnCsv(ctn))).toThrow("No se normalizaron");
  });

  it("conserva porcentajes fuente exactos cuando suman 100", () => {
    const valid = ctn.replace("315,64.56", "315,92.6471").replace("25,5.12", "25,7.3529");
    const plan = buildCtnImportPlan(parseCtnCsv(valid));
    expect(plan[0].percentage.toString()).toBe("92.6471");
    expect(plan[1].percentage.toString()).toBe("7.3529");
    expect(plan[0].quantity.toString()).toBe("315");
  });
  it("validates the full 24-digit sum without rounding a source difference away", () => {
    const csv = "DESCRIPCIÓN,CANTIDAD,%,SODIO (mg)\nA,1,99.999999999999999999999999,0\nB,1,0.000000000000000000000001,0\nTOTAL,2,100,0";
    expect(buildCtnImportPlan(parseCtnCsv(csv))[0].percentage.toString()).toBe("99.999999999999999999999999");
    expect(() => buildCtnImportPlan(parseCtnCsv(csv.replace("0.000000000000000000000001", "0.000000000000000000000002")))).toThrow("No se normalizaron");
  });

  it("rejects a quantity that would be truncated by storage", () => {
    const csv = "DESCRIPCIÓN,CANTIDAD,%,SODIO (mg)\nA,0.1234567890123456789012345,100,0\nTOTAL,1,100,0";
    expect(() => buildCtnImportPlan(parseCtnCsv(csv))).toThrow("cantidad fuente excede");
  });

});
