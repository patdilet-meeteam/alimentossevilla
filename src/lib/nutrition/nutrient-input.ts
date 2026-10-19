/** Empty input is absent; explicit zero and every entered decimal digit are preserved. */
export interface NutrientInputValue { nutrientId: string; value: string | number; method?: string | null }
export function updateNutrientInput(values: readonly NutrientInputValue[], nutrientId: string, input: string): NutrientInputValue[] {
  if (input === "") return values.filter(value => value.nutrientId !== nutrientId);
  const old = values.find(value => value.nutrientId === nutrientId);
  return old ? values.map(value => value.nutrientId === nutrientId ? {...value, value: input} : value) : [...values, {nutrientId, value: input, method: ""}];
}
