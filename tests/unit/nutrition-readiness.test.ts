import { describe, expect, it } from "vitest";
import { assessNutritionReadiness } from "@/lib/nutrition/nutrition-readiness";

describe("Unit: preparación de datos para cálculo nutricional", () => {
  const ingredient = {
    ingredientId: "ingredient-1",
    ingredientName: "Ingrediente de prueba",
    siesaCode: "1210005",
  };

  it("marca un ingrediente sin perfil activo sin elegir una fuente", () => {
    expect(assessNutritionReadiness({ ...ingredient, activeProfiles: [] })).toMatchObject({
      activeProfileCount: 0,
      activeValueCount: 0,
      issues: ["MISSING_ACTIVE_PROFILE"],
    });
  });

  it("marca perfiles activos múltiples como ambiguos", () => {
    expect(assessNutritionReadiness({
      ...ingredient,
      activeProfiles: [{ valueCount: 12 }, { valueCount: 10 }],
    })).toMatchObject({
      activeProfileCount: 2,
      activeValueCount: 22,
      issues: ["MULTIPLE_ACTIVE_PROFILES"],
    });
  });

  it("marca un perfil activo sin valores y acepta un perfil con valores sin calcular", () => {
    expect(assessNutritionReadiness({ ...ingredient, activeProfiles: [{ valueCount: 0 }] }).issues)
      .toEqual(["ACTIVE_PROFILE_WITHOUT_VALUES"]);
    expect(assessNutritionReadiness({ ...ingredient, activeProfiles: [{ valueCount: 12 }] }).issues)
      .toEqual([]);
  });
});
