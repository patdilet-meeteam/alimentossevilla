#!/usr/bin/env node
/* Single local rehearsal entry point. Creates only disposable loopback PostgreSQL. */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const [materialsArg, outputArg] = process.argv.slice(2);
if (!materialsArg || !outputArg) throw Error('Pass MATERIALS_DIR EMPTY_OUTPUT_DIR; this is never a production importer');
const materials = path.resolve(materialsArg), output = path.resolve(outputArg);
if (fs.existsSync(output) && fs.readdirSync(output).length) throw Error('Output directory must be empty');
fs.mkdirSync(output,{recursive:true});
const source = path.join(materials,'fuentes','junio_original.xlsx');
const payload = path.join(materials,'dataset_auditoria_payload.json');
const plan66 = path.join(materials,'plan_66_perfiles_consolidado.json');
const plan13 = path.join(materials,'plan_13_perfiles_candidatos_identidad_literal.json');
const recipes = path.join(materials,'plan_recuperacion_junio_21_productos.json');
for (const file of [source,payload,plan66,plan13,recipes]) if (!fs.statSync(file).isFile()) throw Error('Missing supplied source material');
const container = 'sevilla-atomic-consolidated-'+crypto.randomUUID().slice(0,8);
let env = {...process.env};
const report = {scope:'DISPOSABLE_LOOPBACK_FIXTURE_ONLY', productionAccess:false, stages:[], result:'RUNNING'};
function step(name, command, args, log=true) {
  const result=spawnSync(command,args,{env,encoding:'utf8',maxBuffer:64*1024*1024});
  if (log) fs.writeFileSync(path.join(output,name+'.log'),(result.stdout??'')+(result.stderr??''));
  if (result.status!==0) throw Error(name+' failed; see its local log');
  report.stages.push({name,result:'PASS'}); return result.stdout;
}
const node = (name,args) => step(name,process.execPath,args);
const listing=spawnSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{encoding:'utf8'});
if (listing.status!==0) throw Error('Source inventory unavailable');
const codeFiles=listing.stdout.split('\0').filter(file=>/^(src\/|tests\/|scripts\/|prisma\/|package\.json$|pnpm-lock\.yaml$|tsconfig\.json$|next\.config\.|vitest\.config\.|eslint\.config\.)/.test(file)).sort();
const sourceFingerprint=()=>{const sha=crypto.createHash('sha256');for(const file of codeFiles){sha.update(file+'\0');sha.update(fs.readFileSync(file));}return sha.digest('hex');};
report.sourceFingerprintBefore=sourceFingerprint();report.codeFilesVerified=codeFiles.length;

