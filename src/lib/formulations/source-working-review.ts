import {ReviewValidationError} from "@/lib/formulations/review-validation-error";
import {z} from "zod";
import {exactNonnegativeDecimal} from "@/lib/validations/source-decimal";
import {sumExactDecimalStrings as sum} from "@/lib/formulations/exact-decimal-sum";
import {sourceRowIdentityReview,globalProfileIdentityIssue} from "@/lib/nutrition/source-identity-guards";
export const sourceWorkingReviewSchema=z.object({originVersionId:z.string().min(1),originCompositionSignature:z.string().min(1),unit:z.enum(["g","kg","UNCONFIRMED"]),reference:z.string().trim().min(1).max(4000),finishedProduct:z.boolean().default(false),rows:z.array(z.object({sourceRow:z.number().int().positive(),added:z.boolean().default(false),ingredientId:z.string().nullable(),exclude:z.boolean(),quantity:z.union([exactNonnegativeDecimal(100000),z.literal('')]),percentage:z.union([exactNonnegativeDecimal(100),z.literal('')]),reason:z.string().trim().max(4000)})).min(1).max(500)});
export type SourceWorkingReviewInput=z.infer<typeof sourceWorkingReviewSchema>;
export interface WorkingComponent {ingredientId:string;percentage:string;quantity:string|null}
export interface SourceReviewIngredient {id:string;siesaCode:string;name:string;isActive:boolean;profiles:Array<{id?:string;sourceDetail:string|null;values:Array<{value:{toString():string};nutrient:{key:string}}>}>}
function record(value:unknown):Record<string,unknown>|null{return value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;}
export function workingCompositionSignature(rows:readonly WorkingComponent[]):string{return JSON.stringify(rows.map(r=>({ingredientId:r.ingredientId,percentage:sum([r.percentage]),quantity:r.quantity===null?null:sum([r.quantity])})).sort((a,b)=>a.ingredientId.localeCompare(b.ingredientId)));}
export function sourceWorkingIssues(reviewRaw:unknown,current?:readonly WorkingComponent[]):string[]{
 const r=record(reviewRaw);if(!r||r.kind!=='SOURCE_WORKING_REVIEW')return ['Falta conciliación de la copia de trabajo'];
 if(!r.reference||!['g','kg'].includes(String(r.unit))||!Array.isArray(r.components)||!Array.isArray(r.rowDecisions)||!r.rowDecisions.length)return ['La conciliación guardada está incompleta'];
 if(r.rowDecisions.some(row=>record(row)?.pending===true))return ['Hay filas fuente pendientes de identidad, cantidad o porcentaje'];
 if(r.requiresAssembly&&!r.finishedProductConfirmed)return ['La fuente corresponde a una subformulación; documente el ensamble del producto terminado'];
 const components=r.components as WorkingComponent[];if(!current||workingCompositionSignature(components)!==workingCompositionSignature(current))return ['La composición cambió después de conciliar; guarde una nueva copia revisada'];
 if(sum(current.map(c=>c.percentage))!=='100')return ['La copia de trabajo debe sumar exactamente100; no se normaliza'];
 if(!current.length||sum(current.map(c=>c.quantity??'0'))==='0')return ['Falta cantidad de entrada de la copia de trabajo'];
 return [];
}
export function buildSourceWorkingReview(rawSource:unknown,input:SourceWorkingReviewInput,ingredients:readonly SourceReviewIngredient[]){
 const source=record(rawSource);if(!source||!['JUNE_RECIPE','APP_VERSION'].includes(String(source.source))||!Array.isArray(source.sourceRows)||typeof source.sourceSha256!=='string'||typeof source.sourceSheet!=='string')throw new ReviewValidationError('La versión no contiene una receta fuente revisable');
 const originals=source.sourceRows.map(record);if(originals.some(r=>!r))throw new ReviewValidationError('Fila fuente inválida');
 if(input.rows.filter(r=>!r.added).length!==originals.length||new Set(input.rows.map(r=>r.sourceRow)).size!==input.rows.length)throw new ReviewValidationError('Debe resolver cada fila fuente exactamente una vez');
 originals.push(...input.rows.filter(r=>r.added).map(r=>({sourceRow:r.sourceRow,sourceCode:'',sourceName:'Fila añadida en copia de trabajo',quantity:null,percentage:null,added:true})));
 const groups=new Map<string,{p:string[];q:string[]}>();const nutrientRows=[];const decisions=[];
 for(const original of originals){const row=original!;const choice=input.rows.find(r=>r.sourceRow===Number(row.sourceRow));if(!choice)throw new ReviewValidationError('Falta una decisión de fila fuente');
  if(choice.exclude){if(!choice.reason)throw new ReviewValidationError('Excluir una fila requiere motivo explícito');decisions.push({...choice,sourceCode:String(row.sourceCode??''),sourceName:String(row.sourceName??'')});continue;}
  if(!choice.ingredientId||String(choice.quantity)===''||String(choice.percentage)===''){decisions.push({...choice,pending:true,sourceCode:String(row.sourceCode??''),sourceName:String(row.sourceName??'')});continue;}
  const ingredient=ingredients.find(i=>i.id===choice.ingredientId&&i.isActive);if(!ingredient)throw new ReviewValidationError('Seleccione un ingrediente maestro activo para cada fila incluida');
  const changed=ingredient.siesaCode!==row.sourceCode||ingredient.name!==row.sourceName||sum([String(row.quantity??'0')])!==sum([String(choice.quantity)])||sum([String(row.percentage??'0')])!==sum([String(choice.percentage)]);
  if(changed&&!choice.reason)throw new ReviewValidationError('Cada cambio de identidad, cantidad o porcentaje requiere evidencia o motivo');
  const scoped=choice.added?null:sourceRowIdentityReview(source.sourceSha256,source.sourceSheet,Number(row.sourceRow),String(row.sourceCode),String(row.sourceName));
  const blocked=globalProfileIdentityIssue(ingredient.siesaCode);const scoped874=scoped?.reviewedNutrientSource?.sourceRow===61&&ingredient.siesaCode==='1260025';
  if(blocked&&!scoped874)throw new ReviewValidationError('El código maestro seleccionado requiere identidad por fila; seleccione el material canónico correcto');
  const canonicalPotato=scoped?.reviewedNutrientSource?.sourceRow===46&&['1260011','almid-n-de-papa'].includes(ingredient.siesaCode);
  const canonicalYuca=scoped?.reviewedNutrientSource?.sourceRow===47&&['1260015','almid-n-de-yuca'].includes(ingredient.siesaCode);
  const scopedProfile=(scoped874||canonicalPotato||canonicalYuca)?scoped?.reviewedNutrientSource:null;
  const profile=ingredient.profiles.length===1?ingredient.profiles[0]:null;
  const nutrients=scopedProfile?.valuesPer100g??Object.fromEntries((profile?.values??[]).map(v=>[v.nutrient.key,v.value.toString()]));
  const q=String(choice.quantity),p=String(choice.percentage);const group=groups.get(ingredient.id)??{p:[],q:[]};group.p.push(p);group.q.push(q);groups.set(ingredient.id,group);
  nutrientRows.push({sourceRow:Number(row.sourceRow),sourceCode:String(row.sourceCode),sourceName:ingredient.name,ingredientId:ingredient.id,quantity:q,nutrientsPer100g:nutrients,profileId:scopedProfile?null:profile?.id??null,sourceDetail:scopedProfile?`TN OFICIAL fila${scopedProfile.sourceRow} SHA${scopedProfile.sourceSha256}`:profile?.sourceDetail??null});
  decisions.push({...choice,quantity:q,percentage:p,sourceCode:String(row.sourceCode??''),sourceName:String(row.sourceName??''),targetCode:ingredient.siesaCode,targetName:ingredient.name,nutrientSource:scopedProfile??null});
 }
 const components=[...groups].map(([ingredientId,g])=>({ingredientId,percentage:sum(g.p),quantity:sum(g.q)}));
 return {review:{kind:'SOURCE_WORKING_REVIEW',originVersionId:input.originVersionId,sourceSha256:source.sourceSha256,sourceSheet:source.sourceSheet,unit:input.unit,reference:input.reference,rowDecisions:decisions,components,requiresAssembly:source.scopeClass==='SUBFORMULA_BASE_NOT_FINISHED_PRODUCT',finishedProductConfirmed:input.finishedProduct,approvalRequired:true},components,nutritionSnapshot:{source:'SOURCE_REVIEW',sourceFileName:`Copia revisada de ${source.sourceSheet}`,rows:nutrientRows}};
}

export function readVersionSpeciesClassifications(raw:unknown,ingredients:readonly {id:string;name:string;siesaCode:string}[]):Record<string,import("@/lib/nutrition/species-fat-rule").SpeciesContribution>{
 const data=record(raw);const result:Record<string,import("@/lib/nutrition/species-fat-rule").SpeciesContribution>={};
 for(const item of Array.isArray(data?.speciesClassifications)?data.speciesClassifications:[]){const r=record(item);if(!r)continue;const ingredient=ingredients.find(i=>i.id===r.ingredientId&&i.name===r.ingredientName&&i.siesaCode===r.ingredientCode);if(!ingredient||!['UNKNOWN','MEAT','FAT','OTHER'].includes(String(r.role)))continue;result[ingredient.id]={ingredientId:ingredient.id,role:r.role as import("@/lib/nutrition/species-fat-rule").SpeciesContribution['role'],species:typeof r.species==='string'?r.species:null,evidence:typeof r.evidence==='string'?r.evidence:null};}
 return result;
}
