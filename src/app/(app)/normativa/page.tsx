import Link from "next/link";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { listNutritionReadiness } from "@/app/actions/nutrition-actions";
import { getRegulatoryParametersForPage, listRegulatoryParameterVersions, saveRegulatoryParameterVersion } from "@/app/actions/regulatory-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { Role } from "@/lib/auth/roles";
import { formatDate } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ISSUE_LABELS = {
  MISSING_ACTIVE_PROFILE: "Sin perfil nutricional activo",
  MULTIPLE_ACTIVE_PROFILES: "Más de un perfil activo",
  ACTIVE_PROFILE_WITHOUT_VALUES: "Perfil activo sin valores",
} as const;

export default async function NormativaPage() {
  // El layout (app)/layout.tsx ya garantizó que hay un usuario autenticado.
  const user = await getCurrentUser();
  const canEditRegulatoryParameters = user?.role === Role.ADMIN;

  const [readiness, currentParameters, parameterVersions] = await Promise.all([
    listNutritionReadiness(),
    getRegulatoryParametersForPage(),
    listRegulatoryParameterVersions(),
  ]);
  const issueCount = readiness.reduce((total, formulation) => total + formulation.issueCount, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1F2933]">Preparación nutricional</h1>
        <p className="text-sm text-muted-foreground">
          Esta pantalla revisa si las formulaciones aprobadas tienen perfiles nutricionales activos y permite consultar/versionar los umbrales regulatorios. No calcula el reporte aquí; el resultado y su fuente se consultan en el producto y en Documentos Técnicos.
        </p>
      </header>

      <Card className="border-[#D3D8DE]">
        <CardHeader>
          <CardTitle className="text-base">Parámetros regulatorios versionados</CardTitle>
          <p className="text-xs text-muted-foreground">
            Versión activa v{currentParameters.version} · registrada por {currentParameters.createdByEmail} · {formatDate(currentParameters.createdAt)}. Solo el Administrador/Director Técnico puede guardar una nueva versión. Los cambios rigen para cálculos futuros; las versiones/documentos guardados no se reescriben.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 text-sm sm:grid-cols-3">
            <p>Sodio: <strong>{currentParameters.thresholds.SODIUM_MG_PER_100G} mg/100 g</strong></p>
            <p>Azúcares y grasa saturada: <strong>{currentParameters.thresholds.ENERGY_PERCENTAGE_THRESHOLD}%</strong> de energía</p>
            <p>Grasas trans: <strong>{currentParameters.thresholds.FAT_TRANS_THRESHOLD}%</strong> de energía</p>
          </div>
          {canEditRegulatoryParameters && (
            <form action={saveRegulatoryParameterVersion} className="grid gap-3 rounded-md border p-4 md:grid-cols-3">
              <label className="space-y-1 text-xs font-medium">Sodio (mg/100 g)
                <input name="sodiumMgPer100g" type="number" min="0" max="100000" step="0.0001" required defaultValue={currentParameters.thresholds.SODIUM_MG_PER_100G} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
              </label>
              <label className="space-y-1 text-xs font-medium">Azúcares y grasa saturada (% energía)
                <input name="energyPercentageThreshold" type="number" min="0" max="100" step="0.0001" required defaultValue={currentParameters.thresholds.ENERGY_PERCENTAGE_THRESHOLD} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
              </label>
              <label className="space-y-1 text-xs font-medium">Grasas trans (% energía)
                <input name="fatTransPercentageThreshold" type="number" min="0" max="100" step="0.0001" required defaultValue={currentParameters.thresholds.FAT_TRANS_THRESHOLD} className="h-9 w-full rounded-md border bg-background px-3 text-sm" />
              </label>
              <button type="submit" className="h-9 rounded-md bg-[#1C4378] px-4 text-sm font-medium text-white hover:bg-[#16365F] md:col-span-3 md:justify-self-start">Guardar nueva versión</button>
            </form>
          )}
          <details>
            <summary className="cursor-pointer text-sm font-medium">Historial de parámetros ({parameterVersions.length})</summary>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {parameterVersions.map((version) => (
                <li key={version.id}>v{version.version} · sodio {Number(version.sodiumMgPer100g)} mg/100 g · energía {Number(version.energyPercentageThreshold)}% · trans {Number(version.fatTransPercentageThreshold)}% · {version.createdByEmail} · {formatDate(version.createdAt)}</li>
              ))}
            </ul>
          </details>
        </CardContent>
      </Card>

      {issueCount > 0 ? (
        <Alert variant="warning">
          <AlertTriangle className="size-4" />
          <AlertTitle>Hay {issueCount} hallazgo(s) que impiden una selección confiable de perfiles</AlertTitle>
          <AlertDescription>
            Corrija los datos de ingredientes o confirme la fuente canónica. La plataforma no selecciona perfiles múltiples automáticamente.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="success">
          <CheckCircle2 className="size-4" />
          <AlertTitle>Los perfiles activos disponibles no presentan ambigüedades estructurales</AlertTitle>
          <AlertDescription>Esto no reemplaza la validación funcional de fórmulas, merma, redondeos ni umbrales regulatorios.</AlertDescription>
        </Alert>
      )}

      {readiness.length === 0 ? (
        <Card className="border-[#D3D8DE]">
          <CardContent className="py-8 text-sm text-muted-foreground">
            No hay formulaciones aprobadas para revisar.
          </CardContent>
        </Card>
      ) : (
        readiness.map((formulation) => (
          <Card key={formulation.formulationId} className="border-[#D3D8DE]">
            <CardHeader>
              <CardTitle className="text-base">
                <Link href={`/productos/${formulation.productId}`} className="hover:underline">{formulation.productName}</Link>
              </CardTitle>
              <p className="text-xs text-muted-foreground">{formulation.productCode} · versión aprobada v{formulation.versionNumber}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {formulation.ingredients.map((ingredient) => (
                <div key={ingredient.ingredientId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm">
                  <div>
                    <p className="font-medium">{ingredient.ingredientName}</p>
                    <p className="text-xs text-muted-foreground">{ingredient.siesaCode} · {ingredient.activeProfileCount} perfil(es) activo(s) · {ingredient.activeValueCount} valor(es)</p>
                  </div>
                  {ingredient.issues.length === 0 ? (
                    <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800">Listo para validación funcional</Badge>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {ingredient.issues.map((issue) => (
                        <Badge key={issue} variant="outline" className="border-amber-200 bg-amber-50 text-amber-800">{ISSUE_LABELS[issue]}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
