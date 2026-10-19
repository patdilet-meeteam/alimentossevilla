export const SPECIES_FAT_RULE_SOURCE = "Gmail 1a0f79cc0433d9d5 · diagrama del Director Técnico · 2026-10-01";
export interface SpeciesContribution {
  ingredientId: string;
  role: "MEAT" | "FAT" | "OTHER" | "UNKNOWN";
  species: string | null;
  evidence: string | null;
}
export interface SpeciesFatResult {
  status: "WITH_FAT_SEAL" | "WITHOUT_FAT_SEAL" | "PENDING_CLASSIFICATION";
  orphanFatSpecies: string[];
  unresolvedIngredientIds: string[];
  source: string;
}

/** Client composition criterion. It is separate from nutrient totals and regulatory thresholds. */
export function evaluateSpeciesFatRule(contributions: readonly SpeciesContribution[]): SpeciesFatResult {
  const unresolved = contributions.filter((item) => item.role === "UNKNOWN" || !item.evidence?.trim()
    || ((item.role === "MEAT" || item.role === "FAT") && !item.species?.trim()));
  const meat = new Set(contributions.filter((item) => item.role === "MEAT").map((item) => item.species?.trim().toLocaleLowerCase("es")));
  const fat = new Set(contributions.filter((item) => item.role === "FAT").map((item) => item.species?.trim().toLocaleLowerCase("es")));
  const orphanFatSpecies = [...fat].filter((species): species is string => Boolean(species) && !meat.has(species)).sort();
  return {
    status: contributions.length === 0 || unresolved.length > 0 ? "PENDING_CLASSIFICATION"
      : orphanFatSpecies.length > 0 ? "WITH_FAT_SEAL" : "WITHOUT_FAT_SEAL",
    orphanFatSpecies,
    unresolvedIngredientIds: [...new Set(unresolved.map((item) => item.ingredientId))],
    source: SPECIES_FAT_RULE_SOURCE,
  };
}
