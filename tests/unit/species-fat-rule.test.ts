import { describe, expect, it } from "vitest";
import { evaluateSpeciesFatRule, type SpeciesContribution } from "@/lib/nutrition/species-fat-rule";
const part = (role: SpeciesContribution["role"], species: string | null, id: string = role): SpeciesContribution => ({ ingredientId: id, role, species, evidence: "clasificación explícita de la fuente" });
describe("client diagram: unmatched animal fat", () => {
  it("has no fat seal without animal fat", () => expect(evaluateSpeciesFatRule([part("OTHER", null)]).status).toBe("WITHOUT_FAT_SEAL"));
  it("has no fat seal when each fat has meat of the same species", () => expect(evaluateSpeciesFatRule([part("FAT", "Cerdo"), part("MEAT", "cerdo")]).status).toBe("WITHOUT_FAT_SEAL"));
  it("one unmatched species activates the client fat seal", () => {
    const result = evaluateSpeciesFatRule([part("FAT", "cerdo"), part("MEAT", "cerdo"), part("FAT", "bovino", "second-fat")]);
    expect(result.status).toBe("WITH_FAT_SEAL");
    expect(result.orphanFatSpecies).toEqual(["bovino"]);
  });
  it("meat of a different species does not cover the fat", () => expect(evaluateSpeciesFatRule([part("FAT", "cerdo"), part("MEAT", "pollo")]).status).toBe("WITH_FAT_SEAL"));
  it("keeps unknown or unsupported classification pending", () => {
    expect(evaluateSpeciesFatRule([part("UNKNOWN", null)]).status).toBe("PENDING_CLASSIFICATION");
    expect(evaluateSpeciesFatRule([{ ...part("MEAT", "cerdo"), evidence: null }]).status).toBe("PENDING_CLASSIFICATION");
    expect(evaluateSpeciesFatRule([part("FAT", null)]).status).toBe("PENDING_CLASSIFICATION");
    expect(evaluateSpeciesFatRule([]).status).toBe("PENDING_CLASSIFICATION");
  });
});
