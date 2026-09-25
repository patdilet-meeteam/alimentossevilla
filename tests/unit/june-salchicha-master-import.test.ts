import { describe, expect, it } from "vitest";
import { parseJuneSalchichaMasterRows } from "@/lib/nutrition/june-salchicha-master-import";

const header = [null, "CÓDIGO", "DESCRIPCIÓN"];
const requiredRows = [
  [null, 2903003, "BRAZUELO CHARQUEADO"], [null, 1121009, "TOCINO NACIONAL"], [null, 2903002, "REPELE CHARQUEADO"], [null, 1131002, "AGUA POTABLE"],
  [null, 1250009, "COLOR NATURAL ROJO AC150"], [null, 1250004, "COLOR NATURAL NARANJA PR801WD"], [null, 1210006, "SAL REDUCIDA EN SODIO 60/40"], [null, 1210004, "SAL CURANTE AL 12 %"],
  [null, 121007, "SUPRA MEAT F451"], [null, 1240002, "CONSERVANTE INBAC ACN NA"], [null, 1220014, "PVH LIQUIDA M 1222"], [null, 1220009, "CEBOLLA EN POLVO"],
  [null, 1210003, "ERITORBATO DE SODIO"], [null, 1260005, "PLASMA PORCINO"], [null, 1220005, "AJO MOLIDO DESHIDRATADO B.1"], [null, 1220007, "PIMIENTA NEGRA MOLIDA"],
  [null, 1220010, "DEXTROSA"], [null, 1270004, "HUMO TRUSMOKE OIL EX"], [null, "TOTAL", null],
];

describe("Unit: maestro piloto de junio", () => {
  it("extrae las 18 materias primas con código, categoría y mapeo explícito", () => {
    const rows = parseJuneSalchichaMasterRows([[null], header, ...requiredRows]);
    expect(rows).toHaveLength(18);
    expect(rows[0]).toMatchObject({ siesaCode: "2903003", category: "MPC", nutritionalBankName: "Brazuelo de Cerdo" });
    expect(rows.find((row) => row.siesaCode === "1250004")?.nutritionalBankName).toBe("NaranjaPR80J WD");
  });

  it("rechaza códigos fuera del piloto en vez de clasificarlos por inferencia", () => {
    expect(() => parseJuneSalchichaMasterRows([[null], header, [null, 999, "Desconocido"], [null, "TOTAL", null]])).toThrow("no pertenece");
  });
});
