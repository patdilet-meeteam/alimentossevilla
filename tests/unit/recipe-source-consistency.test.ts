import { describe, expect, it } from "vitest";
import { getKnownRecipeConflict } from "@/lib/nutrition/recipe-source-consistency";
describe("known combo source discrepancy", () => {
  it("rejects the observed salt recipe despite complete nutrients and an exact100percent total", () => {
    expect(getKnownRecipeConflict("mega-combo-faizan", [{ siesaCode: "sal", percentage: "50" }, { siesaCode: "mortadela", percentage: "50" }])).toContain("B5:E7");
    expect(getKnownRecipeConflict("s-per-combo-viand", [{ siesaCode: "sal", percentage: "75" }, { siesaCode: "mortadela", percentage: "25" }])).toContain("B5:E8");
  });
  it("does not permanently blacklist a product after its components change", () => {
    expect(getKnownRecipeConflict("mega-combo-faizan", [{ siesaCode: "10090O", percentage: "33.3333" }, { siesaCode: "30017", percentage: "33.3333" }])).toBeNull();
  });
});
