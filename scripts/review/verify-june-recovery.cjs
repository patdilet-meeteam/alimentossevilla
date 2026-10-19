const fs = require('node:fs');
const { PrismaClient } = require('@prisma/client');
const url = process.env.TEST_DATABASE_URL;
if (!url || new URL(url).hostname !== '127.0.0.1' || new URL(url).pathname !== '/sevilla_ready_dataset') throw Error('Only isolated local DB');
const [planPath, outputPath] = process.argv.slice(2); const plan = JSON.parse(fs.readFileSync(planPath));
const db = new PrismaClient({ datasources: { db: { url } } });
async function main() {
 const { sumExactDecimalStrings: sum } = await import('../../src/lib/formulations/exact-decimal-sum.ts');
 const { getSourceRecipeEvidence } = await import('../../src/lib/formulations/source-recipe-evidence.ts');
 const products = await db.product.findMany({ orderBy: { codigoInterno: 'asc' }, include: { bundleVersions: { include: { components: true } }, formulations: { include: { versions: { include: { ingredients: { include: { ingredient: { include: { profiles: { where: { isActive: true }, include: { values: { include: { nutrient: true } } } } } } } } } } } } } });
 const required = ['FAT_TOTAL','FAT_SAT','FAT_TRANS','PROTEIN','CARBS_TOTAL','SUGAR_TOTAL','SUGAR_ADDED','FIBER','SODIUM'];
 const checks = [];
 for (const recipe of plan.recipes) {
  const product = products.find(p => p.codigoInterno === recipe.productCode);
  const versions = product.formulations.flatMap(f => f.versions).filter(v => v.sourceRecipeSnapshot?.sourceSha256 === plan.sourceSha256 && v.sourceRecipeSnapshot?.sourceSheet === recipe.sourceSheet);
  if (versions.length !== 1) throw Error('Source version count differs'); const version = versions[0];
  if (version.estado !== 'DRAFT' || version.aprobadaPorId || version.aprobadaEn) throw Error('Unexpected approval');
  const snapshot = version.sourceRecipeSnapshot;
  if (JSON.stringify(snapshot.sourceRows) !== JSON.stringify(recipe.sourceRows)) {
   // JSONB object key ordering is immaterial; structural comparison follows.
   const stable = o => JSON.stringify(o, Object.keys(o).sort());
   for (let i=0;i<recipe.sourceRows.length;i++) {
    const a=recipe.sourceRows[i], b=snapshot.sourceRows[i];
    if (a.sourceCode!==b.sourceCode || a.sourceName!==b.sourceName || a.quantity!==b.quantity || a.percentage!==b.percentage || a.sourceRow!==b.sourceRow) throw Error('Raw source row mismatch');
    for (const key of Object.keys(a.cells)) if(stable(a.cells[key])!==stable(b.cells[key])) throw Error('Raw cell/formula mismatch');
   }
  }
  const groups = new Map();
  for (const row of recipe.sourceRows) { if (!row.sourceCode || row.sourceCode==='0' || row.quantity===null || row.percentage===null) continue; const group=groups.get(row.sourceCode)||{q:[],p:[]};group.q.push(row.quantity);group.p.push(row.percentage);groups.set(row.sourceCode,group); }
  if (groups.size!==version.ingredients.length) throw Error('Component count mismatch');
  for (const row of version.ingredients) { const group=groups.get(row.ingredient.siesaCode); if (!group || sum(group.q)!==sum([row.cantidadCanonica.toString()]) || sum(group.p)!==sum([row.porcentajeParticipacion.toString()])) throw Error('Decimal/code mismatch'); }
  const missing = version.ingredients.flatMap(r => { const keys = new Set(r.ingredient.profiles[0]?.values.map(v=>v.nutrient.key));const missingKeys=required.filter(k=>!keys.has(k));return r.ingredient.profiles.length!==1 || missingKeys.length ? [{code:r.ingredient.siesaCode,name:r.ingredient.name,profileCount:r.ingredient.profiles.length,missingKeys}]:[]; });
  checks.push({productCode:recipe.productCode,sheet:recipe.sourceSheet,rawSourceCellsEqual:true,exactDecimalsEqual:true,state:version.estado,sourceRows:recipe.sourceRows.length,linkedComponents:groups.size,percentageSum:sum(recipe.sourceRows.map(r=>r.percentage??'0')),blockedBySourceIssues:getSourceRecipeEvidence(snapshot).issues,missingNutrition:missing});
 }
 const bundleChecks = [];
 for (const source of plan.bundles) {
  const product=products.find(p=>p.codigoInterno===source.productCode);
  const matches=product.bundleVersions.filter(v=>v.sourceSha256===plan.sourceSha256 && v.sourceSheet===source.sourceSheet);
  if(matches.length!==1 || matches[0].status!=='DRAFT') throw Error('Bundle identity/state mismatch');
  const stored=matches[0]; if(stored.components.length!==source.sourceRows.length) throw Error('Bundle component count mismatch');
  for(const row of source.sourceRows){const matches=stored.components.filter(c=>c.sourceCode===row.sourceCode && c.sourceName===row.sourceName);if(matches.length!==1)throw Error('Bundle row mismatch');const c=matches[0];if(sum([c.unitCount.toString()])!==sum([row.quantity]) || (c.netWeightGrams?.toString()??null)!==row.netWeightGrams)throw Error('Bundle units/weight mismatch');}
  bundleChecks.push({productCode:source.productCode,sheet:source.sourceSheet,allRowsEqual:true,components:stored.components.length,issues:stored.sourceSnapshot.issues,computedWeightGrams:stored.sourceSnapshot.computedWeightGrams,state:stored.status});
 }
 const summary = {products:products.length,productsWithFormulation:products.filter(p=>p.formulations.length).length,productsWithoutFormulation:products.filter(p=>!p.formulations.length).map(p=>p.codigoInterno),recoveredProducts:new Set(checks.map(r=>r.productCode)).size,recoveredVersions:checks.length,recoveredSourceRows:checks.reduce((n,r)=>n+r.sourceRows,0),recoveredLinkedComponents:checks.reduce((n,r)=>n+r.linkedComponents,0),recoveredVersionsWithExact100:checks.filter(r=>r.percentageSum==='100').length,recoveredVersionsMissingNutrition:checks.filter(r=>r.missingNutrition.length).length,bundleVersions:products.reduce((n,p)=>n+p.bundleVersions.length,0),bundleComponents:products.reduce((n,p)=>n+p.bundleVersions.reduce((m,b)=>m+b.components.length,0),0),approvedVersions:await db.formulationVersion.count({where:{estado:'APPROVED'}}),invalidZeroIngredientCount:await db.ingredient.count({where:{siesaCode:'0'}}),users:await db.user.count(),sessions:await db.session.count()};
 fs.writeFileSync(outputPath,JSON.stringify({scope:'LOCAL_SOURCE_RECOVERY_VERIFIED_NOT_DEPLOYMENT',summary,recipes:checks,bundles:bundleChecks,remainingNutritionCodes:[...new Set(checks.flatMap(r=>r.missingNutrition.map(m=>m.code)))].sort()},null,2));console.log(JSON.stringify(summary,null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
