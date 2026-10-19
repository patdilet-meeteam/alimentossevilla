import { describe, expect, it } from "vitest";
import { resolveCtnIngredient } from "@/lib/nutrition/ctn-ingredient-identity";
const master = [
  { id: "water", siesaCode: "MPII311", name: "AGUA", genericName: null },
  { id: "pork", siesaCode: "MPCC010", name: "BRAZUELO", genericName: null },
  { id: "trim", siesaCode: "2903002", name: "REPELE", genericName: null },
];
describe("CTN identity", () => {
  it("rejects source codes linked to the wrong ingredient by row position", () => {
    expect(resolveCtnIngredient({ sourceCode: "MPII311", sourceName: "REPELE" }, master)).toBeNull();
    expect(resolveCtnIngredient({ sourceCode: "MPCC010", sourceName: "AGUA" }, master)).toBeNull();
  });
  it("requires code and description to agree", () => {
    expect(resolveCtnIngredient({ sourceCode: "2903002", sourceName: "Repele" }, master)?.id).toBe("trim");
  });
  it("allows a unique exact name only when no code is supplied", () => {
    expect(resolveCtnIngredient({ sourceCode: null, sourceName: "AGUA" }, master)?.id).toBe("water");
    expect(resolveCtnIngredient({ sourceCode: "unknown", sourceName: "AGUA" }, master)).toBeNull();
    expect(resolveCtnIngredient({ sourceCode: null, sourceName: "AGUA" }, [...master, { ...master[0], id: "other" }])).toBeNull();
  });
});
