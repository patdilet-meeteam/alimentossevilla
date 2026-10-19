import { sourceRowIdentityReview } from "@/lib/nutrition/source-identity-guards";
import { sumExactDecimalStrings } from "@/lib/formulations/exact-decimal-sum";
export interface ReviewIngredient {
  code: string; name: string; percentage: string; quantity: string | null;
  activeProfileCount: number; missingNutrients: string[];
}
function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function sameDecimal(a: string, b: string) {
  try { return sumExactDecimalStrings([a]) === sumExactDecimalStrings([b]); } catch { return false; }
}
export function FormulationReviewEvidence({ snapshot, ingredients }: { snapshot: unknown; ingredients: ReviewIngredient[] }) {
  const source = record(snapshot);
  const sourceRows = Array.isArray(source?.sourceRows) ? source.sourceRows.map(record).filter((r): r is Record<string, unknown> => r !== null) : [];
  const nutrientNames: Record<string, string> = { FAT_TOTAL: "grasa total", FAT_SAT: "grasa saturada", FAT_TRANS: "grasa trans", PROTEIN: "proteína", CARBS_TOTAL: "carbohidratos", SUGAR_TOTAL: "azúcares totales", SUGAR_ADDED: "azúcares añadidos", FIBER: "fibra", SODIUM: "sodio" };
  const missing = ingredients.filter(i => i.activeProfileCount !== 1 || i.missingNutrients.length);
  return <section aria-label="Revisión de fuente y cobertura" className="min-w-0 scroll-mt-20 space-y-3 rounded border bg-slate-50 p-3 text-sm [overflow-wrap:anywhere]">
    <h3 className="font-semibold">Revisión de fuente y cobertura</h3>
    {source ? <>
      <p>Fuente: {String(source.sourceSheet ?? "Hoja sin identificar")} · SHA-256: <span className="break-all font-mono text-xs">{String(source.sourceSha256 ?? "Sin huella registrada")}</span></p>
      <p>Vigencia: {source.currentStatus === "VIGENCIA_NO_ACREDITADA" || source.productionEligible === false ? "No acreditada; variante revisable" : "Consultar evidencia de liberación de esta versión"}. La selección en pantalla no declara una variante vigente.</p>
      <details><summary className="cursor-pointer font-medium">Filas originales, reprocesos y diferencias ({sourceRows.length})</summary>
        <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead><tr><th>Fila</th><th>Código fuente</th><th>Descripción fuente</th><th>Cantidad fuente</th><th>% fuente</th><th>Conciliación</th></tr></thead><tbody>{sourceRows.map((row, index) => {
          const code = String(row.sourceCode ?? ""); const name = String(row.sourceName ?? "");
          const identity = sourceRowIdentityReview(String(source.sourceSha256 ?? ""), String(source.sourceSheet ?? ""), Number(row.sourceRow), code, name);
          const linked = identity ? [] : ingredients.filter(i => i.code === code && code !== "0" && code !== "");
          const percentage = row.percentage === null ? null : String(row.percentage ?? "");
          const quantity = row.quantity === null ? null : String(row.quantity ?? "");
          const status = linked.length !== 1 ? "Identidad pendiente; fila conservada" : !percentage || !sameDecimal(percentage, linked[0].percentage) || (quantity !== null && linked[0].quantity !== null && !sameDecimal(quantity, linked[0].quantity)) ? "Diferencia entre fuente y versión" : "Valores coincidentes";
          return <tr key={index} className="border-t"><td>{String(row.sourceRow ?? "")}</td><td>{code || "Sin código"}</td><td>{name}{/REPROCESO/i.test(name) ? " · Reproceso" : ""}</td><td>{quantity ?? "Sin dato"}</td><td>{percentage ?? "Sin dato"}</td><td>{status}{identity ? <p>{identity.reason}{identity.reviewedNutrientSource ? ` Fuente nutricional documentada solo para esta fila: TN OFICIAL ${identity.reviewedNutrientSource.sourceRow}; no es perfil global ni aprobación.` : " No se reutiliza un perfil por código."}</p> : null}</td></tr>;
        })}</tbody></table></div>
        <p className="mt-2 text-xs">Una fila sin código no se elimina ni se sustituye por otro ingrediente. Las cantidades mantienen la unidad y base de la fuente.</p>
      </details>
      <details><summary className="cursor-pointer">Encabezados, fórmulas y totalizadores originales</summary><pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">{JSON.stringify({ header: source.header, totals: source.sourceTotalsEvidence ?? source.cachedTotalCells, rows: sourceRows.map(row => ({ row: row.sourceRow, cells: row.cells })) }, null, 2)}</pre></details>
    </> : <p>No hay captura de receta fuente vinculada a esta versión.</p>}
    <p>{!ingredients.length ? "No hay ingredientes vinculados para evaluar la cobertura nutricional." : missing.length ? `${missing.length} ingredientes requieren revisión de su perfil nutricional.` : "Los ingredientes vinculados tienen un perfil activo con los nutrientes críticos; esto no acredita vigencia ni aprobación."}</p>
    {missing.length ? <ul className="list-disc pl-5">{missing.map(i => <li key={i.code}>{i.code} · {i.name}: {i.activeProfileCount !== 1 ? `${i.activeProfileCount} perfiles activos; se requiere una identidad inequívoca` : `Faltan nutrientes: ${i.missingNutrients.map(key => nutrientNames[key] ?? key).join(", ")}`}</li>)}</ul> : null}
  </section>;
}
