import {readFileSync} from "node:fs";
import {describe, it, expect} from "vitest";
import evidence from "@/lib/nutrition/source-identity-evidence.json";
import {assertGlobalProfileIdentity, sourceRowIdentityReview} from "@/lib/nutrition/source-identity-guards";
import {buildReviewedBankPlan} from "@/lib/nutrition/reviewed-bank-plan";
import {parseNutritionalBankWorkbook} from "@/lib/nutrition/nutritional-bank-import";
describe("source identities are reviewed per occurrence", () => {
 it("keeps potato/yuca distinct and closes only the explicit JMN MeatPlus874 row", () => {
  const potato=evidence.rows.find(r=>r.sourceCode==='MPPA144'&&r.sourceName.includes('PAPA'))!;
  const yuca=evidence.rows.find(r=>r.sourceCode==='MPPA144'&&r.sourceName.includes('YUCA'))!;
  expect(potato.reviewedNutrientSource?.sourceRow).toBe(46);expect(yuca.reviewedNutrientSource?.sourceRow).toBe(47);
  const jmn=evidence.rows.find(r=>r.sourceCode==='1260025'&&r.sourceSheet.startsWith('JMN'))!;
  const morta=evidence.rows.find(r=>r.sourceCode==='1260025'&&r.sourceSheet.startsWith('MORTA'))!;
  expect(jmn.reviewedNutrientSource?.sourceRow).toBe(61);expect(morta.reviewedNutrientSource).toBeUndefined();expect(morta.identityStatus).toBe('UNPROVEN_SHORT_NAME_ALIAS');
  expect(sourceRowIdentityReview(jmn.sourceSha256,jmn.sourceSheet,jmn.sourceRow,jmn.sourceCode,jmn.sourceName)).toBe(jmn);
  expect(()=>sourceRowIdentityReview(jmn.sourceSha256,jmn.sourceSheet,jmn.sourceRow,jmn.sourceCode,'OTHER')).toThrow('identidad');
 });
 it("reproduces all85 reviewed row values from the original bank without filling or replacing profiles", async () => {
  const rows=await parseNutritionalBankWorkbook(readFileSync('deliverables/sevilla-review/materiales/fuentes/banco_nutricional_original.xlsx'));
  let count=0;
  for(const item of evidence.rows){const source=item.reviewedNutrientSource;if(!source)continue;const bank=rows.find(r=>r.sourceRow===source.sourceRow)!;expect(bank.ingredientName).toBe(source.sourceName);for(const [key,value] of Object.entries(source.valuesPer100g)){expect(bank.valuesPer100g[key].eq(value)).toBe(true);count++;}}
  expect(count).toBe(85);
 });
 it("refuses global profile plans for codes whose source identity remains row specific", () => {
  for(const code of ['MPPA144','1260025','MPCP031']) expect(()=>assertGlobalProfileIdentity(code)).toThrow('Perfil global bloqueado');
  expect(()=>assertGlobalProfileIdentity('1260011')).not.toThrow();
  expect(()=>buildReviewedBankPlan([],[],[{targetCode:'MPPA144',targetName:'Papa',sourceRow:46,sourceName:'Almidón de Papa',evidence:'only one source row'}],{fileName:'Banco.xlsx',sha256:'a'.repeat(64)})).toThrow('Perfil global bloqueado');
 });
 it("records675 only as a candidate reconstruction with the original900 conflict retained", () => {
  const weight=evidence.bundleReconstructions[0];expect(weight.reconstructedWeightGrams).toBe('675');expect(weight.conflictingDeclaredWeightGrams).toBe('900');expect(weight.status).toBe('CANDIDATE_RECONSTRUCTION_NOT_APPROVED');expect(weight.evidence.C14.value).toBe('900');
 });
});
