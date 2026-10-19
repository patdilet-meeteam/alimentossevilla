import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";
import { buildReviewedBankPlan } from "@/lib/nutrition/reviewed-bank-plan";
const rows = [{ sourceRow: 18, ingredientName: "Piel de cerdo", sourceDetail: null, sourceCategory: "MPC", valuesPer100g: { SODIUM: new Prisma.Decimal(1820) } }, { sourceRow: 12, ingredientName: "Piel de Cerdo", sourceDetail: null, sourceCategory: "MPC", valuesPer100g: { SODIUM: new Prisma.Decimal("185.3") } }];
const targets = [{ siesaCode: "piel-de-cerdo-2", name: "Piel de cerdo" }];
const source = { fileName: "Banco.xlsx", sha256: "a".repeat(64) };
const mapping = { targetCode: "piel-de-cerdo-2", targetName: "Piel de cerdo", sourceRow: 18, sourceName: "Piel de cerdo", evidence: "17 valores coincidentes con snapshot y fila exacta del archivo cliente" };
describe("explicit bank source mapping", () => {
  it("uses the specified source row, preserving bibliography absence and no invented values", () => {
    const [plan] = buildReviewedBankPlan(rows, targets, [mapping], source);
    expect(plan.values).toHaveLength(1);
    expect(plan.values[0].value).toBe("1820");
    expect(plan.originalBibliography).toBeNull();
    expect(plan.sourceDetail).toContain("TN OFICIAL fila 18");
  });
  it("rejects stale names or a changed source row instead of normalizing away different profiles", () => {
    expect(() => buildReviewedBankPlan(rows, targets, [{ ...mapping, sourceRow: 12 }], source)).toThrow("Fila fuente");
    expect(() => buildReviewedBankPlan(rows, targets, [{ ...mapping, targetName: "Otra piel" }], source)).toThrow("Identidad");
  });
  it("preserves the source anomaly when an original comment establishes Arcon identity", () => {
    const [plan] = buildReviewedBankPlan([{ sourceRow: 27, ingredientName: "Proteína texturizada de Soya al 70%", sourceDetail: null, sourceCategory: "Proteína", valuesPer100g: { FAT_TOTAL: new Prisma.Decimal(0), FAT_SAT: new Prisma.Decimal("0.2") } }], [{ siesaCode: "arcon-t", name: "Arcon T" }], [{ targetCode: "arcon-t", targetName: "Arcon T", sourceRow: 27, sourceName: "Proteína texturizada de Soya al 70%", evidence: "Comentario TN OFICIAL!C27: Arcon T; T.N!C31 confirma" }], source);
    expect(plan.values.find(v => v.nutrientKey === "FAT_TOTAL")?.value).toBe("0");
    expect(plan.values.find(v => v.nutrientKey === "FAT_SAT")?.value).toBe("0.2");
    expect(plan.identityEvidence).toContain("C27");
  });
  it("never merges duplicate target codes", () => expect(() => buildReviewedBankPlan(rows, targets, [mapping, mapping], source)).toThrow("duplicado"));
});
