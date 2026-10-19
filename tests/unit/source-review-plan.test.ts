import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { sumExactDecimalStrings } from "@/lib/formulations/exact-decimal-sum";
const require = createRequire(import.meta.url);
const { validate } = require("../../scripts/lib/atomic-source-review.cjs");
const plan = { mode: "REVIEW_DATA_ONLY_NOT_CURRENT_LOAD_PLAN", noNormalization: true, noApprovals: true, productionEligible: false, currentSelection: null, sourceSha256: "a".repeat(64), bundles: [], recipes: [{ productCode: "fixture", sourceSheet: "Fixture", sourceSha256: "a".repeat(64), sourceRows: [{ sourceRow: 1, sourceCode: "X01", sourceName: "Fixture", quantity: "0.1234567890123456789012", percentage: "99.999999999999999999" }], quantitySum: "0.1234567890123456789012", percentageSum: "99.999999999999999999" }] };
describe("review import plan boundary", () => {
 it("allows literal non100 draft values without normalizing precision", () => expect(() => validate(plan, sumExactDecimalStrings)).not.toThrow());
 it("rejects a request to make source data current or approved", () => expect(() => validate({ ...plan, productionEligible: true }, sumExactDecimalStrings)).toThrow("REVIEW_ONLY"));
 it("rejects duplicate natural source keys", () => expect(() => validate({ ...plan, recipes: [...plan.recipes, ...plan.recipes] }, sumExactDecimalStrings)).toThrow("DUPLICATE"));
 it("rejects more fractional precision than storage rather than rounding", () => { const p=structuredClone(plan);p.recipes[0].sourceRows[0].quantity="0.1234567890123456789012345";expect(()=>validate(p,sumExactDecimalStrings)).toThrow("EXACT_STORAGE"); });
 it("detects a changed declared source sum", () => { const p=structuredClone(plan);p.recipes[0].percentageSum="100";expect(()=>validate(p,sumExactDecimalStrings)).toThrow("PERCENT_TOTAL"); });
});
