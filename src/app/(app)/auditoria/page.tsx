import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { History, ShieldCheck, Database } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { getCurrentUser } from "@/lib/auth/session";
import { Role } from "@/lib/auth/roles";
import { redirect } from "next/navigation";

export default async function AuditoriaPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== Role.ADMIN) redirect("/dashboard");

  const events = await db.auditEvent.findMany({
    take: 100,
    orderBy: { timestamp: "desc" },
    include: {
      actor: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-lg bg-white dark:bg-slate-900 border shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Bitácora de Auditoría y Trazabilidad
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Registro inmutable de acciones críticas, mutaciones de datos y eventos de autenticación.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {events.length} {events.length === 1 ? "evento registrado" : "eventos registrados"}
          </Badge>
        </div>
      </div>

      {/* Security & Sanitization Note */}
      <Alert variant="info">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle className="text-xs font-semibold">
          Seguridad y Sanitización Automática
        </AlertTitle>
        <AlertDescription className="text-xs mt-1">
          Todos los eventos persisten de manera inmutable en PostgreSQL. El servicio de auditoría aplica sanitización automática en tiempo de inserción, eliminando y ofuscando contraseñas, hashes, cookies y tokens criptográficos en el campo de metadatos (Ref: <code className="bg-blue-100 dark:bg-blue-950 px-1 py-0.5 rounded font-mono">docs/SECURITY.md</code>).
        </AlertDescription>
      </Alert>

      {/* Events Table */}
      <Card className="bg-white dark:bg-slate-900 border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            Eventos Recientes
          </CardTitle>
          <CardDescription className="text-xs">
            Mostrando los últimos 100 registros cronológicos
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {events.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">
              No hay eventos de auditoría registrados en la base de datos.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha y Hora</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Actor Responsable</TableHead>
                  <TableHead>Detalle / Metadatos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((evt) => (
                  <TableRow key={evt.id} className="text-xs">
                    <TableCell className="font-mono text-slate-500 whitespace-nowrap">
                      {formatDate(evt.timestamp)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-[11px] font-semibold bg-slate-50 dark:bg-slate-800">
                        {evt.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-slate-800 dark:text-slate-200">
                      {evt.entity}
                      {evt.entityId && (
                        <span className="text-slate-400 font-mono ml-1">
                          #{evt.entityId.slice(0, 8)}...
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {evt.actor?.name || evt.actorEmail || "Sistema Automático"}
                        </span>
                        {evt.actorEmail && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {evt.actorEmail}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-md">
                      {evt.metadata ? (
                        <pre className="p-2 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono overflow-x-auto text-slate-700 dark:text-slate-300">
                          {JSON.stringify(evt.metadata, null, 2)}
                        </pre>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
