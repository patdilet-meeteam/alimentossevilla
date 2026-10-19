import pathlib,csv,json,decimal,re,collections,sys
D=decimal.Decimal;decimal.getcontext().prec=70;P=pathlib.Path(sys.argv[1]);maps=json.loads((P/'mapeo_22_productos_hojas.json').read_text());rows=list(csv.DictReader((P/'recetas_filas.csv').open()));by=collections.defaultdict(list)
for r in rows:by[r['sheet']].append(r)
SHA='664f546cfe4a0c339481a642395c2f0212ec095957731fc18c9c86c9e7ee9f27'
def numeric(x):
 try:
  v=D(x);return format(v,'f') if v.is_finite() else None
 except:return None
def extract(sheet):
 result=[];started=False;header=None;meta={};total=None
 for r in by[sheet]:
  cs=json.loads(r['cells']);n=r['row'];v=lambda col:cs.get(col+n,{}).get('value','')
  if 'PRESENTACIÓN EN GRAMOS' in v('B').upper():meta['declaredGrams']=v('C')
  if not started and v('B').strip().upper() in ['CÓDIGO','CODIGO'] and v('C').strip().upper() in ['DESCRIPCIÓN','DESCRIPCION']:started=True;header=cs;continue
  if not started:continue
  if v('B').strip().upper() in ['TOTAL','MERMAS','MATERIAL DE EMPAQUE'] or v('C').strip().upper()=='TOTAL' or any(re.fullmatch(r'\+?SUM\([DE]\d+:[DE]\d+\)',cs.get(k+n,{}).get('formula',''),re.I) for k in ['D','E']):
   if total is None:total={k:v(k) for k in ['D','E']}
   break
  if v('C') or (numeric(v('D')) is not None and numeric(v('E')) is not None):
   code=v('B').strip();
   try:
    if D(code)==D(code).to_integral():code=str(int(D(code)))
   except:pass
   result.append({'sourceRow':int(n),'sourceCode':code,'sourceName':v('C').strip(),'quantity':numeric(v('D')),'percentage':numeric(v('E')),'cells':cs})
 # Metadata independent of first table stop.
 for r in by[sheet]:
  cs=json.loads(r['cells']);n=r['row'];label=cs.get('B'+n,{}).get('value','')
  if 'PRESENTACIÓN EN GRAMOS' in label.upper():meta['declaredGrams']=cs.get('C'+n,{}).get('value','')
 return result,header,meta,total
recipes=[];products=[]
for code,sheets in maps.items():
 variants=[]
 for sheet in sheets:
  material,header,meta,total=extract(sheet)
  if not material:continue
  issues=['CURRENT_VERSION_NOT_ESTABLISHED']
  for r in material:
   if not re.fullmatch('[A-Za-z0-9]{3,16}',r['sourceCode']):issues.append(f"INVALID_CODE_ROW_{r['sourceRow']}")
   if r['quantity'] is None:issues.append(f"MISSING_QUANTITY_ROW_{r['sourceRow']}")
   if r['percentage'] is None:issues.append(f"MISSING_PERCENT_ROW_{r['sourceRow']}")
  ps=sum((D(r['percentage']) for r in material if r['percentage'] is not None),D(0));qs=sum((D(r['quantity']) for r in material if r['quantity'] is not None),D(0));signature=tuple(sorted((r['sourceCode'],r['percentage']) for r in material));variants.append(signature)
  recipes.append({'productCode':code,'sourceSheet':sheet,'sourceSha256':SHA,'header':header,'presentation':meta,'cachedTotalCells':total,'sourceRows':material,'percentageSum':str(ps),'quantitySum':str(qs),'issues':issues,'status':'DRAFT_ONLY','currentStatus':'VIGENCIA_NO_ACREDITADA','productionEligible':False,'sourceUnitEvidence':'ver encabezados originales; no convertida ni inferida en filas sin unidad'})
 distinct=len(set(variants));products.append({'productCode':code,'sourceSheets':sheets,'recoveredSheets':len(variants),'distinctExactPercentageVariants':distinct,'status':'NO_RECIPE_FOUND' if not variants else 'SOURCE_DRAFTS_RECOVERABLE','note':'Libro de explosión de materiales, no receta' if not variants else 'Cada hoja se conserva como borrador de fuente; no se elige versión vigente.'})
 for r in recipes:
  if r['productCode']==code and distinct>1:r['issues'].append('PRESENTATION_PERCENTAGE_VARIANTS_REQUIRE_RECONCILIATION')
# Finished-product bundles: exact row units and source dependencies.
bundles=[]
reverse={s:code for code,sheets in maps.items() for s in sheets};reverse.update({'SCHA CLÁSICA   225 G 9 UND':'scha-cl-sica','MDELA FAIZAN  225 G 14 U SC':None})
for owner,sheets in {'mega-combo-faizan':['MEGA COMBO FAIZAN 675 G','MEGA COMBO FAIZAN 900 G NUEVO','MEGA COMBO FAIZAN 675G X3 '],'s-per-combo-viand':['SÚPER COMBO VIANDÉ 900 G']}.items():
 for sheet in sheets:
  parts,header,meta,total=extract(sheet);members=[]
  for row in parts:
   deps=[]
   for cell in row['cells'].values():
    for match in re.finditer("'([^']+)'!",cell['formula']):
     dep=match.group(1)
     if dep in reverse:deps.append({'sheet':dep,'productCode':reverse[dep]})
   weights=re.findall(r'(\d+(?:[.,]\d+)?)\s*(?:GRAMOS|GRS|GRS\.|GR|G)\b',row['sourceName'],flags=re.I);weight=numeric(weights[-1].replace(',','.')) if weights else None
   members.append({**row,'memberProductCode':next((x['productCode'] for x in deps if x['productCode']),None),'sourceDependencies':deps,'netWeightGrams':weight})
  bundles.append({'productCode':owner,'sourceSheet':sheet,'sourceSha256':SHA,'presentation':meta,'sourceRows':members,'status':'DRAFT_ONLY_FINISHED_PRODUCT_ASSEMBLY','cachedTotals':total,'issues':['Multiple source variants are retained; no approved assortment selected.']})
(P/'plan_recuperacion_junio_21_productos.json').write_text(json.dumps({'mode':'REVIEW_DATA_ONLY_NOT_CURRENT_LOAD_PLAN','currentSelection':None,'productionEligible':False,'sourceSha256':SHA,'sourceFile':'Junio (1).xlsx','products':products,'recipes':recipes,'bundles':bundles,'noNormalization':True,'noApprovals':True},ensure_ascii=False,indent=2))
print('PRODUCTS',len([p for p in products if p['recoveredSheets']]),'RECIPES',len(recipes),'BUNDLES',len(bundles),'COMPONENT_ROWS',sum(len(x['sourceRows']) for x in recipes));print('invalid',[(r['sourceSheet'],r['issues']) for r in recipes if any('MISSING' in x or 'INVALID' in x for x in r['issues'])]);print('EXACT100',sum(D(r['percentageSum'])==100 for r in recipes));print('VARIANTS',[(p['productCode'],p['distinctExactPercentageVariants']) for p in products if p['distinctExactPercentageVariants']>1])
