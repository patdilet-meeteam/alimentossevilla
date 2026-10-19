import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { FormulationReviewEvidence } from "@/components/products/formulation-review-evidence";
const ingredients = [{ code: "1210005", name: "Sal", percentage: "1", quantity: "0.1", activeProfileCount: 0, missingNutrients: ["SODIUM"] }];
const source = { sourceSheet: "Receta225", sourceSha256: "a".repeat(64), currentStatus: "VIGENCIA_NO_ACREDITADA", sourceRows: [{ sourceRow: 7, sourceCode: "", sourceName: "REPROCESO MORTADELA", quantity: "0.023", percentage: "9.96" }, { sourceRow: 8, sourceCode: "1210005", sourceName: "Sal", quantity: "0.1", percentage: "1.5" }] };
describe("reviewable source evidence", () => {
 it("retains uncoded reprocess and shows discrepancy, missing profile and unproven validity", () => {
  const html = renderToStaticMarkup(<FormulationReviewEvidence snapshot={source} ingredients={ingredients} />);
  for (const text of ["No acreditada", "REPROCESO MORTADELA", "Sin código", "Identidad pendiente", "Diferencia entre fuente y versión", "0 perfiles activos", "9.96"]) expect(html).toContain(text);
 });
 it("compares exact decimal values rather than formatting and preserves source formulas", () => {
  const html = renderToStaticMarkup(<FormulationReviewEvidence snapshot={{ ...source, sourceRows: [{ ...source.sourceRows[1], percentage: "1.0000", cells: { E8: { formula: "D8*100/D10" } } }] }} ingredients={ingredients.map(i => ({...i, activeProfileCount: 1, missingNutrients: []}))} />);
  expect(html).toContain("Valores coincidentes"); expect(html).toContain("D8*100/D10");expect(html).toContain("esto no acredita vigencia ni aprobación");
 });
});
