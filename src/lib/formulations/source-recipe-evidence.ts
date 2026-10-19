import {sourceWorkingIssues,type WorkingComponent} from "@/lib/formulations/source-working-review";
export function getSourceRecipeEvidence(raw: unknown,current?:readonly WorkingComponent[],review?:unknown): { sheet: string; issues: string[]; operationalIssues:string[]; percentageSum: string; quantitySum: string } | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw !== "object" || Array.isArray(raw)) return { sheet: "Fuente inválida", issues: ["Captura de receta fuente inválida"], operationalIssues:[], percentageSum: "", quantitySum: "" };
  const source = raw as Record<string, unknown>;
  if (!["JUNE_RECIPE","APP_VERSION"].includes(String(source.source)) || typeof source.sourceSheet !== "string") return { sheet: "Fuente inválida", issues: ["Captura de receta fuente inválida"], operationalIssues:[], percentageSum: "", quantitySum: "" };
  const reviewRecord=review&&typeof review==='object'&&!Array.isArray(review)?review as Record<string,unknown>:null;
  const originalIssues=Array.isArray(source.issues)?source.issues.filter((item):item is string=>typeof item==='string'):['Falta revisión de la fuente'];
  const incomplete=!/^[a-f0-9]{64}$/i.test(String(source.sourceSha256??''))||!Array.isArray(source.sourceRows)||source.sourceRows.length===0;
  const issues=reviewRecord?.kind==='SOURCE_WORKING_REVIEW'?sourceWorkingIssues(review,current):[...originalIssues.filter(item=>item!=='CURRENT_VERSION_NOT_ESTABLISHED'),...(incomplete?['Falta captura completa de la fuente']:[])];
  return {sheet:source.sourceSheet,issues,operationalIssues:['La vigencia de la copia de trabajo corresponde al acto de aprobación del Director Técnico; no se deduce del orden de hojas.'],percentageSum:String(source.percentageSum??''),quantitySum:String(source.quantitySum??'')};
}
