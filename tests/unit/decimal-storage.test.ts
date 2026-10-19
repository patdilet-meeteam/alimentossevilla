import { describe, it, expect } from "vitest";
import { fitsSourceDecimal } from "@/lib/decimal-storage";
import { addIngredientToVersionSchema } from "@/lib/validations/products";
import { nutrientValueSchema } from "@/lib/validations/ingredients";
describe("source decimal storage boundary", () => {
  it("preserves source precision through 24 fractional and 14 integer digits", () => {
    for (const value of ["0", "9.4272", "0.011013722162007404", "99999999999999.123456789012345678901234", "1e-24", "0.0000000000000000000000010"]) expect(fitsSourceDecimal(value)).toBe(true);
  });
  it("refuses truncation and overflow rather than rounding", () => {
    for (const value of ["1e-25", "0.1234567890123456789012345", "100000000000000", "NaN", "Infinity", "1e9999999"]) expect(fitsSourceDecimal(value)).toBe(false);
    expect(nutrientValueSchema.safeParse({ nutrientId: "x", value: 1e-25 }).success).toBe(false);
    expect(addIngredientToVersionSchema.safeParse({ formulationVersionId: "v", ingredientId: "i", porcentajeParticipacion: 1e-25 }).success).toBe(false);
  });
  it("accepts raw decimal strings without a Number conversion and checks exact boundaries", () => {
    const exact = "99.999999999999999999999999";
    const parsed = addIngredientToVersionSchema.parse({formulationVersionId: "v", ingredientId: "i", porcentajeParticipacion: exact});
    expect(parsed.porcentajeParticipacion).toBe(exact);
    for (const value of ["100.000000000000000000000001", "-0.000000000000000000000001", "", "1e-25"]) expect(addIngredientToVersionSchema.safeParse({formulationVersionId: "v", ingredientId: "i", porcentajeParticipacion: value}).success).toBe(false);
    expect(nutrientValueSchema.parse({nutrientId: "n", value: "0.011013722162007404"}).value).toBe("0.011013722162007404");
  });

});
