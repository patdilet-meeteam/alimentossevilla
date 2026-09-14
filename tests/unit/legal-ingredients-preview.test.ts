import { describe, expect, it } from "vitest";
import { buildLegalIngredientsPreview } from "@/lib/documents/legal-ingredients-preview";

describe("Unit: previsualización de ingredientes para documentos", () => {
  it("ordena por participación descendente y conserva los alérgenos declarados", () => {
    const result = buildLegalIngredientsPreview([
      { ingredientId: "water", name: "Agua", genericName: null, percentage: 20, isAllergen: false, allergenTags: [] },
      { ingredientId: "meat", name: "Carne bovina", genericName: "Carne", percentage: 65, isAllergen: true, allergenTags: ["SOYA", "GLUTEN"] },
      { ingredientId: "salt", name: "Sal", genericName: null, percentage: 15, isAllergen: true, allergenTags: ["SOYA"] },
    ]);

    expect(result.ingredients.map((ingredient) => ingredient.label)).toEqual(["Carne", "Agua", "Sal"]);
    expect(result.allergenTags).toEqual(["GLUTEN", "SOYA"]);
  });
});
