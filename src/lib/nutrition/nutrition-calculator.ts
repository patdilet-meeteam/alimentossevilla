import { Prisma } from "@prisma/client";

type Decimal = Prisma.Decimal;
type DecimalInput = Prisma.Decimal.Value;

export interface NutritionIngredientInput {
  ingredientId: string;
  name: string;
  quantity: DecimalInput;
  nutrientsPer100g: Record<string, DecimalInput | undefined>;
}

export interface NormalizedNutritionIngredient extends NutritionIngredientInput {
  percentage: Decimal;
}

export interface NutritionCalculation {
  totalQuantity: Decimal;
  ingredients: NormalizedNutritionIngredient[];
  per100g: Record<string, Decimal>;
  perPortion: Record<string, Decimal>;
  energyKcalPer100g: Decimal;
  energyKcalPerPortion: Decimal;
}

const ONE_HUNDRED = new Prisma.Decimal(100);
const PERCENTAGE_PRECISION = 4;

function decimal(value: DecimalInput): Decimal {
  return new Prisma.Decimal(value);
}

function valueOrZero(value: DecimalInput | undefined): Decimal {
  return value === undefined ? new Prisma.Decimal(0) : decimal(value);
}

/**
 * Uses batch quantities as the canonical source. Display percentages from CTN
 * are rounded and may not sum to 100; persisted percentages must always do so.
 */
export function normalizePercentagesFromQuantities(
  ingredients: readonly NutritionIngredientInput[],
): NormalizedNutritionIngredient[] {
  if (ingredients.length === 0) throw new Error("La formulación debe tener al menos un ingrediente.");

  const quantities = ingredients.map((ingredient) => decimal(ingredient.quantity));
  if (quantities.some((quantity) => !quantity.isFinite() || quantity.lessThanOrEqualTo(0))) {
    throw new Error("Cada cantidad canónica debe ser mayor que cero.");
  }

  const totalQuantity = quantities.reduce((total, quantity) => total.plus(quantity), new Prisma.Decimal(0));
  const unitsPerPercentage = new Prisma.Decimal(10).pow(PERCENTAGE_PRECISION);
  const totalUnits = ONE_HUNDRED.mul(unitsPerPercentage);
  const rawUnits = quantities.map((quantity) => quantity.mul(totalUnits).div(totalQuantity));
  const allocatedUnits = rawUnits.map((raw) => raw.floor());
  const allocated = allocatedUnits.reduce((total, unit) => total.plus(unit), new Prisma.Decimal(0));
  const remaining = totalUnits.minus(allocated).toNumber();

  // Largest-remainder allocation is deterministic: ties preserve source order.
  const byRemainder = rawUnits
    .map((raw, index) => ({ index, remainder: raw.minus(allocatedUnits[index]) }))
    .sort((left, right) => {
      const comparison = right.remainder.comparedTo(left.remainder);
      return comparison === 0 ? left.index - right.index : comparison;
    });
  for (let index = 0; index < remaining; index += 1) {
    allocatedUnits[byRemainder[index].index] = allocatedUnits[byRemainder[index].index].plus(1);
  }

  return ingredients.map((ingredient, index) => ({
    ...ingredient,
    percentage: allocatedUnits[index].div(unitsPerPercentage),
  }));
}

export function calculateNutrition(
  ingredients: readonly NutritionIngredientInput[],
  portionGrams: DecimalInput,
): NutritionCalculation {
  const normalized = normalizePercentagesFromQuantities(ingredients);
  const portion = decimal(portionGrams);
  if (!portion.isFinite() || portion.lessThanOrEqualTo(0)) throw new Error("La porción debe ser mayor que cero.");

  const nutrientKeys = new Set(ingredients.flatMap((ingredient) => Object.keys(ingredient.nutrientsPer100g)));
  const per100g: Record<string, Decimal> = {};
  const perPortion: Record<string, Decimal> = {};
  const totalQuantity = normalized.reduce((total, ingredient) => total.plus(ingredient.quantity), new Prisma.Decimal(0));

  for (const key of nutrientKeys) {
    // Nutrients are conserved: no merma multiplier is applied here. The
    // calculation uses canonical quantities, not the 4-decimal persisted
    // percentages, so the storage reconciliation never changes nutrition.
    per100g[key] = normalized.reduce(
      (total, ingredient) => total.plus(valueOrZero(ingredient.nutrientsPer100g[key]).mul(decimal(ingredient.quantity)).div(totalQuantity)),
      new Prisma.Decimal(0),
    );
    perPortion[key] = per100g[key].mul(portion).div(ONE_HUNDRED);
  }

  const roundedFat = valueOrZero(per100g.FAT_TOTAL).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  const roundedCarbs = valueOrZero(per100g.CARBS_TOTAL).toDecimalPlaces(1, Prisma.Decimal.ROUND_HALF_UP);
  const roundedFiber = valueOrZero(per100g.FIBER).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  const roundedSugar = valueOrZero(per100g.SUGAR_TOTAL).toDecimalPlaces(1, Prisma.Decimal.ROUND_HALF_UP);
  const roundedProtein = valueOrZero(per100g.PROTEIN).toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP);
  const energyKcalPer100g = roundedFat.mul(9)
    .plus(roundedCarbs.minus(roundedFiber).minus(roundedSugar).mul(4))
    .plus(roundedFiber.mul(2))
    .plus(roundedSugar.mul(4))
    .plus(roundedProtein.mul(4));

  return {
    totalQuantity,
    ingredients: normalized,
    per100g,
    perPortion,
    energyKcalPer100g,
    energyKcalPerPortion: energyKcalPer100g.mul(portion).div(ONE_HUNDRED),
  };
}
