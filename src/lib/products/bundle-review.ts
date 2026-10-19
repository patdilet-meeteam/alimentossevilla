import {sumExactDecimalStrings as sum} from '@/lib/formulations/exact-decimal-sum';
import {Prisma} from '@prisma/client';
export interface BundleWorkingMember{memberProductId:string|null;units:string;weight:string|null}
export function bundleReviewIssues(raw:unknown,declared:string|null,components:readonly BundleWorkingMember[]):string[]{
 const record=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Record<string,unknown>:{};const working=record.working&&typeof record.working==='object'?record.working as Record<string,unknown>:{};const issues:string[]=[];
 if(record.kind!=='BUNDLE_WORKING_REVIEW'||!working.reference)issues.push('Prepare y documente una copia de trabajo del conjunto');
 if(!components.length||components.some(c=>!c.memberProductId||c.weight===null))issues.push('Faltan identidades o pesos de miembros; no se sustituyen por cero');
 const Exact=Prisma.Decimal.clone({precision:100});try{if(components.some(c=>new Exact(c.units).lte(0)||c.weight!==null&&new Exact(c.weight).lte(0)))issues.push('Las unidades y pesos de miembros incluidos deben ser positivos');const total=components.reduce((n,c)=>n.plus(new Exact(c.units).times(c.weight??0)),new Exact(0));if(declared===null||!total.eq(declared))issues.push(`El peso declarado no coincide con los miembros: subtotal conocido ${total.toString()}g`);}catch{issues.push('Cantidades inválidas');}
 const signature=(rows:readonly BundleWorkingMember[])=>JSON.stringify(rows.map(c=>({memberProductId:c.memberProductId,units:sum([c.units]),weight:c.weight===null?null:sum([c.weight])})).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));
 if(Array.isArray(working.components)&&signature(working.components as BundleWorkingMember[])!==signature(components))issues.push('Los miembros cambiaron después de revisar; prepare otra copia');if((working.declared==null?null:sum([String(working.declared)]))!==(declared===null?null:sum([declared])))issues.push('El peso cambió después de revisar');return issues;
}
