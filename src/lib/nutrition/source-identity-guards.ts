import evidence from "@/lib/nutrition/source-identity-evidence.json";
export function globalProfileIdentityIssue(code: string | undefined): string | null {
  return code && Object.prototype.hasOwnProperty.call(evidence.globalProfileBlockedCodes, code)
    ? evidence.globalProfileBlockedCodes[code as keyof typeof evidence.globalProfileBlockedCodes] : null;
}
export function assertGlobalProfileIdentity(code: string | undefined) {
  const issue = globalProfileIdentityIssue(code);
  if (issue) throw new Error(`Perfil global bloqueado para ${code}: requiere identidad por fila. ${issue}`);
}
export function sourceRowIdentityReview(sha: string, sheet: string, row: number, code: string, name: string) {
  const review = evidence.rows.find(item => item.sourceSha256 === sha && item.sourceSheet === sheet && item.sourceRow === row);
  if (!review) return null;
  if (review.sourceCode !== code || review.sourceName !== name) throw new Error("La identidad de fila revisada cambió; no se reutiliza su correspondencia.");
  return review;
}
