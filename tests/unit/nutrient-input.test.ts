import {it, expect} from "vitest";
import {updateNutrientInput} from "@/lib/nutrition/nutrient-input";
it("preserves every entered digit and explicit zero, while clearing removes rather than fabricates zero", () => {
  const exact = "0.011013722162007404";
  const values = updateNutrientInput([], "fiber", exact);
  expect(values[0].value).toBe(exact);
  expect(updateNutrientInput(values, "fiber", "")).toEqual([]);
  expect(updateNutrientInput(values, "fiber", "0")[0].value).toBe("0");
  expect(values[0].value).toBe(exact);
});
