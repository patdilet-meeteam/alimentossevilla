import { describe, expect, it } from "vitest";
import { portionsPerPackage } from "@/lib/products/presentation-metrics";

describe("presentation serving count", () => {
  it("uses grams per serving rather than a legacy serving count", () => {
    expect(portionsPerPackage("115", "23")).toBe(5);
    expect(portionsPerPackage("480", "34.29")).toBeCloseTo(13.9982502187, 8);
  });
  it("preserves fractional serving counts", () => {
    expect(portionsPerPackage("115", "40")).toBe(2.875);
  });
  it.each([null, "", "0", "-1", "NaN", "Infinity"])("does not display invalid portion %s", (portion) => {
    expect(portionsPerPackage("115", portion)).toBeNull();
  });
});
