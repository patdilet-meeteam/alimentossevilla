import { normalizeCostDescription } from "@/lib/costs/cost-import-parser";

interface IngredientIdentity {
  id: string;
  siesaCode: string;
  name: string;
  genericName: string | null;
}

/** A source code must agree with its description; row-position links are not identity. */
export function resolveCtnIngredient<T extends IngredientIdentity>(
  row: { sourceCode: string | null; sourceName: string },
  ingredients: readonly T[],
): T | null {
  const name = normalizeCostDescription(row.sourceName);
  const matchesName = (ingredient: T) => [ingredient.name, ingredient.genericName]
    .some((candidate) => candidate !== null && normalizeCostDescription(candidate) === name);
  if (row.sourceCode) {
    const coded = ingredients.filter((ingredient) => ingredient.siesaCode.toUpperCase() === row.sourceCode!.toUpperCase());
    return coded.length === 1 && matchesName(coded[0]) ? coded[0] : null;
  }
  const candidates = ingredients.filter(matchesName);
  return candidates.length === 1 ? candidates[0] : null;
}
