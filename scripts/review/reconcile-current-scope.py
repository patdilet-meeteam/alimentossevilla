"""Read-only reconciliation. Never selects a current formula or writes to a database."""
import csv,json,collections,decimal,re,sys,zipfile,xml.etree.ElementTree as E,posixpath,hashlib
from pathlib import Path
D=decimal.Decimal;decimal.getcontext().prec=80
folder=Path(sys.argv[1]);workbook=Path(sys.argv[2]);plan=json.loads((folder/'plan_recuperacion_junio_21_productos.json').read_text());by=collections.defaultdict(dict);priorPath=folder/'plan_recuperacion_junio_ensayo_v5_no_vigencia.json';priorPlan=json.loads(priorPath.read_text()) if priorPath.exists() else plan;priorRows={r['sourceSheet']:{row['sourceRow'] for row in r['sourceRows']} for r in priorPlan['recipes']}
for r in csv.DictReader((folder/'recetas_filas.csv').open()):by[r['sheet']][int(r['row'])]=json.loads(r['cells'])
if hashlib.sha256(workbook.read_bytes()).hexdigest()!=plan['sourceSha256']:raise ValueError('Source SHA mismatch')
def val(cs,col,n):return cs.get(f'{col}{n}',{}).get('value','')
def dec(v):
 try:return D(v) if v!='' and D(v).is_finite() else None
 except:return None
