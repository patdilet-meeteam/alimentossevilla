import { Role } from "@prisma/client";

export { Role };

export const RoleLabels: Record<Role, string> = {
  [Role.ADMIN]: "Administrador",
  [Role.R_AND_D]: "Investigación y Desarrollo",
  [Role.QUALITY]: "Calidad",
  [Role.VIEWER]: "Consulta",
};

export const RoleDescriptions: Record<Role, string> = {
  [Role.ADMIN]:
    "Administración técnica global, gestión de usuarios, auditoría y configuración de la plataforma.",
  [Role.R_AND_D]:
    "Investigación y Desarrollo: creación, edición y simulación de formulaciones, ingredientes y perfiles nutricionales.",
  [Role.QUALITY]:
    "Control de Calidad: consulta y visualización, sin modificar, exportar ni imprimir.",
  [Role.VIEWER]:
    "Finanzas: acceso de Consulta a catálogos, formulaciones aprobadas y reportes.",
};

export const RoleBadgeStyles: Record<
  Role,
  { bg: string; text: string; border: string }
> = {
  [Role.ADMIN]: {
    bg: "bg-purple-50 dark:bg-purple-950/40",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800",
  },
  [Role.R_AND_D]: {
    bg: "bg-blue-50 dark:bg-blue-950/40",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800",
  },
  [Role.QUALITY]: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  [Role.VIEWER]: {
    bg: "bg-slate-50 dark:bg-slate-900/40",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-800",
  },
};

export function hasRole(userRole: Role | undefined | null, allowed: Role[]): boolean {
  if (!userRole) return false;
  return allowed.includes(userRole);
}

export function requireRole(
  userRole: Role | undefined | null,
  allowed: Role[]
): void {
  if (!hasRole(userRole, allowed)) {
    throw new Error(
      `Acceso denegado. Se requiere uno de los siguientes roles: ${allowed
        .map((r) => RoleLabels[r])
        .join(", ")}`
    );
  }
}
