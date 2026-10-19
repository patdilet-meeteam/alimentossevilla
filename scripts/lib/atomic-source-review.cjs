const {createHash}=require('node:crypto');
const {Prisma}=require('@prisma/client');
const stable=x=>JSON.stringify(x,(_k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.entries(v).sort(([a],[b])=>a.localeCompare(b))):v);
const hash=x=>createHash('sha256').update(stable(x)).digest('hex');
const models=['ingredient','product','presentation','formulation','formulationVersion','formulationIngredient','productBundleVersion','productBundleComponent','nutrient','nutritionalProfile','nutrientValue'];
async function snapshot(db){const result={};for(const name of models)result[name]=await db[name].findMany({orderBy:{id:'asc'}});return result;}
async function counts(db){return {ingredients:await db.ingredient.count(),products:await db.product.count(),presentations:await db.presentation.count(),formulations:await db.formulation.count(),versions:await db.formulationVersion.count(),components:await db.formulationIngredient.count(),bundles:await db.productBundleVersion.count(),bundleComponents:await db.productBundleComponent.count(),profiles:await db.nutritionalProfile.count(),nutrientValues:await db.nutrientValue.count(),approvals:await db.formulationVersion.count({where:{estado:'APPROVED'}}),bundleApprovals:await db.productBundleVersion.count({where:{status:'APPROVED'}})};}
function validate(plan,sum){
 if(!plan.noNormalization||!plan.noApprovals||plan.productionEligible!==false||plan.currentSelection!==null||plan.mode!=='REVIEW_DATA_ONLY_NOT_CURRENT_LOAD_PLAN')throw Error('REVIEW_ONLY_PLAN_REQUIRED');
 if(!/^[a-f0-9]{64}$/.test(plan.sourceSha256)||!Array.isArray(plan.recipes)||!Array.isArray(plan.bundles))throw Error('INVALID_SOURCE_PLAN');
 const seen=new Set();for(const r of [...plan.recipes,...plan.bundles]){const key=r.productCode+'\0'+r.sourceSheet;if(!r.productCode||!r.sourceSheet||seen.has(key)||r.sourceSha256!==plan.sourceSha256||!Array.isArray(r.sourceRows))throw Error('DUPLICATE_OR_INVALID_SOURCE');seen.add(key);
  for(const row of r.sourceRows)for(const k of ['quantity','percentage','netWeightGrams'])if(row[k]!==null&&row[k]!==undefined){if(typeof row[k]!=='string')throw Error('SOURCE_DECIMAL_MUST_BE_STRING');const n=sum([row[k]]);const [whole,fraction='']=n.replace(/^-/,'').split('.');if(n.startsWith('-')||whole.length>14||fraction.length>24)throw Error('SOURCE_DECIMAL_OUTSIDE_EXACT_STORAGE');}
  if(r.percentageSum!==undefined&&sum(r.sourceRows.map(x=>x.percentage??'0'))!==sum([r.percentageSum]))throw Error('SOURCE_PERCENT_TOTAL_MISMATCH');
  if(r.quantitySum!==undefined&&sum(r.sourceRows.map(x=>x.quantity??'0'))!==sum([r.quantitySum]))throw Error('SOURCE_QUANTITY_TOTAL_MISMATCH');
 }
}
function componentView(rows,sum){return rows.map(r=>({ingredientId:r.ingredientId,percentage:sum([r.porcentajeParticipacion.toString()]),quantity:r.cantidadCanonica===null?null:sum([r.cantidadCanonica.toString()])})).sort((a,b)=>a.ingredientId.localeCompare(b.ingredientId));}
function bundleView(rows,sum){return rows.map(r=>({sourceCode:r.sourceCode,sourceName:r.sourceName,unitCount:sum([r.unitCount.toString()]),netWeightGrams:r.netWeightGrams===null?null:sum([r.netWeightGrams.toString()]),memberProductId:r.memberProductId,sourceReference:r.sourceReference})).sort((a,b)=>(a.sourceCode+'\0'+a.sourceName).localeCompare(b.sourceCode+'\0'+b.sourceName));}
async function importSourceReview(db,plan,{sum,apply=false}={}){
 if(typeof sum!=='function')throw Error('EXACT_DECIMAL_HELPER_REQUIRED');validate(plan,sum);let report;
 try{await db.$transaction(async tx=>{
  const lock=await tx.$queryRaw`SELECT pg_try_advisory_xact_lock(94615333) AS locked`;if(!lock[0]?.locked)throw Error('ANOTHER_SOURCE_IMPORT_RUNNING');
  const beforeRows=await snapshot(tx);const before=await counts(tx);const createdIngredients=[],recipes=[],bundles=[];const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().replace(/\s+/g,' ').toUpperCase();
  for(const recipe of plan.recipes){
   const product=await tx.product.findUnique({where:{codigoInterno:recipe.productCode},include:{formulations:{include:{versions:{include:{ingredients:true}}}}}});if(!product)throw Error('UNRESOLVED_RECIPE_PRODUCT');
   let formulation=product.formulations[0];if(!formulation)formulation=await tx.formulation.create({data:{productId:product.id},include:{versions:{include:{ingredients:true}}}});
   const matches=formulation.versions.filter(v=>v.sourceRecipeSnapshot?.sourceSha256===plan.sourceSha256&&v.sourceRecipeSnapshot?.sourceSheet===recipe.sourceSheet);if(matches.length>1)throw Error('AMBIGUOUS_EXISTING_SOURCE_VERSION');const old=matches[0];
   const issues=[...recipe.issues,'CURRENT_VERSION_NOT_ESTABLISHED','SOURCE_QUANTITY_UNIT_REQUIRES_CONFIRMATION'];if(sum([recipe.percentageSum])!=='100')issues.push('SOURCE_PERCENTAGE_SUM_NOT_EXACT_100');
   const groups=new Map(),unresolved=[];
   for(const row of recipe.sourceRows){
    if(!row.sourceCode||['0','CREAR','#N/A','#REF!'].includes(row.sourceCode)||row.quantity===null||row.percentage===null){unresolved.push(row.sourceRow);issues.push('UNRESOLVED_SOURCE_ROW_'+row.sourceRow);continue;}
    let ingredient=await tx.ingredient.findUnique({where:{siesaCode:row.sourceCode}});if(!ingredient){ingredient=await tx.ingredient.create({data:{siesaCode:row.sourceCode,name:row.sourceName,category:'OTRO',pendingReview:true}});createdIngredients.push({code:row.sourceCode,name:row.sourceName,sheet:recipe.sourceSheet,sourceRow:row.sourceRow});}
    if(normalize(ingredient.name)!==normalize(row.sourceName))issues.push('MASTER_NAME_CONFLICT_'+row.sourceRow+'_'+row.sourceCode);
    const group=groups.get(ingredient.id)||{ingredientId:ingredient.id,names:new Set(),q:[],p:[]};group.names.add(normalize(row.sourceName));group.q.push(row.quantity);group.p.push(row.percentage);groups.set(ingredient.id,group);
   }
   for(const g of groups.values())if(g.names.size>1)throw Error('CONFLICTING_REPEATED_SOURCE_IDENTITY');
   const sourceRecipeSnapshot={...recipe,source:'JUNE_RECIPE',issues:[...new Set(issues)],unresolvedRows:unresolved,canonicalQuantityUseBlockedUntilUnitConfirmed:true};
   const expected=[...groups.values()].map(g=>({ingredientId:g.ingredientId,porcentajeParticipacion:sum(g.p),cantidadCanonica:sum(g.q)}));
   if(old){if(old.estado!=='DRAFT'||old.validFrom||old.aprobadaPorId||old.aprobadaEn||stable(old.sourceRecipeSnapshot)!==stable(sourceRecipeSnapshot)||stable(componentView(old.ingredients,sum))!==stable(componentView(expected,sum)))throw Error('EXISTING_SOURCE_VERSION_COLLISION');recipes.push({productCode:recipe.productCode,sheet:recipe.sourceSheet,identical:true});continue;}
   const version=await tx.formulationVersion.create({data:{formulationId:formulation.id,numeroSecuencial:Math.max(0,...formulation.versions.map(v=>v.numeroSecuencial))+1,estado:'DRAFT',sourceRecipeSnapshot,ingredients:{create:expected}},include:{ingredients:true}});
   if(stable(componentView(version.ingredients,sum))!==stable(componentView(expected,sum)))throw Error('STORAGE_PRECISION_MISMATCH');
   recipes.push({productCode:recipe.productCode,sheet:recipe.sourceSheet,version:version.numeroSecuencial,sourceRows:recipe.sourceRows.length,linkedComponents:groups.size,unresolvedRows:unresolved,exactPercent:recipe.percentageSum,issues:sourceRecipeSnapshot.issues,storedDecimalsEqualSource:true,state:'DRAFT'});
  }
  const Exact=Prisma.Decimal.clone({precision:100});
  for(const bundle of plan.bundles){
   const product=await tx.product.findUnique({where:{codigoInterno:bundle.productCode},include:{bundleVersions:{include:{components:true}}}});if(!product)throw Error('UNRESOLVED_BUNDLE_PRODUCT');
   const matches=product.bundleVersions.filter(b=>b.sourceSha256===plan.sourceSha256&&b.sourceSheet===bundle.sourceSheet);if(matches.length>1)throw Error('AMBIGUOUS_EXISTING_BUNDLE');const old=matches[0],components=[];
   for(const row of bundle.sourceRows){let member=null;if(row.memberProductCode){member=await tx.product.findUnique({where:{codigoInterno:row.memberProductCode}});if(!member)throw Error('UNRESOLVED_BUNDLE_MEMBER');}components.push({sourceCode:row.sourceCode,sourceName:row.sourceName,unitCount:row.quantity,netWeightGrams:row.netWeightGrams,memberProductId:member?.id??null,sourceReference:JSON.stringify({sourceRow:row.sourceRow,sourceDependencies:row.sourceDependencies})});}
   const subtotal=components.reduce((n,c)=>n.plus(new Exact(c.unitCount).times(c.netWeightGrams??0)),new Exact(0)).toString();const weight=components.every(c=>c.netWeightGrams!==null)?subtotal:null;const issues=[...bundle.issues];if(weight===null)issues.push('MEMBER_WEIGHT_NOT_IN_SOURCE');if(weight!==null&&sum([weight])!==sum([bundle.presentation.declaredGrams]))issues.push('DECLARED_AND_COMPONENT_WEIGHT_DIFFER');if(components.some(c=>!c.memberProductId))issues.push('UNRESOLVED_MEMBER_PRODUCT_IDENTITY');
   const sourceSnapshot={...bundle,issues,computedWeightGrams:weight,knownWeightSubtotalGrams:subtotal};
   if(old){if(old.status!=='DRAFT'||sum([old.declaredNetWeightGrams.toString()])!==sum([bundle.presentation.declaredGrams])||stable(old.sourceSnapshot)!==stable(sourceSnapshot)||stable(bundleView(old.components,sum))!==stable(bundleView(components,sum)))throw Error('EXISTING_BUNDLE_COLLISION');bundles.push({sheet:bundle.sourceSheet,identical:true});continue;}
   const saved=await tx.productBundleVersion.create({data:{productId:product.id,sequence:Math.max(0,...product.bundleVersions.map(v=>v.sequence))+1,sourceSha256:plan.sourceSha256,sourceSheet:bundle.sourceSheet,declaredNetWeightGrams:bundle.presentation.declaredGrams,sourceSnapshot,status:'DRAFT',components:{create:components}},include:{components:true}});
   if(stable(bundleView(saved.components,sum))!==stable(bundleView(components,sum)))throw Error('BUNDLE_STORAGE_PRECISION_MISMATCH');bundles.push({productCode:bundle.productCode,sheet:bundle.sourceSheet,components:components.length,linkedMembers:components.filter(c=>c.memberProductId).length,declaredGrams:bundle.presentation.declaredGrams,computedGrams:weight,issues,state:'DRAFT'});
  }
  const afterRows=await snapshot(tx);for(const name of models){const ids=new Set(beforeRows[name].map(r=>r.id));if(stable(beforeRows[name])!==stable(afterRows[name].filter(r=>ids.has(r.id))))throw Error('EXISTING_RECORD_CHANGED');}
  const after=await counts(tx);if(before.approvals!==after.approvals||before.bundleApprovals!==after.bundleApprovals)throw Error('APPROVAL_INVARIANT_FAILED');
  report={scope:'ISOLATED_LOOPBACK_REVIEW_ONLY',mode:apply?'LOCAL_APPLY':'DRY_RUN',before,after,createdIngredients,recipes,bundles,existingRecordsPreserved:true,existingRecordsFingerprint:hash(beforeRows),afterExistingRecordsFingerprint:hash(Object.fromEntries(models.map(n=>[n,afterRows[n].filter(r=>new Set(beforeRows[n].map(x=>x.id)).has(r.id))]))),noNormalization:true,noApprovals:true,atomicBatch:true};
  if(!apply){const e=Error('SOURCE_REVIEW_DRY_RUN_ROLLBACK');e.dryRun=true;throw e;}
 },{timeout:120000,isolationLevel:'Serializable'});}catch(e){if(!e.dryRun)throw e;}
 report.actualAfter=await counts(db);report.result=apply?'LOCAL_APPLIED':'DRY_RUN_PASS';if(!apply&&stable(report.actualAfter)!==stable(report.before))throw Error('DRY_RUN_CHANGED_COUNTS');return report;
}
module.exports={importSourceReview,snapshot,counts,stable,hash,validate};
