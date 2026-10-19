import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { SpeciesFatPreview } from "@/components/nutrition/species-fat-preview";
import type { SpeciesContribution } from "@/lib/nutrition/species-fat-rule";
const ingredients = [{ id: "fat", name: "Grasa" }, { id: "meat", name: "Carne" }];
const classified = (meatSpecies: string): Record<string, SpeciesContribution> => ({
  fat: { ingredientId: "fat", role: "FAT", species: "cerdo", evidence: "clasificación de ejemplo sustentada" },
  meat: { ingredientId: "meat", role: "MEAT", species: meatSpecies, evidence: "clasificación de ejemplo sustentada" },
});
describe("species-fat screen", () => {
  it("renders the unknown classification state without a false no-seal result", () => {
    const html = renderToStaticMarkup(<SpeciesFatPreview ingredients={ingredients} />);
    expect(html).toContain("Pendiente de clasificación completa");
    expect(html).not.toContain("Sin sello de grasa según");
  });
  it("renders the matching species case", () => {
    expect(renderToStaticMarkup(<SpeciesFatPreview ingredients={ingredients} initialClassifications={classified("cerdo")} />)).toContain("Sin sello de grasa según el criterio del cliente");
  });
  it("renders an unmatched fat case and its species", () => {
    const html = renderToStaticMarkup(<SpeciesFatPreview ingredients={ingredients} initialClassifications={classified("pollo")} />);
    expect(html).toContain("Con sello de grasa según el criterio del cliente");
    expect(html).toContain("Grasa sin carne de su especie:");
    expect(html).toContain("cerdo");
  });
});
