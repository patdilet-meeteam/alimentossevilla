import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Role } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { formatCostPeriod } from "@/lib/validations/costs";
import { listCostImports, listFormulationCostSummaries } from "@/app/actions/cost-actions";
import { CostImportControls, ApplyCostImportButton } from "@/components/costs/cost-import-controls";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Borrador",
  APPLIED: "Aplicado",
  SUPERSEDED: "Reemplazado",
};

const STATUS_CLASSES: Record<string, string> = {
  DRAFT: "border-amber-200 bg-amber-50 text-amber-800",
  APPLIED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  SUPERSEDED: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

function formatMoney(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function CostosPage() {
  // El layout (app)/layout.tsx ya garantizó que hay un usuario autenticado.
  // Re-leemos el user solo para conocer su rol y ajustar permisos.
  const user = (await getCurrentUser())!;
  const [imports, summaries] = await Promise.all([
    listCostImports(),
    listFormulationCostSummaries(),
  ]);
  const canManage = user.role === Role.ADMIN;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-[#1F2933]">Costos de formulaciones</h1>
        <p className="text-sm text-muted-foreground">
          Carga manual del archivo mensual de costos (sin conexión directa a SIESA). Los códigos repetidos se conservan para trazabilidad y se calcula con la última asignación. El resumen usa solo materia prima con unidad KG y una formulación aprobada; las filas con unidad o costo inválidos impiden aplicar el archivo.
        </p>
      </header>

      <Card className="border-[#D3D8DE]">
        <CardHeader>
          <CardTitle className="text-base">Nueva importación</CardTitle>
        </CardHeader>
        <CardContent>
          <CostImportControls canManage={canManage} />
        </CardContent>
      </Card>

      <Card className="border-[#D3D8DE]">
        <CardHeader>
          <CardTitle className="text-base">Historial de importaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {imports.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aún no hay archivos de costos importados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Periodo</TableHead>
                  <TableHead>Archivo</TableHead>
                  <TableHead>Filas</TableHead>
                  <TableHead>Advertencias</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((costImport) => {
                  const blockers = costImport.items.length;
                  return (
                    <TableRow key={costImport.id}>
                      <TableCell>{formatCostPeriod(costImport.periodStart)}</TableCell>
                      <TableCell>
                        <p className="max-w-64 truncate font-medium">{costImport.sourceFileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {costImport.createdAt.toLocaleDateString("es-CO")}
                        </p>
                      </TableCell>
                      <TableCell>{costImport._count.items}</TableCell>
                      <TableCell>
                        <span className={blockers > 0 ? "font-medium text-amber-700" : ""}>
                          {costImport.warningCount}
                        </span>
                        {blockers > 0 ? (
                          <p className="text-xs text-amber-700">{blockers} bloqueantes visibles</p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={STATUS_CLASSES[costImport.status]}>
                          {STATUS_LABELS[costImport.status] ?? costImport.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p>{costImport.importedBy.name}</p>
                        {costImport.approvedBy ? (
                          <p className="text-muted-foreground">Aplicó: {costImport.approvedBy.name}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        {canManage && costImport.status === "DRAFT" ? (
                          <ApplyCostImportButton importId={costImport.id} disabled={blockers > 0} />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {imports.some((costImport) => costImport.items.length > 0) ? (
        <Alert variant="warning">
          <AlertTriangle className="size-4" />
          <AlertTitle>Hay filas que requieren revisión</AlertTitle>
          <AlertDescription>
            Las filas inválidas o con conflictos requieren revisión antes de aplicar la importación. Cuando un código se repite, se conserva la trazabilidad y se usa la última asignación de costo.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="border-[#D3D8DE]">
        <CardHeader>
          <CardTitle className="text-base">Costo directo por formulación aprobada</CardTitle>
          {summaries.costImport ? (
            <p className="text-xs text-muted-foreground">
              Fuente: {summaries.costImport.sourceFileName} · periodo {formatCostPeriod(summaries.costImport.periodStart)}
            </p>
          ) : null}
        </CardHeader>
        <CardContent>
          {!summaries.costImport ? (
            <p className="text-sm text-muted-foreground">No existe una importación aplicada.</p>
          ) : summaries.formulations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay formulaciones aprobadas para calcular.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>Costo directo</TableHead>
                  <TableHead>Observaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summaries.formulations.map((summary) => (
                  <TableRow key={summary.formulationId}>
                    <TableCell>
                      <Link href={`/productos/${summary.productId}`} className="font-medium text-[#1C4378] hover:underline">
                        {summary.productName}
                      </Link>
                      <p className="text-xs text-muted-foreground">{summary.productCode}</p>
                    </TableCell>
                    <TableCell>v{summary.versionNumber}</TableCell>
                    <TableCell>{summary.baseCalculoKg.toLocaleString("es-CO")} kg</TableCell>
                    <TableCell className="font-medium">{formatMoney(summary.directMaterialCost)}</TableCell>
                    <TableCell>
                      {summary.issues.length === 0 ? (
                        <span className="text-xs text-emerald-700">Completo</span>
                      ) : (
                        <ul className="space-y-1 text-xs text-amber-700">
                          {summary.issues.map((issue) => <li key={issue}>{issue}</li>)}
                        </ul>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Este resultado incluye únicamente materia prima con costo en KG. No incorpora empaques, conversiones, merma, mano de obra ni CIF.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
