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

  it("construye porcentajes persistibles exactos desde cantidades", () => {
    const plan = buildCtnImportPlan(parseCtnCsv(ctn));
    expect(plan[0].percentage.toFixed(4)).toBe("92.6471");
    expect(plan[1].percentage.toFixed(4)).toBe("7.3529");
    expect(plan.reduce((sum, item) => sum.plus(item.percentage), plan[0].percentage.minus(plan[0].percentage)).toFixed(4))
      .toBe("100.0000");
  });
});
