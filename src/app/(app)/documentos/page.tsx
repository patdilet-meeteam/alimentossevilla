import Link from "next/link";
import { FileText, Info } from "lucide-react";
import { listLegalIngredientsPreviews } from "@/app/actions/document-preview-actions";
import { getCurrentUser } from "@/lib/auth/session";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function DocumentosPage() {
  // El layout (app)/layout.tsx ya garantizó que hay un usuario autenticado.
  await getCurrentUser();

  const previews = await listLegalIngredientsPreviews();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1F2933]">Datos para documentos técnicos</h1>
        <p className="text-sm text-muted-foreground">
          Ingredientes obtenidos desde la última formulación aprobada, en orden descendente de participación.
        </p>
      </header>

      <Alert variant="info">
        <Info className="size-4" />
        <AlertTitle>Previsualización no emitida</AlertTitle>
        <AlertDescription>
          Este módulo no genera un documento oficial, no aplica leyendas regulatorias y no sustituye la plantilla aprobada de Textos Legales.
        </AlertDescription>
      </Alert>

      {previews.length === 0 ? (
        <Card className="border-[#D3D8DE]"><CardContent className="py-8 text-sm text-muted-foreground">No hay formulaciones aprobadas para previsualizar.</CardContent></Card>
      ) : previews.map((preview) => (
        <Card key={preview.productId} className="border-[#D3D8DE]">
          <CardHeader>
            <CardTitle className="text-base"><Link href={`/productos/${preview.productId}`} className="hover:underline">{preview.productName}</Link></CardTitle>
            <p className="text-xs text-muted-foreground">{preview.productCode} · versión aprobada v{preview.versionNumber}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {preview.presentations.length === 0 ? <span className="text-xs text-muted-foreground">Sin presentaciones activas</span> : preview.presentations.map((presentation) => (
                <Badge key={presentation.id} variant="outline">{presentation.netWeightGrams} g{presentation.portionGrams ? ` · porción ${presentation.portionGrams} g` : ""}</Badge>
              ))}
            </div>
            <div>
              <h2 className="mb-2 text-sm font-medium">Ingredientes</h2>
              <ol className="list-decimal space-y-1 pl-5 text-sm">
                {preview.ingredients.map((ingredient) => <li key={ingredient.ingredientId}>{ingredient.label} <span className="text-muted-foreground">({ingredient.percentage.toLocaleString("es-CO")}&nbsp;%)</span></li>)}
              </ol>
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
