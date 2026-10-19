import { describe, expect, it } from "vitest";
import { sumExactDecimalStrings } from "@/lib/formulations/exact-decimal-sum";
import { getSourceRecipeEvidence } from "@/lib/formulations/source-recipe-evidence";
describe("literal source precision", () => {
  it("does not hide a non100 total beyond binary float precision", () => {
    expect(sumExactDecimalStrings(["99", "1.000000000000000001"])).toBe("100.000000000000000001");
    expect(sumExactDecimalStrings(["0.0000000000000000000001", "0.9999999999999999999999"])).toBe("1");
  });
  it("supports original Excel scientific notation", () => expect(sumExactDecimalStrings(["5.12489208E-2", "0.1"])).toBe("0.1512489208"));
  it("keeps incomplete source rows pending and legacy versions unaffected", () => {
    expect(getSourceRecipeEvidence(null)).toBeNull();
    expect(getSourceRecipeEvidence({ source: "JUNE_RECIPE", sourceSheet: "x", issues: ["INVALID_CODE_ROW_7"] })?.issues).toContain("INVALID_CODE_ROW_7");
  });
});
