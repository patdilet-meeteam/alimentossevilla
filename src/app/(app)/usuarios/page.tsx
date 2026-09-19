import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { RoleLabels, RoleBadgeStyles, Role } from "@/lib/auth/roles";
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
import { Users, Shield, ShieldAlert } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";
import { UserRoleSelector } from "@/components/users/user-role-selector";

export default async function UsuariosPage() {
  const currentUser = await getCurrentUser();
  const isAdmin = currentUser?.role === Role.ADMIN;

  const users = await db.user.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-lg bg-white dark:bg-slate-900 border shadow-xs">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900 text-blue-600 dark:text-blue-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Administración de Usuarios y Roles
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Gestión de cuentas corporativas, perfiles de acceso y estado de activación en la plataforma.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-mono">
            {users.length} {users.length === 1 ? "usuario registrado" : "usuarios registrados"}
          </Badge>
        </div>
      </div>

      {!isAdmin && (
        <Alert variant="warning">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle className="text-xs font-semibold">Modo de Consulta</AlertTitle>
          <AlertDescription className="text-xs mt-1">
            Su usuario actual ({currentUser?.name}) cuenta con rol{" "}
            <strong>{currentUser ? RoleLabels[currentUser.role] : ""}</strong>. La modificación de perfiles y estados de usuario requiere privilegios de <strong>Administrador</strong>.
          </AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card className="bg-white dark:bg-slate-900 border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-600" />
            Cuentas de Usuario en el Sistema
          </CardTitle>
          <CardDescription className="text-xs">
            Listado completo de cuentas sincronizadas con la base de datos de Platform Foundation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Colaborador</TableHead>
                <TableHead>Correo Electrónico</TableHead>
                <TableHead>Rol Asignado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha de Registro</TableHead>
                <TableHead className="text-right">Acciones de Gestión</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const badgeStyle = RoleBadgeStyles[u.role] || RoleBadgeStyles[Role.VIEWER];
                const isCurrent = u.id === currentUser?.id;

                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2">
                        <span>{u.name}</span>
                        {isCurrent && (
                          <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                            Usted
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-300 font-mono text-xs">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center text-[11px] px-2 py-0.5 rounded-full font-medium border",
                          badgeStyle.bg,
                          badgeStyle.text,
                          badgeStyle.border
                        )}
                      >
                        {RoleLabels[u.role] || u.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <Badge variant="success" className="text-[10px]">
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="text-[10px]">
                          Inactivo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {formatDate(u.createdAt)}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserRoleSelector
                        userId={u.id}
                        currentRole={u.role}
                        isActive={u.isActive}
                        isCurrentUser={isCurrent}
                        isAdmin={isAdmin}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
