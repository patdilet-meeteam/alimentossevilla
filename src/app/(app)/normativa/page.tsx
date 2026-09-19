import Link from "next/link";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { listNutritionReadiness } from "@/app/actions/nutrition-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
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
  await getCurrentUser();

  const readiness = await listNutritionReadiness();
  const issueCount = readiness.reduce((total, formulation) => total + formulation.issueCount, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1F2933]">Preparación nutricional</h1>
        <p className="text-sm text-muted-foreground">
          Verificación de insumos para formulaciones aprobadas. No ejecuta cálculos, redondeos ni sellos hasta resolver OQ-022 a OQ-024.
        </p>
      </header>

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
