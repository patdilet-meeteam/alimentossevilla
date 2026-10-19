import type { NutritionalBankRow } from "@/lib/nutrition/nutritional-bank-import";
export interface BankTargetMapping {
  targetCode: string;
  targetName: string;
  sourceRow: number;
  sourceName: string;
  evidence: string;
}
/** Build a read-only plan from explicit, source-checked mappings; never merge master records. */
export function buildReviewedBankPlan(
  rows: readonly NutritionalBankRow[],
  targets: readonly { siesaCode: string; name: string }[],
  mappings: readonly BankTargetMapping[],
  source: { fileName: string; sha256: string },
) {
  if (!/^[a-f0-9]{64}$/i.test(source.sha256) || !source.fileName) throw new Error("La fuente requiere nombre y SHA-256.");
  const seen = new Set<string>();
  return mappings.map((mapping) => {
    if (seen.has(mapping.targetCode)) throw new Error(`Destino duplicado: ${mapping.targetCode}`);
    seen.add(mapping.targetCode);
    const target = targets.filter((item) => item.siesaCode === mapping.targetCode);
    const row = rows.filter((item) => item.sourceRow === mapping.sourceRow);
    if (target.length !== 1 || target[0].name !== mapping.targetName) throw new Error(`Identidad destino cambió: ${mapping.targetCode}`);
    if (row.length !== 1 || row[0].ingredientName !== mapping.sourceName || !mapping.evidence.trim()) throw new Error(`Fila fuente sin evidencia inequívoca: ${mapping.sourceRow}`);
    return {
      ingredientSiesaCode: mapping.targetCode,
      ingredientName: mapping.targetName,
      source: "BANCO_ALIMENTOS" as const,
      sourceDetail: `${source.fileName} / TN OFICIAL fila ${mapping.sourceRow} / SHA-256 ${source.sha256}`,
      originalBibliography: row[0].sourceDetail,
      identityEvidence: mapping.evidence,
      referenceBase: "100g",
      values: Object.entries(row[0].valuesPer100g).map(([nutrientKey, value]) => ({ nutrientKey, value: value.toString(), method: `TN OFICIAL fila ${mapping.sourceRow}` })),
      storagePrecisionIssues: Object.entries(row[0].valuesPer100g).filter(([, value]) => value.decimalPlaces() > 4).map(([key]) => key),
    };
  });
}