try {
  step('postgres-create','docker',['run','--detach','--rm','--pull=never','--name',container,'--publish','127.0.0.1::5432','--env','POSTGRES_HOST_AUTH_METHOD=trust','--env','POSTGRES_DB=sevilla_ready_dataset','--tmpfs','/var/lib/postgresql/data:rw','postgres:16-alpine']);
  let ready=false;
  for (let attempt=0;attempt<80;attempt++) {const r=spawnSync('docker',['exec',container,'pg_isready','-h','127.0.0.1','-U','postgres','-d','sevilla_ready_dataset'],{stdio:'ignore'});if (r.status===0) {ready=true;break;} Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,100);}
  if (!ready) throw Error('Disposable PostgreSQL did not become ready');
  const port=step('postgres-port','docker',['port',container,'5432'],false).trim().split(':').at(-1);
  if (!/^\d+$/.test(port)) throw Error('Invalid local fixture port');
  const url='postgresql://postgres@127.0.0.1:'+port+'/sevilla_ready_dataset';
  env={...env,DATABASE_URL:url,TEST_DATABASE_URL:url,SOURCE_DB_CONTAINER:container,BETTER_AUTH_URL:'http://localhost:3000'};
  node('migrations',['node_modules/prisma/build/index.js','migrate','deploy']);
  node('client',['node_modules/prisma/build/index.js','generate']);
  node('profiles66',['--import','tsx','scripts/review/simulate-bank-plan.cjs',payload,plan66,path.join(output,'profiles66.json')]);
  node('source-precision',['--import','tsx','scripts/review/test-source-decimal-storage.cjs',payload,plan66,plan13,path.join(output,'source-precision.json')]);
  node('atomic-batch',['--import','tsx','scripts/review/test-atomic-source-review.cjs',source,recipes,path.join(output,'atomic-batch.json')]);
  node('source-verification',['--import','tsx','scripts/review/verify-june-recovery.cjs',recipes,path.join(output,'source-verification.json')]);
  node('test-suite',['node_modules/vitest/vitest.mjs','run']);
  node('typescript',['node_modules/typescript/bin/tsc','--noEmit','--incremental','false']);
  node('lint',['node_modules/eslint/bin/eslint.js','src/lib/formulations/review-feedback.ts','src/lib/formulations/review-validation-error.ts','tests/unit/review-feedback.test.ts','src/lib/products/bundle-review.ts','src/app/actions/bundle-working-review-actions.ts','src/components/products/bundle-working-review-editor.tsx','tests/unit/bundle-review.test.ts','src/lib/formulations/source-working-review.ts','src/lib/formulations/source-recipe-evidence.ts','src/app/actions/source-working-review-actions.ts','src/components/products/source-working-review-editor.tsx','src/components/products/product-version-panel.tsx','src/components/nutrition/species-fat-preview.tsx','tests/unit/source-working-review.test.ts','tests/integration/source-working-review.test.ts','src/lib/nutrition/source-identity-guards.ts','src/components/products/formulation-review-evidence.tsx','src/app/actions/document-preview-actions.ts','src/app/(app)/documentos/page.tsx','tests/unit/source-identity-guards.test.ts','tests/unit/formulation-review-evidence.test.tsx','src/lib/nutrition/ctn-import.ts','tests/unit/ctn-import.test.ts','src/lib/decimal-storage.ts','src/lib/validations/source-decimal.ts','src/lib/nutrition/nutrient-input.ts','src/components/products/product-version-panel.tsx','src/components/ingredients/ingredient-form.tsx','src/components/ingredients/ingredient-detail.tsx','src/lib/validations/ingredients.ts','src/lib/validations/products.ts','src/lib/nutrition/reviewed-bank-plan.ts','src/app/actions/formulation-actions.ts','src/app/actions/ingredient-actions.ts','src/app/actions/nutrition-actions.ts','tests/unit/decimal-storage.test.ts','tests/unit/nutrient-input.test.ts','tests/unit/nutrient-form-precision.test.tsx','tests/unit/formulation-decimal-write.test.ts','tests/unit/candidate-literal-mapping.test.ts','tests/unit/nutritional-bank-action.test.ts']);
  node('build',['node_modules/next/dist/bin/next','build','--webpack']);
  node('source-review-browser',['scripts/review/check-source-review-workflow.cjs',path.join(output,'visual_workflow')]);
  report.result='PASS';
} catch (error) {report.result='FAIL';report.failure=error.message;process.exitCode=1;}
finally {
  const cleanup=spawnSync('docker',['stop',container],{encoding:'utf8'});
  report.cleanup={temporaryContainerRemoved:cleanup.status===0};
  report.sourceFingerprintAfter=sourceFingerprint();
  if (report.sourceFingerprintBefore!==report.sourceFingerprintAfter) {report.result='FAIL';report.failure='Source changed during rehearsal';process.exitCode=1;}

  if (cleanup.status!==0) {report.result='FAIL';report.failure=report.failure??'Container cleanup not confirmed';process.exitCode=1;}
  report.limit='Fixture and source validation only. Does not certify current recipes, actual deployed DB, production backup, Docker image build, or business approval.';
  fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report,null,2));
}
