/* Full source comparison and rollback-only persistence proof. Dedicated local fixture only. */
const fs = require('node:fs');
const assert = require('node:assert/strict');
const {PrismaClient} = require('@prisma/client');
const {snapshot, hash} = require('../lib/atomic-source-review.cjs');
const url = process.env.TEST_DATABASE_URL;
if (!url || new URL(url).hostname !== '127.0.0.1' || new URL(url).pathname !== '/sevilla_ready_dataset') throw Error('Only dedicated loopback fixture is permitted');
const [payloadFile, profileFile, candidateFile, outputFile] = process.argv.slice(2);
if (![payloadFile, profileFile, candidateFile, outputFile].every(Boolean)) throw Error('Pass PAYLOAD REVIEWED_PLAN PLAN13 OUTPUT');
const payload = JSON.parse(fs.readFileSync(payloadFile));
const profiles = JSON.parse(fs.readFileSync(profileFile));
const candidate = JSON.parse(fs.readFileSync(candidateFile));
const db = new PrismaClient({datasources:{db:{url}}});
const result = {scope:'ISOLATED_FIXTURE_ONLY', noProductionAccess:true};
(async () => {
  const rows = await db.formulationIngredient.findMany({include:{ingredient:true,formulationVersion:{include:{formulation:{include:{product:true}}}}}});
  assert.equal(rows.length, payload.formulationIngredients.length);
  for (const row of rows) {
    const source = payload.formulationIngredients.filter(c => c.productCode === row.formulationVersion.formulation.product.codigoInterno && c.versionSequence === row.formulationVersion.numeroSecuencial && c.ingredientSiesaCode === row.ingredient.siesaCode);
    assert.equal(source.length,1);
    assert.ok(row.porcentajeParticipacion.eq(String(source[0].participationPercent)), 'SOURCE_PERCENT_DRIFT');
  }
  const pilot = rows.filter(r => r.formulationVersion.formulation.product.codigoInterno === 'salchicha-desayuno-premium-480');
  assert.equal(pilot.length,18);
  const {sumExactDecimalStrings} = await import('../../src/lib/formulations/exact-decimal-sum.ts');
  assert.equal(sumExactDecimalStrings(pilot.map(r => r.porcentajeParticipacion.toString())), '100');
  result.percentagesCompared = rows.length; result.percentageDrift = 0; result.pilotExact100 = true;
  let compared = 0;
  for (const source of profiles.profiles) {
    const records = await db.nutritionalProfile.findMany({where:{ingredient:{siesaCode:source.ingredientSiesaCode},sourceDetail:source.sourceDetail},include:{values:{include:{nutrient:true}}}});
    assert.equal(records.length,1);
    assert.equal(records[0].values.length,source.values.length);
    for (const value of source.values) {const stored=records[0].values.find(v=>v.nutrient.key===value.nutrientKey);assert.ok(stored?.value.eq(value.value),'SOURCE_NUTRIENT_DRIFT');compared++;}
  }
  result.reviewedNutrientValuesCompared = compared; result.nutrientDrift = 0;
  const baseline = hash(await snapshot(db)); const rollback = new Error('PROOF_ROLLBACK'); let candidateValues = 0;
  await assert.rejects(db.$transaction(async tx => {
    const nutrients = new Map((await tx.nutrient.findMany()).map(n=>[n.key,n.id]));
    assert.equal(candidate.profiles.length,13);
    for (const source of candidate.profiles) {
      const ingredient=await tx.ingredient.findUniqueOrThrow({where:{siesaCode:source.ingredientSiesaCode}});
      assert.equal(ingredient.name,source.ingredientName);
      const stored=await tx.nutritionalProfile.create({data:{ingredientId:ingredient.id,source:'BANCO_ALIMENTOS',sourceDetail:source.sourceDetail,referenceBase:'100g',isActive:false,values:{create:source.values.map(v=>({nutrientId:nutrients.get(v.nutrientKey),value:String(v.value),method:v.method}))}},include:{values:{include:{nutrient:true}}}});
      for (const value of source.values) {assert.ok(stored.values.find(v=>v.nutrient.key===value.nutrientKey)?.value.eq(value.value));candidateValues++;}
    }
    const sample=await tx.nutrientValue.findFirstOrThrow(); const exact='0.123456789012345678901234';
    const roundtrip=await tx.nutrientValue.update({where:{id:sample.id},data:{value:exact}});assert.equal(roundtrip.value.toString(),exact);
    throw rollback;
  },{timeout:120000}), error=>error===rollback);
  assert.equal(hash(await snapshot(db)),baseline);
  assert.equal(candidateValues,221);
  result.candidateValuesRollbackRoundtrip = candidateValues; result.exact24FractionalDigits = true; result.allRowsPreservedAfterRollback = true;
  result.businessApprovalsCreated = 0; result.result='PASS';
})().catch(error=>{result.result='FAIL';result.failure=error.message;process.exitCode=1;}).finally(async()=>{await db.$disconnect();fs.writeFileSync(outputFile,JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));});
