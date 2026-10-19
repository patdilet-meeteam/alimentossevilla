/* Isolated source recovery only. No production URL, normalization or approvals. */
const fs = require('node:fs');
const crypto = require('node:crypto');
const { PrismaClient, Prisma } = require('@prisma/client');
const url = process.env.TEST_DATABASE_URL;
if (!url) throw Error('TEST_DATABASE_URL required');
const target = new URL(url);
if (target.hostname !== '127.0.0.1' || target.pathname !== '/sevilla_ready_dataset') throw Error('Only isolated loopback sevilla_ready_dataset allowed');
const [sourcePath, planPath, outputPath] = process.argv.slice(2);
const plan = JSON.parse(fs.readFileSync(planPath));
if (crypto.createHash('sha256').update(fs.readFileSync(sourcePath)).digest('hex') !== plan.sourceSha256 || !plan.noNormalization || !plan.noApprovals) throw Error('Source or plan mismatch');
const db = new PrismaClient({ datasources: { db: { url } } });
const stable = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a],[b]) => a.localeCompare(b))) : item);
const normalizeName = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().replace(/\s+/g, ' ').toUpperCase();
async function main() {
 const { sumExactDecimalStrings } = await import('../../src/lib/formulations/exact-decimal-sum.ts');
 const canonical = s => sumExactDecimalStrings([s]);
 const counts = async () => ({ ingredients: await db.ingredient.count(), formulations: await db.formulation.count(), versions: await db.formulationVersion.count(), components: await db.formulationIngredient.count(), bundles: await db.productBundleVersion.count(), bundleComponents: await db.productBundleComponent.count(), approvals: await db.formulationVersion.count({ where: { estado: 'APPROVED' } }) });
 const before = await counts(); const createdIngredients = []; const reports = []; const bundleReports = [];
 for (const recipe of plan.recipes) {
  await db.$transaction(async tx => {
   const product = await tx.product.findUniqueOrThrow({ where: { codigoInterno: recipe.productCode }, include: { formulations: { include: { versions: true } } } });
   let formulation = product.formulations[0];
   if (!formulation) formulation = await tx.formulation.create({ data: { productId: product.id }, include: { versions: true } });
   const old = formulation.versions.find(v => v.sourceRecipeSnapshot?.sourceSha256 === plan.sourceSha256 && v.sourceRecipeSnapshot?.sourceSheet === recipe.sourceSheet);
   if (old && stable(old.sourceRecipeSnapshot.sourceRows) !== stable(recipe.sourceRows)) throw Error(`Source recovery changed: ${recipe.sourceSheet}. Existing local draft must be reviewed; no silent reuse or replacement.`);
   if (old) { reports.push({ productCode: recipe.productCode, sheet: recipe.sourceSheet, identical: true, versionId: old.id }); return; }
   const issues = [...recipe.issues, 'CURRENT_VERSION_NOT_ESTABLISHED', 'SOURCE_QUANTITY_UNIT_REQUIRES_CONFIRMATION'];
   if (canonical(recipe.percentageSum) !== '100') issues.push('SOURCE_PERCENTAGE_SUM_NOT_EXACT_100');
   const groups = new Map(); const unresolved = [];
   for (const row of recipe.sourceRows) {
    if (!row.sourceCode || row.sourceCode === '0' || row.quantity === null || row.percentage === null) { unresolved.push(row); issues.push(`UNRESOLVED_SOURCE_ROW_${row.sourceRow}`); continue; }
    let ingredient = await tx.ingredient.findUnique({ where: { siesaCode: row.sourceCode } });
    if (!ingredient) { ingredient = await tx.ingredient.create({ data: { siesaCode: row.sourceCode, name: row.sourceName, category: 'OTRO', pendingReview: true } }); createdIngredients.push({ code: row.sourceCode, name: row.sourceName, sheet: recipe.sourceSheet, sourceRow: row.sourceRow }); }
    if (normalizeName(ingredient.name) !== normalizeName(row.sourceName)) issues.push(`MASTER_NAME_CONFLICT_${row.sourceRow}_${row.sourceCode}`);
    const group = groups.get(ingredient.id) || { ingredientId: ingredient.id, code: row.sourceCode, names: new Set(), quantities: [], percentages: [], rows: [] };
    group.names.add(normalizeName(row.sourceName)); group.quantities.push(row.quantity); group.percentages.push(row.percentage); group.rows.push(row.sourceRow); groups.set(ingredient.id, group);
   }
   for (const group of groups.values()) if (group.names.size > 1) throw Error(`Conflicting repeated source identity ${recipe.sourceSheet}/${group.code}`);
   const snapshot = { ...recipe, source: 'JUNE_RECIPE', issues: [...new Set(issues)], unresolvedRows: unresolved.map(r => r.sourceRow), canonicalQuantityUseBlockedUntilUnitConfirmed: true };
   const version = await tx.formulationVersion.create({ data: { formulationId: formulation.id, numeroSecuencial: Math.max(0, ...formulation.versions.map(v => v.numeroSecuencial)) + 1, estado: 'DRAFT', sourceRecipeSnapshot: snapshot, ingredients: { create: [...groups.values()].map(g => ({ ingredientId: g.ingredientId, porcentajeParticipacion: sumExactDecimalStrings(g.percentages), cantidadCanonica: sumExactDecimalStrings(g.quantities) })) } }, include: { ingredients: { include: { ingredient: true } } } });
   for (const g of groups.values()) { const saved = version.ingredients.find(r => r.ingredientId === g.ingredientId); if (canonical(saved.porcentajeParticipacion.toString()) !== sumExactDecimalStrings(g.percentages) || canonical(saved.cantidadCanonica.toString()) !== sumExactDecimalStrings(g.quantities)) throw Error('Storage precision mismatch'); }
   reports.push({ productCode: recipe.productCode, sheet: recipe.sourceSheet, version: version.numeroSecuencial, sourceRows: recipe.sourceRows.length, linkedComponents: groups.size, unresolvedRows: unresolved.map(r => r.sourceRow), exactPercent: recipe.percentageSum, issues: snapshot.issues, storedDecimalsEqualSource: true, state: version.estado });
  }, { timeout: 120000 });
 }
 for (const bundle of plan.bundles) {
  const product = await db.product.findUniqueOrThrow({ where: { codigoInterno: bundle.productCode }, include: { bundleVersions: true } });
  const old = product.bundleVersions.find(b => b.sourceSha256 === plan.sourceSha256 && b.sourceSheet === bundle.sourceSheet);
  if (old) { bundleReports.push({ sheet: bundle.sourceSheet, identical: true }); continue; }
  const components = [];
  for (const row of bundle.sourceRows) { const member = row.memberProductCode ? await db.product.findUniqueOrThrow({ where: { codigoInterno: row.memberProductCode } }) : null; components.push({ sourceCode: row.sourceCode, sourceName: row.sourceName, unitCount: row.quantity, netWeightGrams: row.netWeightGrams, memberProductId: member?.id ?? null, sourceReference: JSON.stringify({ sourceRow: row.sourceRow, sourceDependencies: row.sourceDependencies }) }); }
  const knownWeightSubtotal = components.reduce((sum, c) => sum.plus(new Prisma.Decimal(c.unitCount).times(c.netWeightGrams ?? 0)), new Prisma.Decimal(0)).toString();
  const weight = components.every(c => c.netWeightGrams !== null) ? knownWeightSubtotal : null;
  const issues = [...bundle.issues]; if (weight === null) issues.push('MEMBER_WEIGHT_NOT_IN_SOURCE'); if (weight !== null && canonical(weight) !== canonical(bundle.presentation.declaredGrams)) issues.push('DECLARED_AND_COMPONENT_WEIGHT_DIFFER'); if (components.some(c => !c.memberProductId)) issues.push('UNRESOLVED_MEMBER_PRODUCT_IDENTITY');
  const created = await db.productBundleVersion.create({ data: { productId: product.id, sequence: Math.max(0, ...product.bundleVersions.map(v => v.sequence)) + 1, sourceSha256: plan.sourceSha256, sourceSheet: bundle.sourceSheet, declaredNetWeightGrams: bundle.presentation.declaredGrams, sourceSnapshot: { ...bundle, issues, computedWeightGrams: weight, knownWeightSubtotalGrams: knownWeightSubtotal }, status: 'DRAFT', components: { create: components } }, include: { components: true } });
  bundleReports.push({ productCode: bundle.productCode, sheet: bundle.sourceSheet, components: components.length, linkedMembers: components.filter(c => c.memberProductId).length, declaredGrams: bundle.presentation.declaredGrams, computedGrams: weight, issues, state: created.status });
 }
 const after = await counts(); if (after.approvals !== before.approvals) throw Error('Approval invariant failed');
 fs.writeFileSync(outputPath, JSON.stringify({ scope: 'ISOLATED_LOCAL_ONLY', sourceSha256: plan.sourceSha256, before, after, createdIngredients, recipes: reports, bundles: bundleReports, noNormalization: true, noApprovals: true }, null, 2));
 console.log(JSON.stringify({ before, after, createdIngredients: createdIngredients.length, recipes: reports.length, bundles: bundleReports.length }));
}
main().catch(e => { console.error(e); process.exitCode = 1; }).finally(() => db.$disconnect());
