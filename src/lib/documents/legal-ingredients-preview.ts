export interface LegalIngredientInput {
  ingredientId: string;
  name: string;
  genericName: string | null;
  percentage: number;
  isAllergen: boolean;
  allergenTags: string[];
}

export interface LegalIngredientsPreview {
  ingredients: Array<{
    ingredientId: string;
    label: string;
    percentage: number;
  }>;
  allergenTags: string[];
}

export function buildLegalIngredientsPreview(inputs: readonly LegalIngredientInput[]): LegalIngredientsPreview {
  const ingredients = [...inputs]
    .sort((left, right) => right.percentage - left.percentage || left.name.localeCompare(right.name))
    .map((ingredient) => ({
      ingredientId: ingredient.ingredientId,
      label: ingredient.genericName || ingredient.name,
      percentage: ingredient.percentage,
    }));

  const allergenTags = [...new Set(
    inputs.flatMap((ingredient) => ingredient.isAllergen ? ingredient.allergenTags : []),
  )].sort((left, right) => left.localeCompare(right));

  return { ingredients, allergenTags };
}
