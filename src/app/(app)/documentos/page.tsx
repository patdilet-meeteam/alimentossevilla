import Link from "next/link";
import { FileText, Info } from "lucide-react";
import { listLegalIngredientsPreviews, listLegalPreviewSnapshots, saveLegalIngredientsPreviewSnapshot } from "@/app/actions/document-preview-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { Role } from "@/lib/auth/roles";
import { formatDate } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PrintPreviewButton } from "@/components/documents/print-preview-button";
import styles from "./documentos.module.css";

export default async function DocumentosPage() {
  // El layout (app)/layout.tsx ya garantizó que hay un usuario autenticado.
  const user = await getCurrentUser();
  const canSaveSnapshot = user?.role === Role.ADMIN || user?.role === Role.R_AND_D;
  const canPrint = user?.role === Role.ADMIN || user?.role === Role.R_AND_D;

  const [previews, snapshots] = await Promise.all([
    listLegalIngredientsPreviews(),
    listLegalPreviewSnapshots(),
  ]);

  return (
    <div className="space-y-6">
      <header className={styles.hideForPrint}>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1F2933]">Datos para documentos técnicos</h1>
        <p className="text-sm text-muted-foreground">
          La lista incluye automáticamente todos los productos con una formulación aprobada ({previews.length} en este momento). Esto no significa que todos tengan datos nutricionales completos ni que sean documentos oficiales. Si falta un perfil, la tarjeta lo indica y no muestra tabla nutricional.
        </p>
      </header>

      <Alert className={styles.hideForPrint} variant="info">
        <Info className="size-4" />
        <AlertTitle>Previsualización no emitida</AlertTitle>
        <AlertDescription>
          Este módulo no genera un documento oficial, no aplica leyendas regulatorias y no sustituye la plantilla aprobada de Textos Legales.
        </AlertDescription>
      </Alert>

      <Alert className={styles.hideForPrint} variant="info">
        <Info className="size-4" />
        <AlertTitle>Versionado preliminar disponible</AlertTitle>
        <AlertDescription>
          I+D y Dirección Técnica pueden guardar una copia inmutable de esta previsualización. Cada copia conserva los datos mostrados, la formulación aprobada de origen, el usuario y la fecha; no constituye una emisión oficial ni un archivo final aprobado.
        </AlertDescription>
      </Alert>

      <Alert className={styles.hideForPrint} variant="warning">
        <Info className="size-4" />
        <AlertTitle>Validación técnica de paridad con Excel</AlertTitle>
        <AlertDescription>
          El cliente ya confirmó que los Excel compartidos son la base del reporte nutricional y deben replicarse 1:1. Esta versión aprobada no tiene una captura de nutrientes del CTN, por lo que muestra los perfiles activos del Banco Nutricional. Al importar y aprobar una nueva versión desde el CTN, se usarán sus valores por fila sin reemplazar los perfiles maestros. La previsualización seguirá marcada para cotejo técnico hasta comparar todos los resultados con el Excel.
        </AlertDescription>
      </Alert>

      {previews.length === 0 ? (
        <Card className="border-[#D3D8DE]"><CardContent className="py-8 text-sm text-muted-foreground">No hay formulaciones aprobadas para previsualizar.</CardContent></Card>
      ) : previews.map((preview) => (
        <Card key={preview.productId} className={`${styles.previewCard} ${canPrint ? "" : styles.printRestricted} border-[#D3D8DE]`}>
          <CardHeader>
            <Badge className={styles.printOnly} variant="outline">PRELIMINAR — NO OFICIAL</Badge>
            <CardTitle className="text-base"><Link href={`/productos/${preview.productId}`} className="hover:underline">{preview.productName}</Link></CardTitle>
            <p className="text-xs text-muted-foreground">{preview.productCode} · versión aprobada v{preview.versionNumber}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {preview.presentations.length === 0 ? <span className="text-xs text-muted-foreground">Sin presentaciones activas</span> : preview.presentations.map((presentation) => (
                <Badge key={presentation.id} variant="outline">{presentation.netWeightGrams} g{presentation.portionGrams ? ` · porción ${presentation.portionGrams} g` : ""}</Badge>
              ))}
            </div>
            {canSaveSnapshot && preview.nutrition.ready && preview.nutrition.calculationSource === "EXCEL_CTN" && (
              <form className={styles.hideForPrint} action={async () => {
                "use server";
                await saveLegalIngredientsPreviewSnapshot(preview.productId);
              }}>
                <Button type="submit" variant="outline" size="sm">
                  <FileText className="mr-2 size-4" />
                  Guardar nueva versión preliminar
                </Button>
              </form>
            )}
            {canPrint && preview.nutrition.ready && preview.nutrition.calculationSource === "EXCEL_CTN" && <div className={styles.hideForPrint}><PrintPreviewButton /></div>}
            {canPrint && preview.nutrition.ready && preview.nutrition.calculationSource !== "EXCEL_CTN" && (
              <p className="text-xs text-amber-700">La salida nutricional de esta versión aún no se puede guardar ni imprimir: debe provenir de una captura del Excel CTN confirmada para la formulación.</p>
            )}
            {snapshots.filter((snapshot) => snapshot.productId === preview.productId).length > 0 && (
              <section aria-label="Historial de versiones preliminares" className={`${styles.hideForPrint} rounded-md border p-3`}>
                <h2 className="mb-2 text-sm font-medium">Versiones preliminares guardadas</h2>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {snapshots.filter((snapshot) => snapshot.productId === preview.productId).map((snapshot) => (
                    <li key={snapshot.id} className="rounded border p-2">
                      <p>v{snapshot.documentVersion} · formulación v{snapshot.sourceFormulationVersionNumber} · {snapshot.createdByEmail} · {formatDate(snapshot.createdAt)}</p>
                      <details className="mt-1">
                        <summary className="cursor-pointer text-[#1C4378]">Consultar soporte guardado</summary>
                        <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-50 p-2 text-[10px] dark:bg-slate-950">{JSON.stringify(snapshot.content, null, 2)}</pre>
                      </details>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <div>
              <h2 className="mb-2 text-sm font-medium">Ingredientes</h2>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {preview.ingredients.map((ingredient) => <li key={ingredient.ingredientId}>{ingredient.label} <span className="text-muted-foreground">({ingredient.percentage.toLocaleString("es-CO")}&nbsp;%)</span></li>)}
              </ol>
            </div>
            <div>
              <h2 className="mb-2 text-sm font-medium">Información nutricional</h2>
      {(() => {
        const readyNutrition = preview.nutrition.ready ? preview.nutrition : null;
        return !readyNutrition ? (
                <p className="text-sm text-amber-700">{preview.nutrition.ready ? "" : preview.nutrition.reason}</p>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground">
                    Fuente de nutrientes: {readyNutrition.calculationSource === "EXCEL_CTN" ? `captura del Excel CTN (${readyNutrition.sourceFileName})` : "perfiles maestros activos del Banco Nutricional"}. Cálculo desde la versión aprobada y parámetros regulatorios v{readyNutrition.regulatoryParametersVersion}. Energía: {readyNutrition.energyKcalPer100g.toFixed(1)} kcal/100 g.
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[520px] text-xs">
                      <thead className="border-b text-left text-muted-foreground"><tr><th className="px-2 py-1">Nutriente</th><th className="px-2 py-1 text-right">Por 100 g</th>{readyNutrition.presentations.filter((p) => p.portionGrams !== null).map((p) => <th key={p.id} className="px-2 py-1 text-right">Por {p.portionGrams} g</th>)}</tr></thead>
                      <tbody>{[
                        ["Grasas totales", "FAT_TOTAL", "g"], ["Grasas saturadas", "FAT_SAT", "g"], ["Grasas trans", "FAT_TRANS", "g"], ["Carbohidratos", "CARBS_TOTAL", "g"], ["Azúcares", "SUGAR_TOTAL", "g"], ["Proteína", "PROTEIN", "g"], ["Sodio", "SODIUM", "mg"],
                      ].map(([label, key, unit]) => <tr key={key} className="border-t"><td className="px-2 py-1 font-medium">{label}</td><td className="px-2 py-1 text-right">{(readyNutrition.per100g[key] ?? 0).toFixed(2)} {unit}</td>{readyNutrition.presentations.filter((p) => p.portionGrams !== null).map((p) => <td key={p.id} className="px-2 py-1 text-right">{(p.values?.[key] ?? 0).toFixed(2)} {unit}</td>)}</tr>)}</tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap gap-2"><span className="text-xs text-muted-foreground">Sellos propuestos:</span>{readyNutrition.activeSeals.length ? readyNutrition.activeSeals.map((seal) => <Badge key={seal} variant="destructive">{seal.replaceAll("_", " ")}</Badge>) : <Badge variant="outline">Sin sellos</Badge>}</div>
                </div>
              );
      })()}
            </div>
            <div>
              <h2 className="mb-2 text-sm font-medium">Alérgenos registrados</h2>
              {preview.allergenTags.length === 0 ? <p className="text-sm text-muted-foreground">No hay etiquetas de alérgenos en los ingredientes de esta formulación.</p> : <div className="flex flex-wrap gap-2">{preview.allergenTags.map((tag) => <Badge key={tag} variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">{tag}</Badge>)}</div>}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
