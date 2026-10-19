import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {describe, it, expect} from "vitest";
import {parseNutritionalBankWorkbook} from "@/lib/nutrition/nutritional-bank-import";
import {buildReviewedBankPlan, type BankTargetMapping} from "@/lib/nutrition/reviewed-bank-plan";
const folder = "deliverables/sevilla-review/materiales/";
describe("all thirteen newly documented candidate mappings against original bank", () => {
  it("reproduces every nutrient from the hash-verified original without commercial aliases or rounding", async () => {
    const mapping = JSON.parse(readFileSync(folder + "mapeo_13_codigos_candidatos_identidad_literal.json", "utf8")) as {sourceSha256: string; mappings: BankTargetMapping[]};
    const targets = JSON.parse(readFileSync(folder + "destinos_13_codigos_candidatos.json", "utf8"));
    const buffer = readFileSync(folder + "fuentes/banco_nutricional_original.xlsx");
    expect(createHash("sha256").update(buffer).digest("hex")).toBe(mapping.sourceSha256);
    const rows = await parseNutritionalBankWorkbook(buffer);
    const plan = buildReviewedBankPlan(rows, targets, mapping.mappings, {fileName: "banco_nutricional_original.xlsx", sha256: mapping.sourceSha256});
    expect(plan).toHaveLength(13);
    expect(plan.flatMap(p => p.values)).toHaveLength(221);
    const literal = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
    for (const entry of mapping.mappings) expect(literal(entry.targetName)).toBe(literal(entry.sourceName));
    expect(plan.flatMap(p => p.storagePrecisionIssues)).toEqual([]);
    expect(plan.find(p => p.ingredientSiesaCode === "2906001")?.values.find(v => v.nutrientKey === "FIBER")?.value).toBe("0.011013722162007404");
  });
});
