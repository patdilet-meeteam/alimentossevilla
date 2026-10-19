"""Build an evidence index from completed local reports; does not choose current recipes."""
import json, sys
from pathlib import Path
from decimal import Decimal
p=Path(sys.argv[1])
def read(name): return json.loads((p/name).read_text())
run=Path(sys.argv[2]) if len(sys.argv)>2 else p/'ensayo_cierre_final'
result=json.loads((run/'result.json').read_text())
assert result['result']=='PASS'
coverage=json.loads((run/'profiles66.json').read_text())
verification=json.loads((run/'source-verification.json').read_text())
source=read('conciliacion_vigencia_y_sumas.json')
plan=read('plan_recuperacion_junio_21_productos.json')
pending=read('pendientes_13_actualizacion.json')
new=read('mapeo_13_codigos_candidatos_identidad_literal.json')['mappings']
base=read('dataset_auditoria_payload.json')
base_gaps=[{'productCode':r['productCode'],'productName':r['productName'],'missingCodes':[x['code'] for x in r['missing']]} for r in coverage['products'] if r.get('missing')]
assert len(base_gaps)==14
assert len({c for r in base_gaps for c in r['missingCodes']})==13
assert len(pending['unresolved'])==13
literal_codes={x['targetCode'] for x in new}
assert len(verification['remainingNutritionCodes'])==65
raw_non100=[]
for f in base['formulations']:
 code=f['productCode']; seq=max(v['sequence'] for v in base['formulationVersions'] if v['productCode']==code)
 total=sum((Decimal(str(c['participationPercent'])) for c in base['formulationIngredients'] if c['productCode']==code and c['versionSequence']==seq),Decimal(0))
 if total!=100:raw_non100.append({'productCode':code,'version':seq,'sourcePercentageSum':str(total)})
assert len(raw_non100)==13
remaining=[]
for code in verification['remainingNutritionCodes']:
 uses=[{'sheet':b['sheet'],'row':r['sourceRow'],'name':r['name']} for b in verification['recipes'] for r in b['missingNutrition'] if r['code']==code]
 remaining.append({'code':code,'status':'DOCUMENTARY_IDENTITY_NOT_CLOSED','scope':'LATEST_SUPPLIED_JUNE_BASE_INTERNAL_VARIANTS_REQUIRE_REVIEW','uses':uses,'needed':'Ficha o vínculo inequívoco a fila/perfil del banco para el código/variante exactos, para la composición elegida en el flujo de revisión de la app.'})
report={
 'baseCommit':'e891300f8acddd24a226e402d45e6a29f12b026e','state':'LOCAL_CONSOLIDATED_REVIEW_CANDIDATE_NOT_PUBLISHED_OR_DEPLOYED',
 'proof':{'run':run.name+'/result.json','allStages':result['stages'],'precision':json.loads((run/'source-precision.json').read_text()),'atomicCases':json.loads((run/'atomic-batch.json').read_text())['testedCases']},
 'resolved':{'newLiteralCandidateMappings':new,'reviewedProfilesConsolidated':66,'arconPreviouslyResolvedRemovedFromStalePendingCount':True,'baselinePercentageBindingDriftFixed':17,'nutrientStorage':'DECIMAL(38,24), widened with all1206previous fixture rows fingerprint-preserved; source precision proven after fresh import','rulesAlreadyAnswered':['Sin normalización; suma exacta100','Merma solo cantidades','Sumar saturadas de todos los ingredientes','ROJO AC150 y HUMO TRUSMOKE OIL EX para piloto, sin aprobación de receta completa','Algoritmo puro del diagrama de grasa/especie']},
 'baselineFixture':{'products':39,'baseActualRecipes':15,'pilotComputationalCoverage':1,'baseRecipesMissingProfiles':14,'wrongRawIngredientCombos':2,'previouslyNoFormulation':22,'candidateProductsRecovered':21,'packagingLedgerWithoutRecipe':1,'productionReadyCertified':0,'currentCatalogMissingNutrition':None,'baseMissingProfiles':base_gaps,'rawSourceNon100':raw_non100},
 'clientEvidencePending':{'olderMissingProfiles':pending['unresolved'],'currentCandidateRecipes':[{'productCode':b['productCode'],'sheet':b['sheet'],'status':'LATEST_SUPPLIED_BASE_PENDING_OPERATIONAL_REVIEW'} for b in source['original33']],'candidateProfileCodesStillUnresolved':remaining,'candidateAdditionalBlocksNotImported':len(source['additionalCandidateBlocks']),'rowScopedIdentityEvidence':json.loads((p/'identidades_nutricionales_por_fila_revision.json').read_text()),'unresolvedIdentityRows':sum(len(r['unresolvedIdentityRows']) for r in verification['recipes']),'candidateMissingCodesAllBlocksAfterLiteralPlan':None,'uncodedOrZeroRows':[{'sheet':b['sheet'],'rows':b['zeroOrMissingCodeRows']} for b in source['original33'] if b['zeroOrMissingCodeRows']],'sourcePercentageRangeOmissions':[{'sheet':b['sheet'],'rows':b['rangeOmittedPercentageRows'],'sum':b['sourcePercentSum']} for b in source['original33'] if b['rangeOmittedPercentageRows']],'sourceQuantityRangeOmissions':[{'sheet':b['sheet'],'rows':b['rangeOmittedQuantityRows']} for b in source['original33'] if b['rangeOmittedQuantityRows']],'sourcePercentDifferences':{'largerThanDiagnosticSerializationTail':26,'tinySerializationCompatibleButStillNotExact':7,'diagnosticIsNotValidationTolerance':True},'bundles':verification['bundles'],'ctn':'ctn_paridad_y_ambiguedades.json; historical comparison retained; later corrections prevail; original TLv4 not available for output parity'},
 'functionalLimits':['Species facts are persisted per reviewed version and consumed by saved/printable preliminary documents; classification incomplete blocks saving/printing. Numeric thresholds remain separate and unchanged.','No additional role/permission or official publication workflow has been invented.'],
 'teamLeadPending':['Restore authorized actual destination backup and compare content/schema/collisions.','Validate operational target-specific data adapter; local fixture seed must never be used on production.','Read the final Docker proof: runtime and herramientas images plus isolated runtime smoke; validate target architecture and infrastructure before deployment.','Use the app to reconcile and operationally approve compositions; June (1).xlsx is confirmed as latest available base, no further general history request.'],
 'documentaryBase':{'latestFile':'Junio (1).xlsx','confirmedByUser':True,'laterDocumentedCorrectionsApply':True,'generalHistoryRequired':False},
 'doNotAddCounts':'13 older profile identities and65/71candidatecodes overlap conceptually; do not sum as current ingredient deficits. Candidate current denominator is unknown.'}
(p/'consolidacion_resoluciones_y_limites.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'olderProfiles':13,'baseProductImpact':14,'newCandidateMappings':13,'candidateCodesUnresolved':65,'currentCatalogMissingNutrition':None,'rawBaseSourceNon100':len(raw_non100)},ensure_ascii=False))
