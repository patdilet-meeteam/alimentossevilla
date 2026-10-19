"use server";
import {reviewFeedback} from "@/lib/formulations/review-feedback";
import {ReviewValidationError} from "@/lib/formulations/review-validation-error";
import {createHash} from "node:crypto";
import {db} from "@/lib/db";
import {getCurrentUser} from "@/lib/auth/session";
import {requireRole} from "@/lib/auth/roles";
import {Prisma,Role} from "@prisma/client";
import {revalidatePath} from "next/cache";
import {z} from "zod";
import {sourceWorkingReviewSchema,buildSourceWorkingReview,workingCompositionSignature} from "@/lib/formulations/source-working-review";
export async function saveSourceWorkingDraft(raw:unknown){
 const user=await getCurrentUser();if(!user)throw Error('Unauthorized');requireRole(user.role,[Role.ADMIN,Role.R_AND_D]);const input=sourceWorkingReviewSchema.parse(raw);
 const result=await db.$transaction(async tx=>{
  const origin=await tx.formulationVersion.findUnique({where:{id:input.originVersionId},include:{formulation:true,ingredients:{orderBy:{id:'asc'},include:{ingredient:true}}}});if(!origin)throw new ReviewValidationError('Versión fuente no encontrada');
  const locks=await tx.$queryRaw<{locked:boolean}[]>`SELECT pg_try_advisory_xact_lock(hashtext(${origin.formulationId})) AS locked`;
  if(!locks[0]?.locked)throw new ReviewValidationError("Otra copia de esta formulación se está preparando; vuelva a intentarlo.");
  if(workingCompositionSignature(origin.ingredients.map(r=>({ingredientId:r.ingredientId,percentage:r.porcentajeParticipacion.toString(),quantity:r.cantidadCanonica?.toString()??null})))!==input.originCompositionSignature)throw new ReviewValidationError("La versión de origen cambió; recargue antes de preparar la copia.");
  const ingredients=await tx.ingredient.findMany({where:{id:{in:input.rows.flatMap(r=>r.ingredientId?[r.ingredientId]:[])}},include:{profiles:{where:{isActive:true},include:{values:{include:{nutrient:true}}}}}});
  const appRows=origin.ingredients.map((r,i)=>({sourceRow:i+1,sourceComponentId:r.id,sourceCode:r.ingredient.siesaCode,sourceName:r.ingredient.name,quantity:r.cantidadCanonica?.toString()??null,percentage:r.porcentajeParticipacion.toString()}));
  const appEvidence={source:'APP_VERSION',sourceSheet:`Versión registrada v${origin.numeroSecuencial}`,originVersionId:origin.id,registeredVersionCreatedAt:origin.createdAt.toISOString(),sourceRows:appRows,issues:['SOURCE_QUANTITY_UNIT_REQUIRES_CONFIRMATION'],currentStatus:'SELECTION_REQUIRES_DIRECTOR_APPROVAL',productionEligible:false};
  const rawSource=origin.sourceRecipeSnapshot??{...appEvidence,sourceSha256:createHash('sha256').update(JSON.stringify(appEvidence)).digest('hex')};
  const built=buildSourceWorkingReview(rawSource,input,ingredients);const highest=await tx.formulationVersion.findFirst({where:{formulationId:origin.formulationId},orderBy:{numeroSecuencial:'desc'}});
  const version=await tx.formulationVersion.create({data:{formulationId:origin.formulationId,numeroSecuencial:(highest?.numeroSecuencial??0)+1,estado:'DRAFT',rendimientoEsperado:origin.rendimientoEsperado,sourceRecipeSnapshot:rawSource as Prisma.InputJsonValue,sourceReviewSnapshot:{...built.review,preparedBy:user.id,preparedAt:new Date().toISOString()},nutritionSourceSnapshot:built.nutritionSnapshot,ingredients:{create:built.components.map(c=>({ingredientId:c.ingredientId,porcentajeParticipacion:c.percentage,cantidadCanonica:c.quantity}))}}});
  await tx.auditEvent.create({data:{actorId:user.id,actorEmail:user.email,action:'formulation_version.source_working_draft',entity:'FormulationVersion',entityId:version.id,metadata:{originVersionId:origin.id,sourceSha256:built.review.sourceSha256,unit:input.unit,reference:input.reference,rowDecisions:built.review.rowDecisions,approvalCreated:false}}});
  return {versionId:version.id,productId:origin.formulation.productId};
 },{isolationLevel:'Serializable',timeout:30000});revalidatePath(`/productos/${result.productId}`);return result;
}
const speciesSchema=z.object({versionId:z.string().min(1),contributions:z.array(z.object({ingredientId:z.string().min(1),role:z.enum(['UNKNOWN','MEAT','FAT','OTHER']),species:z.string().nullable(),evidence:z.string().nullable()})).max(500)});
export async function saveVersionSpeciesClassification(raw:unknown){
 const user=await getCurrentUser();if(!user)throw Error('Unauthorized');requireRole(user.role,[Role.ADMIN,Role.R_AND_D]);const input=speciesSchema.parse(raw);
 const result=await db.$transaction(async tx=>{
  const version=await tx.formulationVersion.findUnique({where:{id:input.versionId},include:{formulation:true,ingredients:{include:{ingredient:true}}}});if(!version||version.estado!=='DRAFT')throw new ReviewValidationError('Solo se clasifica una versión en borrador');
  const ids=version.ingredients.filter(r=>r.porcentajeParticipacion.gt(0)).map(r=>r.ingredientId);if(input.contributions.length!==ids.length||new Set(input.contributions.map(r=>r.ingredientId)).size!==ids.length||input.contributions.some(r=>!ids.includes(r.ingredientId)))throw new ReviewValidationError('La composición cambió; revise las clasificaciones');
  if(input.contributions.some(r=>r.role!=='UNKNOWN'&&(!r.evidence?.trim()||(['MEAT','FAT'].includes(r.role)&&!r.species?.trim()))))throw new ReviewValidationError('Una clasificación requiere fuente y, para carne/grasa, especie explícita');
  const prior=version.sourceReviewSnapshot&&typeof version.sourceReviewSnapshot==='object'&&!Array.isArray(version.sourceReviewSnapshot)?version.sourceReviewSnapshot:{};
  const speciesClassifications=input.contributions.map(r=>({...r,ingredientCode:version.ingredients.find(i=>i.ingredientId===r.ingredientId)!.ingredient.siesaCode,ingredientName:version.ingredients.find(i=>i.ingredientId===r.ingredientId)!.ingredient.name}));
  const updated=await tx.formulationVersion.updateMany({where:{id:version.id,estado:'DRAFT'},data:{sourceReviewSnapshot:{...prior,speciesClassifications,speciesPreparedBy:user.id,speciesPreparedAt:new Date().toISOString()}}});if(updated.count!==1)throw new ReviewValidationError('La versión dejó de ser editable');
  await tx.auditEvent.create({data:{actorId:user.id,actorEmail:user.email,action:'formulation_version.species_classification',entity:'FormulationVersion',entityId:version.id,metadata:{speciesClassifications}}});return version.formulation.productId;
 });revalidatePath(`/productos/${result}`);return {ok:true};
}

export async function saveSourceWorkingDraftFeedback(raw:unknown){return reviewFeedback(()=>saveSourceWorkingDraft(raw));}
export async function saveVersionSpeciesClassificationFeedback(raw:unknown){return reviewFeedback(()=>saveVersionSpeciesClassification(raw));}
