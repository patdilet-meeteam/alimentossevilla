export function getSourceRecipeEvidence(raw: unknown): { sheet: string; issues: string[]; percentageSum: string; quantitySum: string } | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return { sheet: "Fuente inválida", issues: ["Captura de receta fuente inválida"], percentageSum: "", quantitySum: "" };
  const source = raw as Record<string, unknown>;
  if (source.source !== "JUNE_RECIPE" || typeof source.sourceSheet !== "string") return { sheet: "Fuente inválida", issues: ["Captura de receta fuente inválida"], percentageSum: "", quantitySum: "" };
  return { sheet: source.sourceSheet, issues: Array.isArray(source.issues) ? source.issues.filter((item): item is string => typeof item === "string") : ["Falta revisión de la fuente"], percentageSum: String(source.percentageSum ?? ""), quantitySum: String(source.quantitySum ?? "") };
}
