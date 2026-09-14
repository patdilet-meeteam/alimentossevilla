export type NutritionReadinessIssue =
  | "MISSING_ACTIVE_PROFILE"
  | "MULTIPLE_ACTIVE_PROFILES"
  | "ACTIVE_PROFILE_WITHOUT_VALUES";

export interface NutritionReadinessIngredient {
  ingredientId: string;
  ingredientName: string;
  siesaCode: string;
  activeProfileCount: number;
  activeValueCount: number;
  issues: NutritionReadinessIssue[];
}

export function assessNutritionReadiness(input: {
  ingredientId: string;
  ingredientName: string;
  siesaCode: string;
  activeProfiles: Array<{ valueCount: number }>;
}): NutritionReadinessIngredient {
  const activeProfileCount = input.activeProfiles.length;
  const activeValueCount = input.activeProfiles.reduce((total, profile) => total + profile.valueCount, 0);
  const issues: NutritionReadinessIssue[] = [];

  if (activeProfileCount === 0) issues.push("MISSING_ACTIVE_PROFILE");
  if (activeProfileCount > 1) issues.push("MULTIPLE_ACTIVE_PROFILES");
  if (activeProfileCount === 1 && activeValueCount === 0) {
    issues.push("ACTIVE_PROFILE_WITHOUT_VALUES");
  }

  return {
    ingredientId: input.ingredientId,
    ingredientName: input.ingredientName,
    siesaCode: input.siesaCode,
    activeProfileCount,
    activeValueCount,
    issues,
  };
}