def valid_code(code):return bool(code) and code.upper() not in ['0','CREAR','#N/A','#REF!','#VALUE!']
def stable(v):return json.dumps(v,sort_keys=True,ensure_ascii=False)
# Original number formats, not recalculated/rendered values.
ns={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'};z=zipfile.ZipFile(workbook);styles=E.fromstring(z.read('xl/styles.xml'));formats={int(x.get('numFmtId')):x.get('formatCode') for x in styles.find('m:numFmts',ns)};builtins={0:'General',1:'0',2:'0.00',3:'#,##0',4:'#,##0.00',9:'0%',10:'0.00%'};xfs=list(styles.find('m:cellXfs',ns));rels={x.get('Id'):x.get('Target') for x in E.fromstring(z.read('xl/_rels/workbook.xml.rels'))};styleBy={};formulaBy={}
for sh in E.fromstring(z.read('xl/workbook.xml')).find('m:sheets',ns):
 target=rels[sh.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id')];path=posixpath.normpath(posixpath.join('xl',target)) if not target.startswith('/') else target[1:]
 xmlcells=list(E.fromstring(z.read(path)).iter('{'+ns['m']+'}c'));styleBy[sh.get('name')]={c.get('r'):int(c.get('s','0')) for c in xmlcells};anchors={};formulaBy[sh.get('name')]={}
 for c in xmlcells:
  f=c.find('m:f',ns)
  if f is not None and f.text and f.get('t')=='shared':anchors[f.get('si')]=(c.get('r'),f.text)
 for c in xmlcells:
  f=c.find('m:f',ns)
  if f is None:continue
  resolved=f.text or ''
  if not resolved and f.get('t')=='shared':
   anchor,text=anchors[f.get('si')];delta=int(re.search(r'\d+',c.get('r')).group())-int(re.search(r'\d+',anchor).group())
   resolved=re.sub(r'(\$?[A-Z]{1,3})(\$?)(\d+)',lambda m:m[1]+m[2]+str(int(m[3])+(0 if m[2] else delta)),text)
  formulaBy[sh.get('name')][c.get('r')]={'text':f.text or '', 'attributes':dict(f.attrib),'resolvedSharedRowFormula':resolved}

def fmt(sheet,cell):
 sid=styleBy[sheet].get(cell,0);fid=int(xfs[sid].get('numFmtId'));return formats.get(fid,builtins.get(fid,str(fid)))
blocks=[];original=[];packaging=[];omissions=[]
for recipe in plan['recipes']:
 sheet=recipe['sourceSheet'];rows=by[sheet];headers=[]
 for n,cs in rows.items():
  if val(cs,'B',n).strip().upper() in ['CÓDIGO','CODIGO'] and val(cs,'C',n).strip().upper() in ['DESCRIPCIÓN','DESCRIPCION']:
   headers.append(n)
 for h in headers:
  header=rows[h];isRecipe=val(header,'E',h).strip()=='%';endLimit=next((n for n in headers if n>h),max(rows)+1)
  if not isRecipe:
   packaging.append({'productCode':recipe['productCode'],'sheet':sheet,'headerRow':h,'reason':'Encabezado E no es porcentaje de receta; tabla de costos/empaque separada','header':header});continue
  candidates=[]
  for n in range(h+1,endLimit):
   cs=rows.get(n,{});ef=cs.get('E'+str(n),{}).get('formula','');df=cs.get('D'+str(n),{}).get('formula','');match=re.fullmatch(r'\+?SUM\(E(\d+):E(\d+)\)',ef,re.I)
   if match and int(match[1])>=h+1 and int(match[2])<n:
    candidates.append((n,cs,match));break
   if val(cs,'B',n).strip().upper() in ['MERMAS','MATERIAL DE EMPAQUE']:break
  if not candidates:raise ValueError(f'No recipe total {sheet}/{h}')
  t,total,m=candidates[0];material=[]
  for n in range(h+1,t):
   cs=rows.get(n,{});name=val(cs,'C',n).strip();q=dec(val(cs,'D',n));p=dec(val(cs,'E',n));code=val(cs,'B',n).strip()
   if name or (q is not None and p is not None):
    material.append({'sourceRow':n,'sourceCode':code,'sourceName':name,'quantity':str(q) if q is not None else None,'percentage':str(p) if p is not None else None,'cells':cs})
  titleRows=[{'cell':'B'+str(n),'text':val(cs,'B',n)} for n,cs in rows.items() if n<h and n>=max(1,h-4) and len(val(cs,'B',n))>10];title=titleRows[-1]['text'] if titleRows else ''
  ps=sum((D(r['percentage']) for r in material if r['percentage'] is not None),D(0));qs=sum((D(r['quantity']) for r in material if r['quantity'] is not None),D(0));codes=[r['sourceCode'] for r in material if valid_code(r['sourceCode'])];duplicates=[c for c,n in collections.Counter(codes).items() if n>1]
  omitted=[];rangeEnd=int(m[2]);rangeStart=int(m[1]);outside=[r for r in material if not rangeStart<=r['sourceRow']<=rangeEnd]
  if h==headers[0]:
   oldRows=priorRows[sheet];omitted=[r for r in material if r['sourceRow'] not in oldRows];omissions.extend({'sheet':sheet,**r} for r in omitted)
  causes=[]
  if omitted:causes.append('RECOVERY_BUG_OMITTED_CODELESS_REPROCESS_ROWS')
  if outside:causes.append('SOURCE_PERCENT_TOTAL_RANGE_OMITS_MATERIAL_ROWS')
  df=total.get('D'+str(t),{}).get('formula','');dm=re.fullmatch(r'\+?SUM\(D(\d+):D(\d+)\)',df,re.I)
  outsideQ=[r for r in material if dm and not int(dm[1])<=r['sourceRow']<=int(dm[2])]
  if outsideQ:causes.append('SOURCE_QUANTITY_TOTAL_RANGE_OMITS_MATERIAL_ROWS')
  tiny=abs(ps-100)<D('0.0000000001') # diagnostic only, NEVER validation tolerance
  if tiny:causes.append('COMPATIBLE_WITH_BINARY_SERIALIZATION_RESIDUAL_AT_DIAGNOSTIC_SCALE')
  else:causes.append('MATERIAL_SOURCE_PERCENT_TOTAL_NOT_100')
  # Compare independent quantity and percentage columns using base K header or source sum.
  base=dec(val(header,'K',h));differences=[]
  if base and base>0:
   for r in material:
    if r['quantity'] is None or r['percentage'] is None:continue
    expected=base*D(r['percentage'])/100;delta=D(r['quantity'])-expected
    if abs(delta)>D('0.000000000001'):differences.append({'row':r['sourceRow'],'name':r['sourceName'],'quantity':r['quantity'],'percent':r['percentage'],'sourceBaseCell':'K'+str(h),'sourceBaseValue':str(base),'quantityFromSourcePercent':str(expected),'delta':str(delta)})
  if differences:causes.append('SOURCE_QUANTITY_PERCENT_COLUMNS_INCONSISTENT')
  firstFormula=next(({'cell':'E'+str(r['sourceRow']),'formula':r['cells'].get('E'+str(r['sourceRow']),{}).get('formula')} for r in material if r['cells'].get('E'+str(r['sourceRow']),{}).get('formula')),None)
  b={'productCode':recipe['productCode'],'sheet':sheet,'headerRow':h,'titleEvidence':titleRows,'costHeaderEvidence':{k:v for k,v in header.items() if k.startswith(('F','G','H','I'))},'title':title,'sourceVersionLabel':re.findall(r'\bV\d+\b',title),'currentStatus':'VIGENCIA_NO_ACREDITADA','currentEvidence':'No fecha efectiva/aprobación/registro de vigencia explícito en esta tabla. V1/V2, mes de costos, posición y nombre de presentación no prueban vigencia.','productionEligible':False,'firstRecoveredBlock':h==headers[0],'materialRows':material,'sourcePercentSum':str(ps),'sourceQuantitySum':str(qs),'totalCells':total,'percentageTotalCell':'E'+str(t),'percentageTotalFormula':total.get('E'+str(t),{}).get('formula'),'percentageTotalCached':val(total,'E',t),'quantityTotalCell':'D'+str(t),'quantityTotalFormula':df,'quantityTotalCached':val(total,'D',t),'rangeOmittedPercentageRows':[r['sourceRow'] for r in outside],'rangeOmittedQuantityRows':[r['sourceRow'] for r in outsideQ],'oldRecoveryOmittedRows':[r['sourceRow'] for r in omitted],'duplicateCodes':duplicates,'diagnosticCauses':causes,'quantityPercentDifferences':differences,'firstPercentageFormula':firstFormula,'percentageFormulasOriginal':{f'E{r["sourceRow"]}':formulaBy[sheet][f'E{r["sourceRow"]}'] for r in material if f'E{r["sourceRow"]}' in formulaBy[sheet]},'percentNumberFormats':sorted(set(fmt(sheet,'E'+str(r['sourceRow'])) for r in material)),'zeroOrMissingCodeRows':[r['sourceRow'] for r in material if not valid_code(r['sourceCode'])]}
  b['scopeClass']='SUBFORMULA_BASE_NOT_FINISHED_PRODUCT' if 'PP MEZCLA MILANESA' in title else 'ASSEMBLY_WITH_SUBFORMULA' if 'PP APANADO MILANESA' in title else 'SOURCE_VARIANT_WITHOUT_CURRENT_PROOF'
  b['totalDisplayedAt2DecimalsDiagnostic']=str(ps.quantize(D('0.01')))
  b['sharedFormulaNormalizedBySourceSum']=bool(b['percentageFormulasOriginal']) and all(x['resolvedSharedRowFormula'].replace(' ','').startswith('(D') and '/$D$' in x['resolvedSharedRowFormula'] for x in b['percentageFormulasOriginal'].values()) and len(b['percentageFormulasOriginal'])==len(material)
  b['selectionAuthorized']=False
  blocks.append(b)
  if h==headers[0]:original.append(b)
# Source-scope coverage independent of current approval; never interpret as deployed/current gap.
profiles=json.loads((folder/'plan_53_perfiles_respaldados.json').read_text())['profiles'];baseline=json.loads((folder/'dataset_auditoria_payload.json').read_text())['nutritionalProfiles'];required={'FAT_TOTAL','FAT_SAT','FAT_TRANS','PROTEIN','CARBS_TOTAL','SUGAR_TOTAL','SUGAR_ADDED','FIBER','SODIUM'};covered={p['ingredientSiesaCode'] for p in profiles if required<={v['nutrientKey'] for v in p['values']}}|{p['ingredientSiesaCode'] for p in baseline if required<={v['nutrientKey'] for v in p['values']}}
products=[]
for code in sorted({b['productCode'] for b in blocks}):
 bs=[b for b in blocks if b['productCode']==code];sets=[{r['sourceCode'] for r in b['materialRows'] if valid_code(r['sourceCode']) and dec(r['percentage'])!=0} for b in bs];union=set.union(*sets);common=set.intersection(*sets);miss=union-covered
 for b,codes in zip(bs,sets):b['requiredNutrientCodes']=sorted(codes);b['missingProfileCodes']=sorted(codes-covered)
 products.append({'productCode':code,'currentStatus':'VIGENCIA_NO_ACREDITADA','confirmedCurrentRecipes':0,'candidateBlocks':len(bs),'originalRecoveredBlocks':sum(b['firstRecoveredBlock'] for b in bs),'layeredSubformulaProduct':any(b['scopeClass']=='SUBFORMULA_BASE_NOT_FINISHED_PRODUCT' for b in bs),'coverageByScopeClass':[{'scopeClass':scope,'blocks':len([b for b in bs if b['scopeClass']==scope]),'candidateMissingCodes':sorted(set.union(*(set(b['missingProfileCodes']) for b in bs if b['scopeClass']==scope)))} for scope in sorted({b['scopeClass'] for b in bs})],'candidateRequiredCodesUnion':len(union),'candidateTables':[{'sheet':b['sheet'],'headerRow':b['headerRow'],'title':b['title'],'scopeClass':b['scopeClass'],'sourceRows':len(b['materialRows']),'missingProfileCodes':b['missingProfileCodes']} for b in bs],'candidateRequiredCodesCommonToEveryVariant':len(common),'candidateMissingCodesUnion':len(miss),'candidateMissingCodesCommonToEveryVariant':len(common-covered),'candidateMissingCodes':sorted(miss),'zeroOrMissingCodeRows':sum(len(b['zeroOrMissingCodeRows']) for b in bs),'currentCoverage':None,'reason':'No denominador vigente confirmado; rangos candidatos, no carga autorizada.'})
report={'sourceSha256':plan['sourceSha256'],'mode':'READ_ONLY_SCOPE_RECONCILIATION_NO_CURRENT_SELECTION','diagnosticEpsilonIsNotBusinessTolerance':True,'summary':{'originalRecoveredBlocks':len(original),'additionalBlocksInSameSheets':len(blocks)-len(original),'additionalVersionAlternatives':sum(not b['firstRecoveredBlock'] and b['scopeClass']=='SOURCE_VARIANT_WITHOUT_CURRENT_PROOF' for b in blocks),'additionalAssembliesWithSubformulas':sum(b['scopeClass']=='ASSEMBLY_WITH_SUBFORMULA' for b in blocks),'confirmedCurrentBlocks':0,'confirmedHistoricalBlocks':0,'unprovenCurrentOriginalBlocks':len(original),'originalSourceRowsCorrected':sum(len(b['materialRows']) for b in original),'oldRecoveryOmittedRows':len(omissions),'packagingTablesExcluded':len(packaging),'originalBlocksWithSerializationOnlyDiagnostic':sum('COMPATIBLE_WITH_BINARY_SERIALIZATION_RESIDUAL_AT_DIAGNOSTIC_SCALE' in b['diagnosticCauses'] for b in original),'originalBlocksWithMaterialPercentDifference':sum('MATERIAL_SOURCE_PERCENT_TOTAL_NOT_100' in b['diagnosticCauses'] for b in original),'originalBlocksWithPercentRangeOmission':sum(bool(b['rangeOmittedPercentageRows']) for b in original),'originalBlocksWithQuantityRangeOmission':sum(bool(b['rangeOmittedQuantityRows']) for b in original),'duplicateCodeBlocks':sum(bool(b['duplicateCodes']) for b in original),'missingCodeRowsCorrected':sum(len(b['zeroOrMissingCodeRows']) for b in original),'candidateMissingCodesOriginal33':len(set.union(*(set(b['missingProfileCodes']) for b in original))),'candidateMissingCodesAllBlocks':len(set.union(*(set(b['missingProfileCodes']) for b in blocks))),'currentMissingNutrientCodes':None},'products':products,'original33':original,'additionalCandidateBlocks':[b for b in blocks if not b['firstRecoveredBlock']],'packagingTablesExcluded':packaging,'recoveryOmissions':omissions}
(folder/'conciliacion_vigencia_y_sumas.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
with (folder/'clasificacion_33_vigencia_sumas.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['producto','hoja','titulo','vigencia','filas_corregidas','suma_literal_corregida','total_fuente','formula_total','filas_omitidas_recuperacion','filas_fuera_rango_total_porcentaje','filas_fuera_rango_total_cantidad','causas','perfil_faltante_codigo_candidato'])
 for b in original:w.writerow([b['productCode'],b['sheet'],b['title'],b['currentStatus'],len(b['materialRows']),b['sourcePercentSum'],b['percentageTotalCached'],b['percentageTotalFormula'],str(b['oldRecoveryOmittedRows']),str(b['rangeOmittedPercentageRows']),str(b['rangeOmittedQuantityRows']),'|'.join(b['diagnosticCauses']),'|'.join(b['missingProfileCodes'])])
print(json.dumps(report['summary'],ensure_ascii=False,indent=2))
