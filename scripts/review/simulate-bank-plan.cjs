/* Local-only data rehearsal. Refuses any non-loopback or other database. No approvals. */
const { PrismaClient, Prisma } = require('@prisma/client');
const fs = require('node:fs');
const url = process.env.TEST_DATABASE_URL;
if (!url) throw new Error('TEST_DATABASE_URL required');
const target = new URL(url);
if (target.hostname !== '127.0.0.1' || target.pathname !== '/sevilla_ready_dataset') throw new Error('Only isolated loopback sevilla_ready_dataset is allowed');
const [payloadPath, planPath, outputPath] = process.argv.slice(2);
if (!payloadPath || !planPath || !outputPath) throw new Error('Pass AUDIT_PAYLOAD PLAN OUTPUT');
const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
const plan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
if (plan.mode !== 'REVIEW_ONLY_NO_DATABASE' || ![52, 53].includes(plan.profiles.length)) throw new Error('Unexpected reviewed plan');
const db = new PrismaClient({ datasources: { db: { url } } });
const dec = value => new Prisma.Decimal(value);
const stored = value => dec(value).toDecimalPlaces(4).toString();
async function counts() {
  return { ingredients: await db.ingredient.count(), products: await db.product.count(), presentations: await db.presentation.count(), formulations: await db.formulation.count(), versions: await db.formulationVersion.count(), components: await db.formulationIngredient.count(), profiles: await db.nutritionalProfile.count(), activeProfiles: await db.nutritionalProfile.count({ where: { isActive: true } }), nutrientValues: await db.nutrientValue.count(), approvedVersions: await db.formulationVersion.count({ where: { estado: 'APPROVED' } }) };
}
async function seed() {
  if (await db.ingredient.count() || await db.product.count()) throw new Error('Seed requires an empty rehearsal database');
  const ids = { ingredients: new Map(), products: new Map(), formulations: new Map(), versions: new Map(), nutrients: new Map() };
  await db.$transaction(async tx => {
    for (const n of payload.nutrientCatalog) { const record = await tx.nutrient.create({ data: { key: n.key, displayName: n.displayName, unit: n.unit, isRequiredOnLabel: n.isRequiredOnLabel } }); ids.nutrients.set(n.key, record.id); }
    for (const i of payload.ingredients) { const record = await tx.ingredient.create({ data: { siesaCode: i.siesaCode, name: i.name, genericName: i.genericName, category: i.category, isActive: i.isActive, pendingReview: i.pendingReview, isAllergen: i.isAllergen, allergenTags: i.allergenTags || [] } }); ids.ingredients.set(i.siesaCode, record.id); }
    for (const p of payload.products) { const record = await tx.product.create({ data: { codigoInterno: p.internalCode, nombreComercial: p.commercialName, categoriaProducto: p.category, descripcion: p.description, isActive: p.isActive } }); ids.products.set(p.internalCode, record.id); }
    for (const p of payload.presentations) await tx.presentation.create({ data: { productId: ids.products.get(p.productCode), gramajeNeto: p.netWeight, unidadesPorEmpaque: p.unitsPerPackage, porcionDeclarada: p.declaredPortion, porcionPorEnvase: p.portionsPerPackage, isActive: p.isActive } });
    for (const f of payload.formulations) { const record = await tx.formulation.create({ data: { productId: ids.products.get(f.productCode), baseCalculo: f.baseCalculation, rendimientoEsperado: f.expectedYield } }); ids.formulations.set(f.productCode, record.id); }
    for (const v of payload.formulationVersions) { if (v.status !== 'DRAFT') throw new Error('Only draft audit fixture'); const record = await tx.formulationVersion.create({ data: { formulationId: ids.formulations.get(v.productCode), numeroSecuencial: v.sequence, estado: 'DRAFT', rendimientoEsperado: v.expectedYield, nutritionSourceSnapshot: v.nutritionSourceSnapshot ?? Prisma.JsonNull } }); ids.versions.set(`${v.productCode}#${v.sequence}`, record.id); }
    for (const c of payload.formulationIngredients) await tx.formulationIngredient.create({ data: { formulationVersionId: ids.versions.get(`${c.productCode}#${c.versionSequence}`), ingredientId: ids.ingredients.get(c.ingredientSiesaCode), porcentajeParticipacion: c.participationPercent, cantidadCanonica: c.canonicalQuantity } });
    for (const p of payload.nutritionalProfiles) await tx.nutritionalProfile.create({ data: { ingredientId: ids.ingredients.get(p.ingredientSiesaCode), source: p.source, sourceDetail: p.sourceDetail, referenceBase: p.referenceBase, validFrom: new Date(p.validFrom), isActive: p.isActive, values: { create: p.values.map(v => ({ nutrientId: ids.nutrients.get(v.nutrientKey), value: v.value, method: v.method })) } } });
  }, { timeout: 120000 });
}
async function applyReviewedPlan() {
  const result = { created: 0, identical: 0, deactivatedPreviousProfiles: 0 };
  await db.$transaction(async tx => {
    const nutrients = new Map((await tx.nutrient.findMany()).map(n => [n.key, n.id]));
    for (const p of plan.profiles) {
      const ingredient = await tx.ingredient.findUniqueOrThrow({ where: { siesaCode: p.ingredientSiesaCode }, include: { profiles: { where: { isActive: true }, include: { values: { include: { nutrient: true } } } } } });
      if (ingredient.name !== p.ingredientName) throw new Error('Target identity changed');
      const existing = ingredient.profiles.filter(profile => profile.sourceDetail === p.sourceDetail);
      if (existing.length > 1) throw new Error('Ambiguous existing source profile');
      if (existing.length === 1) {
        const old = new Map(existing[0].values.map(v => [v.nutrient.key, { value: v.value.toString(), method: v.method }]));
        if (old.size !== p.values.length || p.values.some(v => old.get(v.nutrientKey)?.value !== stored(v.value) || old.get(v.nutrientKey)?.method !== v.method)) throw new Error('Reviewed source collision');
        result.identical++; continue;
      }
      if (ingredient.profiles.some(profile => profile.source !== 'BANCO_ALIMENTOS')) throw new Error('Protected non-bank profile');
      result.deactivatedPreviousProfiles += (await tx.nutritionalProfile.updateMany({ where: { ingredientId: ingredient.id, isActive: true }, data: { isActive: false } })).count;
      await tx.nutritionalProfile.create({ data: { ingredientId: ingredient.id, source: p.source, sourceDetail: p.sourceDetail, referenceBase: p.referenceBase, isActive: true, values: { create: p.values.map(v => ({ nutrientId: nutrients.get(v.nutrientKey), value: v.value, method: v.method })) } } });
      result.created++;
    }
  }, { timeout: 120000 });
  return result;
}
async function main() {
  const { calculateNutrition } = await import('../../src/lib/nutrition/nutrition-calculator.ts');
  const { getKnownRecipeConflict } = await import('../../src/lib/nutrition/recipe-source-consistency.ts');
  const { evaluateSpeciesFatRule } = await import('../../src/lib/nutrition/species-fat-rule.ts');
  if (!process.argv.includes('--analyze-existing')) await seed(); const before = await counts(); const first = await applyReviewedPlan(); const after = await counts(); const second = await applyReviewedPlan(); const afterSecond = await counts();
  if (second.created || second.deactivatedPreviousProfiles || JSON.stringify(after) !== JSON.stringify(afterSecond)) throw new Error('Idempotence failed');
  const required = ['FAT_TOTAL','FAT_SAT','FAT_TRANS','PROTEIN','CARBS_TOTAL','SUGAR_TOTAL','SUGAR_ADDED','FIBER','SODIUM'];
  const products = await db.product.findMany({ orderBy: { codigoInterno: 'asc' }, include: { presentations: true, formulations: { include: { versions: { orderBy: { numeroSecuencial: 'desc' }, take: 1, include: { ingredients: { include: { ingredient: { include: { profiles: { where: { isActive: true }, include: { values: { include: { nutrient: true } } } } } } } } } } } } } });
  const results = products.map(product => {
    const version = product.formulations[0]?.versions[0];
    if (!version) return { productCode: product.codigoInterno, productName: product.nombreComercial, status: 'NO_FORMULATION', nutritionReady: false };
    const missing = version.ingredients.flatMap(row => { const profile = row.ingredient.profiles; const keys = new Set(profile[0]?.values.map(v => v.nutrient.key)); const missingKeys = required.filter(k => !keys.has(k)); return profile.length !== 1 || missingKeys.length ? [{ code: row.ingredient.siesaCode, name: row.ingredient.name, profileCount: profile.length, missingKeys }] : []; });
    const total = version.ingredients.reduce((sum, row) => sum.plus(row.porcentajeParticipacion), dec(0));
    const inputs = version.ingredients.map(row => ({ ingredientId: row.ingredientId, name: row.ingredient.name, quantity: row.cantidadCanonica ?? row.porcentajeParticipacion, nutrientsPer100g: Object.fromEntries((row.ingredient.profiles[0]?.values ?? []).map(v => [v.nutrient.key, v.value.toString()])) }));
    let calculation = null; let error = null;
    if (!missing.length) { try { const c = calculateNutrition(inputs, product.presentations[0]?.porcionDeclarada ?? 100); calculation = { per100g: c.per100g, energyKcalPer100g: c.energyKcalPer100g, totalQuantity: c.totalQuantity }; } catch (e) { error = e.message; } }
    const sourceConflict = getKnownRecipeConflict(product.codigoInterno, version.ingredients.map(row => ({ siesaCode: row.ingredient.siesaCode, percentage: row.porcentajeParticipacion.toString() })));
    return { productCode: product.codigoInterno, productName: product.nombreComercial, sourceConflict, mathematicallyReady: !missing.length && !error, version: version.numeroSecuencial, state: version.estado, percentageSum: total.toString(), exact100: total.eq(100), nutritionReady: !missing.length && !error && !sourceConflict, missing, calculation, error, canApproveAutomatically: false, clientSpeciesRule: evaluateSpeciesFatRule(version.ingredients.map(row => ({ ingredientId: row.ingredientId, role: 'UNKNOWN', species: null, evidence: null }))).status };
  });
  const report = { scope: 'ISOLATED_LOOPBACK_REHEARSAL_ONLY', before, first, after, second, afterSecond, idempotent: true, productCoverage: { total: results.length, ready: results.filter(r => r.nutritionReady).length, mathematicallyReady: results.filter(r => r.mathematicallyReady).length, sourceRecipeConflicts: results.filter(r => r.sourceConflict).length, missingProfileRecipes: results.filter(r => r.missing?.length).length, incomplete: results.filter(r => r.status !== 'NO_FORMULATION' && !r.nutritionReady).length, noFormulation: results.filter(r => r.status === 'NO_FORMULATION').length }, products: results };
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ before, first, after, second, productCoverage: report.productCoverage, readyProducts: results.filter(r => r.nutritionReady).map(r => r.productCode) }, null, 2));
}
main().catch(e => { console.error(e.message); process.exitCode = 1; }).finally(() => db.$disconnect());
